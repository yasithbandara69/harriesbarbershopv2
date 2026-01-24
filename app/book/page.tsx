'use client';

import { useState, useEffect } from 'react';
import { listTeamMembers, listServices, searchAvailability, createBooking } from '../actions';
import styles from './book.module.css';

// Type definitions matching our API returns
interface TeamMember {
  id: string; // This is teamMemberId
  name: string; // This is displayName
}

interface Service {
  id: string;
  name: string;
  price: { amount: string; currency: string };
  duration: string; // ms
  version: number;
}

interface Availability {
  startAt: string;
  locationId: string;
}

function BarberAvatar({ name }: { name: string }) {
  const [error, setError] = useState(false);

  // Attempt to load the image based on the barber's name
  // Note: We are assuming .jpg extension as per user uploads.
  const imagePath = `/barbers/${name}.jpg`;

  if (error) {
     return (
        <div style={{
            width: 100, 
            height: 100, 
            background: '#222', 
            borderRadius: '50%', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#666',
            fontSize: '1.5rem',
            border: '2px solid #333'
        }}>
            {name.charAt(0)}
        </div>
     );
  }
  
  return (
    <img 
        src={imagePath} 
        alt={name} 
        style={{
            width: 100, 
            height: 100, 
            borderRadius: '50%', 
            objectFit: 'cover', 
            marginBottom: '1rem',
            border: '2px solid var(--primary-gold, #D4AF37)'
        }}
        onError={() => setError(true)}
    />
  );
}

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data State
  const [barbers, setBarbers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  
  // Selection State
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
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Load Barbers on Mount
  useEffect(() => {
    async function loadData() {
        setLoading(true);
        try {
            // @ts-ignore
            const team = await listTeamMembers();
            setBarbers(team);
        } catch (e) {
            setError("Failed to load barbers.");
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, []);

  // Reset services when Barber changes
  useEffect(() => {
    setServices([]);
  }, [selectedBarber]);

  // Load Services when Step is 2
  useEffect(() => {
    if (step === 2 && services.length === 0) {
        setLoading(true);
        // Pass selectedBarber id if available to filter services
        listServices(selectedBarber?.id).then(data => {
            // @ts-ignore
            setServices(data);
            setLoading(false);
        });
    }
  }, [step, selectedBarber]);

  // Load Availability when Date is picked (in Step 3)
  useEffect(() => {
    if (selectedDate && selectedService && selectedBarber) {
        setLoading(true);
        // Search for the whole day (Local Time)
        const start = new Date(`${selectedDate}T00:00:00`); 
        const end = new Date(`${selectedDate}T23:59:59`);
        
        searchAvailability(start.toISOString(), end.toISOString(), selectedService.id, selectedBarber.id)
            .then(data => {
                // @ts-ignore
                setAvailabilities(data);
                setLoading(false);
            })
            .catch(e => {
                setError("Could not load availability. Please try another date.");
                setLoading(false);
            });
    }
  }, [selectedDate, selectedService, selectedBarber]);

  const handleBook = async () => {
    if (!selectedService || !selectedBarber || !selectedTime) return;
    setLoading(true);
    try {
        const result = await createBooking(
            selectedService.id,
            selectedService.version,
            selectedBarber.id,
            selectedTime,
            customerInfo
        );
        setBookingResult(result);
        setStep(5);
    } catch (e: any) {
        setError("Booking failed: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER LOGO */}
      <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Harrie's Barbershop" className={styles.logo} />
      </div>

      {error && <div className={styles.error}>{error}</div>}
      
      {/* PAGE HEADER */}
      <h2 className={styles.header}>
        {step === 1 && "Select a Barber"}
        {step === 2 && "Select a Service"}
        {step === 3 && "Select Date & Time"}
        {step === 4 && "Your Details"}
        {step === 5 && "Booking Confirmed"}
      </h2>

      {/* STEP 1: BARBER */}
      {step === 1 && (
        <div className={styles.grid}>
            {loading && <p style={{color: '#888'}}>Loading barbers...</p>}
            {barbers.map(b => (
                <div key={b.id} className={styles.card} onClick={() => {
                    setSelectedBarber(b);
                    setStep(2);
                }}>
                    <BarberAvatar name={b.name} />
                    <h3>{b.name}</h3>
                </div>
            ))}
        </div>
      )}

      {/* STEP 2: SERVICE */}
      {step === 2 && (
        <>
            <div className={styles.grid}>
                {loading && <p style={{color: '#888'}}>Loading services...</p>}
                {services.map(s => (
                    <div key={s.id} className={styles.card} onClick={() => {
                        setSelectedService(s);
                        setStep(3);
                    }}>
                        <h3>{s.name}</h3>
                        <p>
                            {s.duration ? Math.floor(Number(s.duration) / 60000) : '?'} mins
                        </p>
                        <p style={{color: '#D4AF37', fontWeight: 'bold'}}>
                            {s.price?.amount ? `$${(Number(s.price.amount) / 100).toFixed(2)}` : 'Price varies'}
                        </p>
                    </div>
                ))}
            </div>
            <button className={styles.back} onClick={() => setStep(1)}>← Change Barber</button>
        </>
      )}

      {/* STEP 3: DATE & TIME */}
      {step === 3 && (
        <div className={styles.form}>
            <label>Select Date</label>
            <input 
                className={styles.input}
                type="date" 
                onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAvailabilities([]); 
                }}
            />
            
            {loading && <p style={{textAlign: 'center', color: '#888'}}>Searching slots...</p>}
            
            {availabilities.length > 0 && (
                <div className={styles.slots}>
                    {availabilities.map((a, i) => {
                        const date = new Date(a.startAt);
                        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <div key={i} className={styles.slot} onClick={() => {
                                setSelectedTime(a.startAt);
                                setStep(4);
                            }}>
                                {timeStr}
                            </div>
                        );
                    })}
                </div>
            )}
            {selectedDate && !loading && availabilities.length === 0 && (
                <p style={{textAlign: 'center', color: '#888', marginTop: '1rem'}}>
                    No slots available for this date.
                </p>
            )}

            <button className={styles.back} onClick={() => setStep(2)}>← Back to Services</button>
        </div>
      )}

      {/* STEP 4: CUSTOMER INFO */}
      {step === 4 && (
        <div className={styles.form}>
            <label>First Name</label>
            <input className={styles.input} placeholder="e.g. John" value={customerInfo.givenName} onChange={e => setCustomerInfo({...customerInfo, givenName: e.target.value})} />
            
            <label>Last Name</label>
            <input className={styles.input} placeholder="e.g. Doe" value={customerInfo.familyName} onChange={e => setCustomerInfo({...customerInfo, familyName: e.target.value})} />
            
            <label>Email</label>
            <input className={styles.input} placeholder="john@example.com" value={customerInfo.emailAddress} onChange={e => setCustomerInfo({...customerInfo, emailAddress: e.target.value})} />
            
            <label>Phone</label>
            <input className={styles.input} placeholder="555-0100" value={customerInfo.phoneNumber} onChange={e => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})} />
            
            <button className={styles.primary} onClick={handleBook} disabled={loading}>
                {loading ? "Confirming..." : "Confirm Appointment"}
            </button>
            <button className={styles.back} onClick={() => setStep(3)}>← Back to Time</button>
        </div>
      )}

      {/* STEP 5: SUCCESS */}
      {step === 5 && bookingResult && (
        <div className={styles.success}>
            <h3>Booking Confirmed!</h3>
            <p style={{marginBottom: '1rem', color: '#ccc'}}>
                You are booked with {selectedBarber?.name} for {selectedService?.name}.
            </p>
            <p style={{fontSize: '1.2rem', color: '#fff', marginBottom: '1rem'}}>
                {new Date(bookingResult.startAt).toLocaleString()}
            </p>
            <small style={{color: '#666'}}>Reference: {bookingResult.id}</small>
            
            <div style={{marginTop: '2rem'}}>
                <button className={styles.primary} onClick={() => window.location.reload()}>Book Another</button>
            </div>
        </div>
      )}
    </div>
  );
}
