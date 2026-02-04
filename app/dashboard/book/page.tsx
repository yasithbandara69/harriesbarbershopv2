'use client';

import { useState, useEffect } from 'react';
import { listTeamMembers, listServices, searchAvailability, getServiceById } from '@/app/actions';
import { createMemberBooking } from './actions';
import { createClient } from '@/utils/supabase/client';
import { SUBSCRIPTION_DATA } from '@/app/components/subscription-data';
import styles from '@/app/book/book.module.css';
import Calendar from '@/app/book/Calendar';
import Link from 'next/link';

const Icons = {
    ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
};

export default function MemberBookingPage() {
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  
  // Member Context
  const [memberPlan, setMemberPlan] = useState<any>(null);
  const [serviceDetails, setServiceDetails] = useState<any>(null);

  // Data
  const [availabilities, setAvailabilities] = useState<any[]>([]);

  // Selection
  const [selectedBarber, setSelectedBarber] = useState<any>(null); // We will set this to Harry
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null); // Contains the teamMemberId for the slot
  const [notes, setNotes] = useState('');
  
  // User Info
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    async function init() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }

        // Fetch Subscription
        const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .single();

        if (!sub || sub.credits < 1) {
            setError("You do not have any active booking credits.");
            setLoading(false);
            return;
        }

        // Find Plan Config
        let foundPlan = null;
        for (const cat of SUBSCRIPTION_DATA) {
            const p = cat.plans.find(x => x.squarePlanId === sub.plan_id);
            if (p) {
                foundPlan = p;
                break;
            }
        }

        if (!foundPlan || !foundPlan.serviceId) {
            setError("Could not identify your membership service.");
            setLoading(false);
            return;
        }

        setMemberPlan(foundPlan);
        
        try {
            // Retrieve the specific service (works even if hidden)
            // @ts-ignore
            const svc = await getServiceById(foundPlan.serviceId);
            
            if (!svc) {
                throw new Error("Service not found in catalog: " + foundPlan.serviceId);
            }
            setServiceDetails(svc);

            // Hardcoded ID for Harry (Provided by User)
            const HARRYS_ID = "TMMZpLgW00Z1uRNm";
            setSelectedBarber({ id: HARRYS_ID, name: "Harry" });
            
            setUserInfo({
                givenName: user.user_metadata.first_name || '',
                familyName: user.user_metadata.last_name || '',
                emailAddress: user.email || '',
                phoneNumber: user.user_metadata.phone || ''
            });

        } catch (e) {
            console.error(e);
            setError("Failed to initialize booking system.");
        } finally {
            setLoading(false);
        }
    }
    init();
  }, []);

  // Fetch Availability when Date selected (Search ONLY Harry)
  useEffect(() => {
    if (selectedDate && serviceDetails && selectedBarber) {
        setLoading(true);
        const start = new Date(`${selectedDate}T00:00:00`); 
        const end = new Date(`${selectedDate}T23:59:59`);
        
        // Pass selectedBarber.id (Harry) to restrict search
        searchAvailability(start.toISOString(), end.toISOString(), serviceDetails.id, selectedBarber.id)
            .then((data: any) => {
                setAvailabilities(data);
                setLoading(false);
            })
            .catch((e: any) => {
                console.error(e);
                setLoading(false);
            });
    }
  }, [selectedDate, serviceDetails, selectedBarber]);

  const handleSlotSelect = (slot: any) => {
      setSelectedTime(slot.startAt);
      setSelectedSlot(slot); // This slot object has teamMemberId
      setStep(2);
  };

  const handleBook = async () => {
      setLoading(true);
      try {
          // Use the teamMemberId from the selected slot, or fallback to the selected barber (Harry)
          // The Square API availability slot might not always return the team member ID if we filtered by it.
          const staffId = selectedSlot.teamMemberId || selectedBarber?.id;
          
          if (!staffId) {
              throw new Error("Could not assign a team member for this slot.");
          }

          await createMemberBooking(
              serviceDetails.id,
              serviceDetails.version,
              staffId,
              selectedTime,
              userInfo,
              notes
          );
          setStep(3); // Success
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  if (loading && !memberPlan) return <div className={styles.container}><p style={{textAlign:'center', color:'white'}}>Loading membership...</p></div>;
  
  if (error) {
      return (
        <div className={styles.container}>
            <div className={styles.alert} style={{ borderColor: 'red', color: 'red' }}>
                {error}
            </div>
            <Link href="/dashboard" style={{ color: 'var(--primary-gold)', display: 'block', textAlign:'center', marginTop:'1rem' }}>Return to Dashboard</Link>
        </div>
      );
  }

  const getGroupedTimes = () => {
    const groups = { Morning: [] as any[], Afternoon: [] as any[], Evening: [] as any[] };
    // We might have duplicate timestamps if multiple barbers are available at the same time.
    // We should enable the user to pick the TIME, and we pick ONE suitable slot.
    // Let's deduplicate by startAt.
    const seenTimes = new Set();
    const uniqueSlots: any[] = [];
    
    availabilities.forEach(slot => {
        if (!seenTimes.has(slot.startAt)) {
             seenTimes.add(slot.startAt);
             uniqueSlots.push(slot);
        }
    });

    uniqueSlots.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    uniqueSlots.forEach(slot => {
        const h = new Date(slot.startAt).getHours();
        if (h < 12) groups.Morning.push(slot);
        else if (h < 17) groups.Afternoon.push(slot);
        else groups.Evening.push(slot);
    });
    return groups;
  };

  return (
    <div className={styles.container}>
        {step === 3 ? (
             <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle} style={{ textAlign: 'center', fontSize: '2rem' }}>Booking Confirmed!</h3>
                </div>
                <div className={styles.cardContent} style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem', color: '#a3a3a3' }}>
                        Your credit has been redeemed.
                    </p>
                    <p style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>
                        {new Date(selectedDate).toLocaleDateString()} at {new Date(selectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <Link href="/dashboard" className={styles.fullWidthBtn} style={{display:'inline-block', lineHeight:'3rem', textDecoration:'none', color:'black'}}>Back to Dashboard</Link>
                </div>
            </div>
        ) : (
            <>
                 {step > 1 && (
                    <button className={styles.ghostBtn} onClick={() => setStep(step - 1)}>
                        <span style={{ marginRight: '0.5rem', display: 'flex' }}><Icons.ArrowLeft /></span>
                        Back
                    </button>
                )}

                <h1 className={styles.headerTitle} style={{textAlign:'center', marginBottom: '0.5rem'}}>Member Booking</h1>
                <p className={styles.headerSubtitle} style={{textAlign:'center', marginBottom: '2rem'}}>
                    Redeeming credit for: <span style={{color:'var(--primary-gold)'}}>{serviceDetails?.name}</span>
                </p>

                {/* STEP 1: DATE & TIME */}
                {step === 1 && (
                    <div className={styles.stack}>
                         <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Select Date & Time</h3>
                            </div>
                            <div className={styles.cardContent} style={{ display: 'flex', justifyContent: 'center', flexDirection:'column', alignItems:'center' }}>
                                <Calendar value={selectedDate} onChange={(d) => { setSelectedDate(d); setSelectedTime(''); }} />
                                
                                {selectedDate && (
                                    <div style={{width:'100%', marginTop:'2rem'}}>
                                        {loading ? <p>Loading slots...</p> : (
                                            <>
                                                {availabilities.length === 0 && <p style={{textAlign:'center', color:'#666'}}>No slots available.</p>}
                                                {Object.entries(getGroupedTimes()).map(([label, slots]) => slots.length > 0 && (
                                                    <div key={label} style={{ marginBottom: '1.5rem' }}>
                                                        <h4 className={styles.timeGroupTitle}>{label}</h4>
                                                        <div className={styles.timeGrid}>
                                                            {slots.map((slot, i) => (
                                                                <button 
                                                                    key={i} 
                                                                    className={`${styles.timeSlotBtn} ${selectedTime === slot.startAt ? styles.selected : ''}`}
                                                                    onClick={() => handleSlotSelect(slot)}
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
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: CONFIRM */}
                {step === 2 && (
                    <div className={styles.stack}>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>Confirm Booking</h3>
                                </div>
                                <div className={styles.cardContent}>
                                    <p style={{marginBottom:'1rem'}}>
                                        Confirm booking on <strong>{new Date(selectedDate).toLocaleDateString()}</strong> at <strong>{new Date(selectedTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</strong>?
                                    </p>
                                    <p style={{marginBottom:'1rem', color:'var(--primary-gold)'}}>
                                        This will use 1 credit.
                                    </p>
                                     <div className={styles.formItem}>
                                        <label className={styles.formLabel}>Notes (Optional)</label>
                                        <textarea className={styles.textarea} placeholder="Any special requests..." value={notes} onChange={e => setNotes(e.target.value)} />
                                    </div>
                                    <button className={styles.fullWidthBtn} onClick={handleBook} disabled={loading}>
                                        {loading ? "Booking..." : "Confirm & Redeem"}
                                    </button>
                                </div>
                            </div>
                    </div>
                )}
            </>
        )}
    </div>
  );
}
