'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getHarryTeamMember, getServiceById, searchAvailability, createSubscriptionBooking, getSubscriptionUsage } from '../../actions';
import styles from '../book.module.css';
import Calendar from '../Calendar';

const Icons = {
    ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
    Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
};

function SubscriptionBookingContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId') || '';
  
  const [step, setStep] = useState(2); // Start directly at Date/Time Selection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [harry, setHarry] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({ givenName: '', familyName: '', emailAddress: '', phoneNumber: '' });
  const [notes, setNotes] = useState('');

  // 1. Initial Load: Fetch Harry and the specific hidden service
  useEffect(() => {
    async function init() {
        setLoading(true);
        try {
            const barber = await getHarryTeamMember();
            if (!barber) throw new Error("Could not assign Barber.");
            setHarry(barber);

            // Determine service based on planId
            const serviceId = planId.includes('beard') ? '6ZJHSA7CEIIK2MAYR4OBTNUW' : 'IG3KC7ZQIDZFPETUY3UWRPTU';
            const srv = await getServiceById(serviceId);
            if (!srv) throw new Error("Could not find subscription service.");
            setService(srv);

            // Fetch dynamic math usage
            const usageData = await getSubscriptionUsage();
            setUsage(usageData);

            if (!usageData.isActive) {
                throw new Error("You do not have a valid subscription.");
            }
            if (usageData.remainingCredits === undefined || usageData.remainingCredits <= 0) {
                const resetMsg = usageData.resetDate ? ` It resets on ${new Date(usageData.resetDate).toLocaleDateString()}.` : "";
                throw new Error("You have no remaining subscription credits for this month." + resetMsg);
            }
                        
            // Try to prefill user details from local storage or wait for them to type
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setCustomerInfo({
                    givenName: profile?.first_name || user.user_metadata?.first_name || '',
                    familyName: profile?.last_name || user.user_metadata?.last_name || '',
                    emailAddress: user.email || '',
                    phoneNumber: profile?.phone || user.user_metadata?.phone || ''
                });
            }
        } catch (err: any) {
            setError(err.message || 'Initialization failed.');
        } finally {
            setLoading(false);
        }
    }
    init();
  }, [planId]);

  // 2. Fetch Availability when date changes
  useEffect(() => {
    if (selectedDate && service && harry && usage) {
        // Credit cycle boundary validation
        const selected = new Date(`${selectedDate}T00:00:00`);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const resetDate = usage.resetDate ? new Date(usage.resetDate) : null;

        if (selected < today) {
             setError("Please select a valid future date.");
             setAvailabilities([]);
             return;
        }

        if (resetDate && selected >= resetDate) {
             setError(`Please select a date within your current billing cycle (before ${resetDate.toLocaleDateString()}). For later dates, wait until your credits reset.`);
             setAvailabilities([]);
             return;
        }

        setError('');
        setLoading(true);
        const start = new Date(`${selectedDate}T00:00:00`).toISOString();
        const end = new Date(`${selectedDate}T23:59:59`).toISOString();
        
        searchAvailability(start, end, service.id, harry.id)
            .then(data => setAvailabilities(data))
            .catch(() => setError("Could not load availability."))
            .finally(() => setLoading(false));
    }
  }, [selectedDate, service, harry, usage]);

  const handleBook = async () => {
    if (!service || !harry || !selectedTime) return;
    if (!customerInfo.emailAddress || !customerInfo.givenName || !customerInfo.phoneNumber) {
        setError("Please fill out all required fields.");
        return;
    }

    setLoading(true);
    try {
        await createSubscriptionBooking(
            service.id,
            service.version,
            harry.id,
            selectedTime,
            customerInfo,
            notes
        );
        setStep(4); // Success
    } catch (err: any) {
        setError("Booking failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const getGroupedTimes = () => {
      const groups = { Morning: [] as any[], Afternoon: [] as any[], Evening: [] as any[] };
      availabilities.forEach(slot => {
          const h = new Date(slot.startAt).getHours();
          if (h < 12) groups.Morning.push(slot);
          else if (h < 17) groups.Afternoon.push(slot);
          else groups.Evening.push(slot);
      });
      return groups;
  };

  return (
    <div className={styles.container}>
      {step === 4 ? (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} style={{ textAlign: 'center', fontSize: '2rem' }}>Booking Confirmed!</h3>
            </div>
            <div className={styles.cardContent} style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', color: '#a3a3a3' }}>You used 1 credit to book {service?.name} with {harry?.name}.</p>
                <p style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>
                    {new Date(selectedDate).toLocaleDateString()} at {new Date(selectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <button className={styles.fullWidthBtn} onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</button>
            </div>
        </div>
      ) : (
        <>
            {step === 3 && (
                <button className={styles.ghostBtn} onClick={() => setStep(2)}>
                    <span style={{ marginRight: '0.5rem', display: 'flex' }}><Icons.ArrowLeft /></span>
                    Back
                </button>
            )}

            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 className={styles.headerTitle}>
                    {step === 2 && "Select Date & Time"}
                    {step === 3 && "Confirm Subscription Booking"}
                </h1>
                <p className={styles.headerSubtitle} style={{ color: 'var(--primary-gold)' }}>
                    Using 1 Subscription Credit
                </p>
            </div>

            {error && (
                <div className={styles.alert} style={{ borderColor: '#7f1d1d', color: '#ef4444' }}>
                    <div className={styles.alertDescription}>{error}</div>
                </div>
            )}

            {step === 2 && service && harry && (
                <div className={styles.stack}>
                    <div className={styles.alert}>
                        <div className={styles.alertDescription}>
                            <strong>Auto-Assigned:</strong> {service.name} with {harry.name}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Select Date</h3></div>
                        <div className={styles.cardContent} style={{ display: 'flex', justifyContent: 'center' }}>
                            <Calendar value={selectedDate} onChange={(d) => { setSelectedDate(d); setSelectedTime(''); }} />
                        </div>
                    </div>

                    {selectedDate && (
                        <div className={styles.card}>
                             <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Select Time</h3>
                                <p className={styles.cardDescription}>{new Date(selectedDate).toDateString()}</p>
                             </div>
                             <div className={styles.cardContent}>
                                 {loading ? <p>Loading slots...</p> : (
                                     <>
                                        {availabilities.length === 0 && <p style={{textAlign:'center', color: '#666'}}>No slots available.</p>}
                                        {Object.entries(getGroupedTimes()).map(([label, slots]) => slots.length > 0 && (
                                            <div key={label} style={{ marginBottom: '1.5rem' }}>
                                                <h4 className={styles.timeGroupTitle}>{label}</h4>
                                                <div className={styles.timeGrid}>
                                                    {slots.map((slot, i) => (
                                                        <button 
                                                            key={i} 
                                                            className={`${styles.timeSlotBtn} ${selectedTime === slot.startAt ? styles.selected : ''}`}
                                                            onClick={() => { setSelectedTime(slot.startAt); setStep(3); }}
                                                        >
                                                            {new Date(slot.startAt).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                     </>
                                 )}
                             </div>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className={styles.checkoutGrid}>
                    <div className={styles.stack}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Appointment Summary</h3></div>
                            <div className={styles.cardContent}>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Barber:</span><span className={styles.summaryValue}>{harry?.name}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Service:</span><span className={styles.summaryValue}>{service?.name}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Date:</span><span className={styles.summaryValue}>{selectedDate}</span></div>
                                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Time:</span><span className={styles.summaryValue}>{selectedTime && new Date(selectedTime).toLocaleTimeString()}</span></div>
                                <div className={styles.summaryTotal}>
                                    <span className={styles.summaryTotalLabel}>Total:</span>
                                    <span className={styles.summaryTotalValue}>$0.00 (1 Credit)</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.alert}>
                             <span style={{ marginRight: '0.75rem' }}><Icons.Info /></span>
                             <div className={styles.alertDescription}>
                                 <p style={{marginBottom: '0.5rem'}}>Please provide at least 24 hours notice if you need to cancel.</p>
                             </div>
                        </div>
                    </div>

                    <div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>Your Details</h2>
                        </div>
                        <div className={styles.formItem}><label className={styles.formLabel}>First Name</label><input className={styles.input} value={customerInfo.givenName} onChange={e => setCustomerInfo({...customerInfo, givenName: e.target.value})} /></div>
                        <div className={styles.formItem}><label className={styles.formLabel}>Last Name</label><input className={styles.input} value={customerInfo.familyName} onChange={e => setCustomerInfo({...customerInfo, familyName: e.target.value})} /></div>
                        <div className={styles.formItem}><label className={styles.formLabel}>Email</label><input className={styles.input} type="email" value={customerInfo.emailAddress} onChange={e => setCustomerInfo({...customerInfo, emailAddress: e.target.value})} /></div>
                        <div className={styles.formItem}><label className={styles.formLabel}>Phone</label><input className={styles.input} value={customerInfo.phoneNumber} onChange={e => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})} /></div>
                        <div className={styles.formItem}><label className={styles.formLabel}>Notes (Optional)</label><textarea className={styles.textarea} value={notes} onChange={e => setNotes(e.target.value)} /></div>

                        <button className={styles.fullWidthBtn} onClick={handleBook} disabled={loading}>
                            {loading ? "Confirming..." : "Confirm Booking (Deduct 1 Credit)"}
                        </button>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
}

export default function SubscriptionBookingPage() {
    return (
        <Suspense fallback={<div style={{textAlign: 'center', padding: '4rem', color: 'var(--primary-gold)'}}>Loading Booking Interface...</div>}>
            <SubscriptionBookingContent />
        </Suspense>
    );
}
