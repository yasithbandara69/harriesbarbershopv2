'use client';

import { useState, useEffect } from 'react';
import { listTeamMembers, listServices, searchAvailability, createBooking } from '../actions';
import styles from './book.module.css';
import Calendar from './Calendar';
// Icons needed: ArrowLeft, ChevronDown (for accordion), Info (for policy)
// We will simply use inline SVGs or simple text for now if icons aren't available, but I'll add simple SVGs.

// --- TYPES ---
interface TeamMember {
  id: string; // teamMemberId
  name: string; // displayName
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price: { amount: string; currency: string };
  duration: string; // ms
  version: number;
}

interface Availability {
  startAt: string; // ISO
  locationId: string;
}

// --- SUB-COMPONENTS (Inlined for simplicity in this file) ---

function BarberAvatar({ name }: { name: string }) {
  const [error, setError] = useState(false);
  const imagePath = `/barbers/${name}.jpg`;

  if (error) {
     return (
        <div className={styles.barberAvatar} style={{ background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.5rem', color: '#666' }}>{name.charAt(0)}</span>
        </div>
     );
  }
  
  return (
    <div className={styles.barberAvatar}>
        <img 
            src={imagePath} 
            alt={name} 
            onError={() => setError(true)}
        />
    </div>
  );
}

// Icons
const Icons = {
    ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
    ChevronUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
    ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
    Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
    Instagram: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
};

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [barbers, setBarbers] = useState<TeamMember[]>([]);
  const [servicesByBarber, setServicesByBarber] = useState<Record<string, Service[]>>({});
  const [loadingServices, setLoadingServices] = useState<Record<string, boolean>>({});
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  
  // Selection
  const [expandedBarberId, setExpandedBarberId] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<TeamMember | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    givenName: '',
    familyName: '',
    emailAddress: '',
    phoneNumber: ''
  });
  const [notes, setNotes] = useState('');
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Prefill user Info if logged in
  useEffect(() => {
      async function loadUser() {
          try {
              const { createClient } = await import("@/utils/supabase/client");
              const supabase = createClient();
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session && session.user) {
                  const user = session.user;
                  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                  const meta = profile || user.user_metadata || {};
                  
                  setCustomerInfo(prev => ({
                      givenName: prev.givenName || meta.first_name || '',
                      familyName: prev.familyName || meta.last_name || '',
                      emailAddress: prev.emailAddress || user.email || '',
                      phoneNumber: prev.phoneNumber || meta.phone || ''
                  }));
              }
          } catch(e) {
              console.error("Failed to load user for prefill", e);
          }
      }
      loadUser();
  }, []);

  // Load Barbers
  useEffect(() => {
    async function loadData() {
        setLoading(true);
        try {
            // @ts-ignore
            const team = await listTeamMembers();
            setBarbers(team);
        } catch (e) {
            setError("Failed to load barbers. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, []);

  // Fetch Services when expanding barber
  const handleExpandBarber = async (barberId: string) => {
      if (expandedBarberId === barberId) {
          setExpandedBarberId(null);
          return;
      }
      setExpandedBarberId(barberId);
      if (!servicesByBarber[barberId]) {
          setLoadingServices(prev => ({ ...prev, [barberId]: true }));
          try {
              const data = await listServices(barberId);
              // @ts-ignore
              setServicesByBarber(prev => ({ ...prev, [barberId]: data }));
          } catch (e) {
              console.error(e);
          } finally {
              setLoadingServices(prev => ({ ...prev, [barberId]: false }));
          }
      }
  };

  const handleServiceSelect = (barber: TeamMember, service: Service) => {
      setSelectedBarber(barber);
      setSelectedService(service);
      setStep(2);
  };

  // Fetch Availability
  useEffect(() => {
    if (selectedDate && selectedService && selectedBarber) {
        setLoading(true);
        const start = new Date(`${selectedDate}T00:00:00`); 
        const end = new Date(`${selectedDate}T23:59:59`);
        
        searchAvailability(start.toISOString(), end.toISOString(), selectedService.id, selectedBarber.id)
            .then(data => {
                // @ts-ignore
                setAvailabilities(data);
                setLoading(false);
            })
            .catch(e => {
                setError("Could not load availability.");
                setLoading(false);
            });
    }
  }, [selectedDate, selectedService, selectedBarber]);

  const handleBook = async () => {
    if (!selectedService || !selectedBarber || !selectedTime) return;
    
    // Validation
    if (!customerInfo.emailAddress) {
        setError("Please enter your email address.");
        return;
    }
    if (!customerInfo.givenName) {
        setError("Please enter your first name.");
        return;
    }
    if (!customerInfo.phoneNumber) {
        setError("Please enter your phone number.");
        return;
    }

    setLoading(true);
    try {
        const result = await createBooking(
            selectedService.id,
            selectedService.version,
            selectedBarber.id,
            selectedTime,
            customerInfo,
            notes // Pass notes
        );
        setBookingResult(result);
        setStep(4);
    } catch (e: any) {
        setError("Booking failed: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  // Format Helpers
  const formatPrice = (amount: string) => `$${(Number(amount) / 100).toFixed(2)} AUD`;
  const formatDuration = (ms: string) => `${Math.floor(Number(ms) / 60000)} minutes`;

  const getGroupedTimes = () => {
      const groups = { Morning: [] as Availability[], Afternoon: [] as Availability[], Evening: [] as Availability[] };
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
      {/* Logos/Brand can go here if needed, but source uses Navbar. We assume Layout has Navbar or we just center content. */}
      
      {step === 4 ? (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} style={{ textAlign: 'center', fontSize: '2rem' }}>Booking Confirmed!</h3>
            </div>
            <div className={styles.cardContent} style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', color: '#a3a3a3' }}>
                    You are booked with {selectedBarber?.name} for {selectedService?.name}.
                </p>
                <p style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>
                    {new Date(selectedDate).toLocaleDateString()} at {new Date(selectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <button className={styles.fullWidthBtn} onClick={() => window.location.reload()}>Book Another</button>
            </div>
        </div>
      ) : (
        <>
            {/* Contextual Back Button */}
            {step > 1 && (
                <button className={styles.ghostBtn} onClick={() => setStep(step - 1)}>
                    <span style={{ marginRight: '0.5rem', display: 'flex' }}><Icons.ArrowLeft /></span>
                    Back
                </button>
            )}

            {/* Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 className={styles.headerTitle}>
                    {step === 1 && "Book Your Appointment"}
                    {step === 2 && "Select Date & Time"}
                    {step === 3 && "Confirm Your Booking"}
                </h1>
                <p className={styles.headerSubtitle}>
                    {step === 1 && "Select your preferred barber and service to get started"}
                    {step === 2 && "Choose your preferred appointment date"}
                    {step === 3 && "Review your appointment details and enter your contact information"}
                </p>
            </div>

            {error && (
                <div className={styles.alert} style={{ borderColor: '#7f1d1d', color: '#ef4444' }}>
                    <div className={styles.alertDescription}>{error}</div>
                </div>
            )}

            {/* STEP 1: BARBER LIST (Matches BarberCard + ServiceList) */}
            {step === 1 && (
                <div className={styles.stack}>
                    {loading && <p style={{textAlign:'center', color:'#666'}}>Loading...</p>}
                    {barbers.map(barber => {
                        const isExpanded = expandedBarberId === barber.id;
                        const services = servicesByBarber[barber.id] || [];
                        const isLoadingSvc = loadingServices[barber.id];

                        return (
                            <div key={barber.id} className={styles.card}>
                                <div className={styles.cardHeader} onClick={() => handleExpandBarber(barber.id)} style={{ cursor: 'pointer' }}>
                                    <div className={styles.barberHeaderContent}>
                                        <BarberAvatar name={barber.name} />
                                        <div className={styles.barberMeta}>
                                            <h3 className={styles.cardTitle}>{barber.name}</h3>
                                            <p className={styles.cardDescription}>Professional Barber</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className={styles.cardContent}>
                                        <div style={{ padding: '0.5rem 0', fontWeight: '500', fontSize: '0.875rem' }}>
                                            Book Now ({isLoadingSvc ? "Loading..." : `${services.length} services`})
                                        </div>
                                        {services.map(svc => (
                                            <div key={svc.id} className={styles.serviceItem}>
                                                <div className={styles.serviceInfo}>
                                                    <p className={styles.serviceName}>{svc.name}</p>
                                                    <p className={styles.serviceMeta}>{svc.description}</p>
                                                    <p className={styles.serviceMeta}>{formatDuration(svc.duration)}</p>
                                                </div>
                                                <div className={styles.servicePriceBlock}>
                                                    <span className={styles.priceTag}>{formatPrice(svc.price.amount)}</span>
                                                    <button className={styles.selectBtn} onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleServiceSelect(barber, svc);
                                                    }}>Select</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* STEP 2: DATE & TIME (Matches DateTimePicker) */}
            {step === 2 && (
                <div className={styles.stack}>
                    {/* Selected Summary Alert */}
                    <div className={styles.alert}>
                        <div className={styles.alertDescription}>
                            <strong>Selected:</strong> {selectedService?.name} with {selectedBarber?.name} ({selectedService && formatPrice(selectedService.price.amount)})
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Select Date</h3>
                        </div>
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

            {/* STEP 3: CHECKOUT (Matches CheckoutPage) */}
            {step === 3 && (
                <div className={styles.checkoutGrid}>
                    <div className={styles.stack}>
                        {/* Summary Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Appointment Summary</h3>
                            </div>
                            <div className={styles.cardContent}>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Barber:</span>
                                    <span className={styles.summaryValue}>{selectedBarber?.name}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Service:</span>
                                    <span className={styles.summaryValue}>{selectedService?.name}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Date:</span>
                                    <span className={styles.summaryValue}>{selectedDate}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Time:</span>
                                    <span className={styles.summaryValue}>{selectedTime && new Date(selectedTime).toLocaleTimeString()}</span>
                                </div>
                                <div className={styles.summaryTotal}>
                                    <span className={styles.summaryTotalLabel}>Total:</span>
                                    <span className={styles.summaryTotalValue}>{selectedService && formatPrice(selectedService.price.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cancellation Policy */}
                        <div className={styles.alert}>
                             <span style={{ marginRight: '0.75rem' }}><Icons.Info /></span>
                             <div className={styles.alertDescription}>
                                 <p style={{marginBottom: '0.5rem'}}>Please provide at least 24 hours notice if you need to cancel.</p>
                                 <p>To cancel, call us at 0425 465 557.</p>
                             </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>Your Details</h2>
                            <p style={{ fontSize: '0.875rem', color: '#a3a3a3' }}>Enter your contact information to complete the booking</p>
                        </div>

                        <div className={styles.formItem}>
                            <label className={styles.formLabel}>First Name</label>
                            <input className={styles.input} placeholder="John" value={customerInfo.givenName} onChange={e => setCustomerInfo({...customerInfo, givenName: e.target.value})} />
                        </div>
                        <div className={styles.formItem}>
                            <label className={styles.formLabel}>Last Name</label>
                            <input className={styles.input} placeholder="Smith" value={customerInfo.familyName} onChange={e => setCustomerInfo({...customerInfo, familyName: e.target.value})} />
                        </div>
                        <div className={styles.formItem}>
                            <label className={styles.formLabel}>Email Address</label>
                            <input 
                                className={styles.input} 
                                type="email"
                                placeholder="john.smith@example.com" 
                                value={customerInfo.emailAddress} 
                                onChange={e => setCustomerInfo({...customerInfo, emailAddress: e.target.value})} 
                            />
                        </div>
                        <div className={styles.formItem}>
                            <label className={styles.formLabel}>Phone Number</label>
                            <input className={styles.input} placeholder="+61..." value={customerInfo.phoneNumber} onChange={e => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})} />
                            <p style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.375rem' }}>You'll receive appointment confirmations via SMS</p>
                        </div>
                        <div className={styles.formItem}>
                            <label className={styles.formLabel}>Notes (Optional)</label>
                            <textarea className={styles.textarea} placeholder="Any special requests..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>

                        <button className={styles.fullWidthBtn} onClick={handleBook} disabled={loading}>
                            {loading ? "Confirming..." : "Confirm Booking"}
                        </button>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
}
