'use client';

import { useState, useEffect } from 'react';
import { listTeamMembers, listServices, searchAvailability, createBooking, checkCustomerPostcode } from '../actions';
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
  isAddon?: boolean;
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
  const [showPostcode, setShowPostcode] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Data
  const [barbers, setBarbers] = useState<TeamMember[]>([]);
  const [servicesByBarber, setServicesByBarber] = useState<Record<string, Service[]>>({});
  const [loadingServices, setLoadingServices] = useState<Record<string, boolean>>({});
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  
  // Selection
  const [expandedBarberId, setExpandedBarberId] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<TeamMember | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddonService, setSelectedAddonService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    givenName: '',
    familyName: '',
    emailAddress: '',
    phoneNumber: '',
    postcode: ''
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
                      phoneNumber: prev.phoneNumber || meta.phone || '',
                      postcode: prev.postcode || ''
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
      setSelectedAddonService(null);
      
      const isBeardService = service.name.toLowerCase().includes('beard');
      const hasAddons = (servicesByBarber[barber.id] || []).some(s => s.isAddon);

      if (isBeardService && hasAddons) {
          setStep(1.5);
      } else {
          setStep(2);
      }
  };

  // Fetch Availability
  useEffect(() => {
    if (selectedDate && selectedService && selectedBarber) {
        setLoading(true);
        const start = new Date(`${selectedDate}T00:00:00`); 
        const end = new Date(`${selectedDate}T23:59:59`);
        
        const serviceIds = [selectedService.id];
        if (selectedAddonService) serviceIds.push(selectedAddonService.id);

        searchAvailability(start.toISOString(), end.toISOString(), serviceIds, selectedBarber.id)
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
  }, [selectedDate, selectedService, selectedAddonService, selectedBarber]);

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
        const servicesToBook = [
            { id: selectedService.id, version: selectedService.version }
        ];
        if (selectedAddonService) {
            servicesToBook.push({ id: selectedAddonService.id, version: selectedAddonService.version });
        }

        const result = await createBooking(
            servicesToBook,
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

  const handleEmailBlur = async () => {
      if (!customerInfo.emailAddress) return;
      setCheckingEmail(true);
      try {
          const hasPostcode = await checkCustomerPostcode(customerInfo.emailAddress);
          setShowPostcode(!hasPostcode);
      } catch (e) {
          setShowPostcode(true);
      } finally {
          setCheckingEmail(false);
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
                    You are booked with {selectedBarber?.name} for {selectedService?.name}{selectedAddonService ? ` and ${selectedAddonService.name}` : ''}.
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
                <button className={styles.ghostBtn} onClick={() => {
                    if (step === 2 && selectedService?.name.toLowerCase().includes('beard') && (servicesByBarber[selectedBarber?.id || ''] || []).some(s => s.isAddon)) {
                        setStep(1.5);
                    } else if (step === 1.5) {
                        setStep(1);
                    } else {
                        setStep(step - 1);
                    }
                }}>
                    <span style={{ marginRight: '0.5rem', display: 'flex' }}><Icons.ArrowLeft /></span>
                    Back
                </button>
            )}

            {/* Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 className={styles.headerTitle}>
                    {step === 1 && "Book Your Appointment"}
                    {step === 1.5 && "Enhance Your Visit"}
                    {step === 2 && "Select Date & Time"}
                    {step === 3 && "Confirm Your Booking"}
                </h1>
                <p className={styles.headerSubtitle}>
                    {step === 1 && "Select your preferred barber and service to get started"}
                    {step === 1.5 && "Add an extra touch to your beard service"}
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
                                        {services.filter(s => !s.isAddon && !s.name.toLowerCase().includes('member')).map(svc => (
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

            {/* STEP 1.5: CROSS-SELL */}
            {step === 1.5 && selectedBarber && (
                <div className={styles.stack}>
                     <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Would you like to add anything?</h3>
                        </div>
                        <div className={styles.cardContent}>
                            {(servicesByBarber[selectedBarber.id] || []).filter(s => s.isAddon).map(svc => (
                                <div key={svc.id} className={styles.serviceItem} style={{ flexDirection: 'column', alignItems: 'stretch', padding: '0', overflow: 'hidden' }}>
                                    {svc.name.toLowerCase().includes('hot towel') && (
                                        <div style={{ width: '100%', backgroundColor: '#1a1a1a', display: 'flex', justifyContent: 'center' }}>
                                            <img 
                                                src="/hot towel shave.jpeg" 
                                                alt={svc.name} 
                                                style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '400px' }} 
                                            />
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div className={styles.serviceInfo} style={{ flex: '1 1 200px' }}>
                                            <p className={styles.serviceName} style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{svc.name}</p>
                                            <p className={styles.serviceMeta}>{svc.description}</p>
                                            <p className={styles.serviceMeta}>+ {formatDuration(svc.duration)}</p>
                                        </div>
                                        <div className={styles.servicePriceBlock} style={{ margin: 0, alignItems: 'center', flexDirection: 'row', gap: '1.5rem' }}>
                                            <span className={styles.priceTag}>+{formatPrice(svc.price.amount)}</span>
                                            <button className={styles.selectBtn} onClick={() => {
                                                setSelectedAddonService(svc);
                                                setStep(2);
                                            }}>Add</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <button className={styles.ghostBtn} onClick={() => {
                                    setSelectedAddonService(null);
                                    setStep(2);
                                }}>No thanks, skip</button>
                            </div>
                        </div>
                     </div>
                </div>
            )}

            {/* STEP 2: DATE & TIME (Matches DateTimePicker) */}
            {step === 2 && (
                <div className={styles.stack}>
                    {/* Selected Summary Alert */}
                    <div className={styles.alert}>
                        <div className={styles.alertDescription}>
                            <strong>Selected:</strong> {selectedService?.name} 
                            {selectedAddonService ? ` + ${selectedAddonService.name}` : ''} with {selectedBarber?.name} 
                            ({selectedService && formatPrice(
                                (Number(selectedService.price.amount) + (selectedAddonService ? Number(selectedAddonService.price.amount) : 0)).toString()
                            )})
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
                                    <div className={styles.summaryValue} style={{ textAlign: 'right' }}>
                                        <div>{selectedService?.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#a3a3a3', marginTop: '0.25rem' }}>
                                            {selectedService && formatPrice(selectedService.price.amount)}
                                        </div>
                                    </div>
                                </div>
                                {selectedAddonService && (
                                    <div className={styles.summaryRow}>
                                        <span className={styles.summaryLabel}>Add-on:</span>
                                        <div className={styles.summaryValue} style={{ textAlign: 'right' }}>
                                            <div>{selectedAddonService.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#a3a3a3', marginTop: '0.25rem' }}>
                                                {formatPrice(selectedAddonService.price.amount)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Date:</span>
                                    <span className={styles.summaryValue}>{selectedDate}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Time:</span>
                                    <span className={styles.summaryValue}>{selectedTime && new Date(selectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className={styles.summaryTotal}>
                                    <span className={styles.summaryTotalLabel}>Total:</span>
                                    <span className={styles.summaryTotalValue}>
                                        {selectedService && formatPrice(
                                            (Number(selectedService.price.amount) + (selectedAddonService ? Number(selectedAddonService.price.amount) : 0)).toString()
                                        )}
                                    </span>
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
                                onBlur={handleEmailBlur}
                            />
                            {checkingEmail && <p style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.375rem' }}>Checking details...</p>}
                        </div>
                        <div className={styles.formItem}>
                            <label className={styles.formLabel}>Phone Number</label>
                            <input className={styles.input} placeholder="+61..." value={customerInfo.phoneNumber} onChange={e => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})} />
                            <p style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.375rem' }}>You'll receive appointment confirmations via SMS</p>
                        </div>
                        {showPostcode && (
                            <div className={styles.formItem}>
                                <label className={styles.formLabel}>Postcode</label>
                                <input className={styles.input} placeholder="e.g. 2000" value={customerInfo.postcode} onChange={e => setCustomerInfo({...customerInfo, postcode: e.target.value})} />
                            </div>
                        )}
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
