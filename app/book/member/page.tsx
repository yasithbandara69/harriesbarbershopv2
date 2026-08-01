'use client';

import { useState, useEffect } from 'react';
import { searchAvailability, getHarryTeamMember, createMemberBooking } from '../../actions';
import styles from '../book.module.css';
import Calendar from '../Calendar';

interface Availability {
  startAt: string; // ISO
  locationId: string;
}

export default function MemberBookingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [tier, setTier] = useState<string | null>(null);
  const [harryId, setHarryId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  
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

  useEffect(() => {
      async function loadUserAndSetup() {
          setLoading(true);
          try {
              const { createClient } = await import("@/utils/supabase/client");
              const supabase = createClient();
              const { data: { session } } = await supabase.auth.getSession();
              
              if (!session || !session.user) {
                  window.location.href = '/login';
                  return;
              }

              const user = session.user;
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
              
              const currentTier = profile?.subscription_tier;
              if (!currentTier || ((profile?.haircut_credits || 0) <= 0 && (profile?.beard_credits || 0) <= 0)) {
                  setError("You do not have an active membership or available credits.");
                  setLoading(false);
                  return;
              }

              setTier(currentTier);
              
              const meta = profile || user.user_metadata || {};
              setCustomerInfo(prev => ({
                  ...prev,
                  givenName: meta.first_name || '',
                  familyName: meta.last_name || '',
                  emailAddress: user.email || '',
                  phoneNumber: meta.phone || '',
                  postcode: profile?.postcode || ''
              }));

              // Get Harry's ID
              const harry = await getHarryTeamMember();
              if (harry) setHarryId(harry.id);

              // Set Service ID based on tier (Using env variables for the Square IDs we'll fetch)
              const sid = currentTier.includes('Beard') 
                  ? process.env.NEXT_PUBLIC_SQUARE_MEMBER_BEARD_ID 
                  : process.env.NEXT_PUBLIC_SQUARE_MEMBER_HAIRCUT_ID;
              
              if (!sid) {
                  setError("Member services are not fully configured yet. Please follow the Square setup guide and add IDs to .env.local.");
              } else {
                  setServiceId(sid);
              }

          } catch(e) {
              console.error(e);
              setError("Failed to load membership data.");
          } finally {
              setLoading(false);
          }
      }
      loadUserAndSetup();
  }, []);

  // Fetch Availability
  useEffect(() => {
    if (selectedDate && serviceId && harryId) {
        setLoading(true);
        const start = new Date(`${selectedDate}T00:00:00`); 
        const end = new Date(`${selectedDate}T23:59:59`);
        
        searchAvailability(start.toISOString(), end.toISOString(), [serviceId], harryId)
            .then(data => {
                setAvailabilities(data);
                setLoading(false);
            })
            .catch(e => {
                setError("Could not load availability.");
                setLoading(false);
            });
    }
  }, [selectedDate, serviceId, harryId]);

  const handleBook = async () => {
    if (!serviceId || !harryId || !selectedTime) return;
    
    if (!customerInfo.emailAddress || !customerInfo.givenName) {
        setError("Missing user details.");
        return;
    }

    setLoading(true);
    try {
        const result = await createMemberBooking(
            { id: serviceId, version: 1 }, 
            harryId,
            selectedTime,
            customerInfo,
            notes,
            tier!
        );
        setBookingResult(result);
    } catch (e: any) {
        setError("Booking failed: " + e.message);
    } finally {
        setLoading(false);
    }
  };

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

  if (bookingResult) {
      return (
          <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle} style={{ textAlign: 'center', fontSize: '2rem' }}>Booking Confirmed!</h3>
                </div>
                <div className={styles.cardContent} style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem', color: '#a3a3a3' }}>
                        Your member appointment is booked with Harry.
                    </p>
                    <p style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>
                        {new Date(selectedDate).toLocaleDateString()} at {new Date(selectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <button className={styles.fullWidthBtn} onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</button>
                </div>
            </div>
          </div>
      );
  }

  return (
    <div className={styles.container}>
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Member Booking</h2>
                <p style={{ color: '#a3a3a3', fontSize: '0.9rem', marginTop: '0.5rem' }}>Your {tier} plan includes this booking for $0.</p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}
            {loading && !selectedDate && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary-gold)' }}>Loading...</div>}

            {tier && !bookingResult && (
                <div className={styles.cardContent}>
                    {!selectedTime ? (
                        <>
                            <h3 className={styles.sectionTitle}>Select Date</h3>
                            <Calendar 
                                onChange={(dateStr) => {
                                    setSelectedDate(dateStr);
                                    setSelectedTime('');
                                }} 
                                value={selectedDate}
                            />

                            {selectedDate && (
                                <div style={{ marginTop: '2rem' }}>
                                    <h3 className={styles.sectionTitle}>Available Times (Harry)</h3>
                                    {loading ? (
                                        <p style={{ color: '#a3a3a3', marginTop: '1rem' }}>Loading times...</p>
                                    ) : availabilities.length > 0 ? (
                                        Object.entries(getGroupedTimes()).map(([timeOfDay, slots]) => (
                                            slots.length > 0 && (
                                                <div key={timeOfDay} className={styles.timeGroup}>
                                                    <h4 className={styles.timeGroupTitle}>{timeOfDay}</h4>
                                                    <div className={styles.timeGrid}>
                                                        {slots.map((slot) => {
                                                            const t = new Date(slot.startAt);
                                                            return (
                                                                <button
                                                                    key={slot.startAt}
                                                                    className={`${styles.timeSlotBtn} ${selectedTime === slot.startAt ? styles.selected : ''}`}
                                                                    onClick={() => setSelectedTime(slot.startAt)}
                                                                >
                                                                    {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        ))
                                    ) : (
                                        <p style={{ color: '#a3a3a3', marginTop: '1rem' }}>No times available on this date.</p>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.checkoutGrid}>
                             <div className={styles.stack}>
                                 <div className={styles.card}>
                                     <div className={styles.cardHeader}>
                                         <h3 className={styles.cardTitle}>Appointment Summary</h3>
                                     </div>
                                     <div className={styles.cardContent}>
                                         <div className={styles.summaryRow}>
                                             <span className={styles.summaryLabel}>Barber:</span>
                                             <span className={styles.summaryValue}>Harry</span>
                                         </div>
                                         <div className={styles.summaryRow}>
                                             <span className={styles.summaryLabel}>Service:</span>
                                             <div className={styles.summaryValue} style={{ textAlign: 'right' }}>
                                                 <div>{tier} (Member)</div>
                                                 <div style={{ fontSize: '0.875rem', color: '#a3a3a3', marginTop: '0.25rem' }}>
                                                     $0.00 AUD
                                                 </div>
                                             </div>
                                         </div>
                                         <div className={styles.summaryRow}>
                                             <span className={styles.summaryLabel}>Date:</span>
                                             <span className={styles.summaryValue}>{selectedDate}</span>
                                         </div>
                                         <div className={styles.summaryRow}>
                                             <span className={styles.summaryLabel}>Time:</span>
                                             <span className={styles.summaryValue}>{new Date(selectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                         </div>
                                         <div className={styles.summaryTotal}>
                                             <span className={styles.summaryTotalLabel}>Total:</span>
                                             <span className={styles.summaryTotalValue}>$0.00 AUD</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div>
                                 <div className={styles.formGroup}>
                                     <label className={styles.formLabel}>Notes for Harry (Optional)</label>
                                     <textarea 
                                         className={styles.textarea} 
                                         rows={3}
                                         value={notes}
                                         onChange={e => setNotes(e.target.value)}
                                         placeholder="Anything we should know?"
                                     />
                                 </div>

                                 <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                     <button 
                                         className={styles.ghostBtn} 
                                         onClick={() => setSelectedTime('')}
                                         style={{ flex: 1 }}
                                     >
                                         Back
                                     </button>
                                     <button 
                                         className={styles.fullWidthBtn} 
                                         onClick={handleBook}
                                         disabled={loading}
                                         style={{ flex: 2 }}
                                     >
                                         {loading ? 'Processing...' : 'Complete Booking'}
                                     </button>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}
