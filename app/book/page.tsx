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

  // Load Services when Barber is selected (or initially if we want)
  // The prompt says: Select Barber -> Service. 
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
  }, [step, selectedBarber]); // Re-run if barber changes (though step usually resets too)

  // Load Availability when Date is picked (in Step 3)
  useEffect(() => {
    if (selectedDate && selectedService && selectedBarber) {
        setLoading(true);
        // Search for the whole day (Local Time)
        // input type="date" returns YYYY-MM-DD. Appending T00... forces local time parsing.
        const start = new Date(`${selectedDate}T00:00:00`); 
        const end = new Date(`${selectedDate}T23:59:59`);
        
        searchAvailability(start.toISOString(), end.toISOString(), selectedService.id, selectedBarber.id)
            .then(data => {
                // @ts-ignore
                setAvailabilities(data);
                setLoading(false);
            })
            .catch(e => {
                setError("Could not load availability");
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
            selectedService.version, // Pass version
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
      {error && <div className={styles.error}>{error}</div>}
      
      {/* HEADER */}
      <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>
        {step === 1 && "Select a Barber"}
        {step === 2 && "Select a Service"}
        {step === 3 && "Select Date & Time"}
        {step === 4 && "Your Details"}
        {step === 5 && "Booking Confirmed"}
      </h2>

      {/* STEP 1: BARBER */}
      {step === 1 && (
        <div className={styles.grid}>
            {loading && <p>Loading barbers...</p>}
            {barbers.map(b => (
                <button key={b.id} className={styles.card} onClick={() => {
                    setSelectedBarber(b);
                    setStep(2);
                }}>
                    <h3>{b.name}</h3>
                </button>
            ))}
        </div>
      )}

      {/* STEP 2: SERVICE */}
      {step === 2 && (
        <div className={styles.grid}>
             {loading && <p>Loading services...</p>}
             {services.map(s => (
                <button key={s.id} className={styles.card} onClick={() => {
                    setSelectedService(s);
                    setStep(3);
                }}>
                    <h3>{s.name}</h3>
                    <p>
                        {s.duration ? Math.floor(Number(s.duration) / 60000) : '?'} mins - 
                        {s.price?.amount ? `$${(Number(s.price.amount) / 100).toFixed(2)}` : 'Price varies'}
                    </p>
                </button>
             ))}
             <button className={styles.back} onClick={() => setStep(1)}>Back</button>
        </div>
      )}

      {/* STEP 3: DATE & TIME */}
      {step === 3 && (
        <div className={styles.form}>
            <label>Select Date:</label>
            <input 
                type="date" 
                onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAvailabilities([]); // Clear old
                }}
            />
            
            {loading && <p>Searching slots...</p>}
            
            {availabilities.length > 0 && (
                <div className={styles.slots}>
                    {availabilities.map((a, i) => {
                        const date = new Date(a.startAt);
                        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <button key={i} className={styles.slot} onClick={() => {
                                setSelectedTime(a.startAt);
                                setStep(4);
                            }}>
                                {timeStr}
                            </button>
                        );
                    })}
                </div>
            )}
             <button className={styles.back} onClick={() => setStep(2)}>Back</button>
        </div>
      )}

      {/* STEP 4: CUSTOMER INFO */}
      {step === 4 && (
        <div className={styles.form}>
            <input placeholder="First Name" value={customerInfo.givenName} onChange={e => setCustomerInfo({...customerInfo, givenName: e.target.value})} />
            <input placeholder="Last Name" value={customerInfo.familyName} onChange={e => setCustomerInfo({...customerInfo, familyName: e.target.value})} />
            <input placeholder="Email" value={customerInfo.emailAddress} onChange={e => setCustomerInfo({...customerInfo, emailAddress: e.target.value})} />
            <input placeholder="Phone" value={customerInfo.phoneNumber} onChange={e => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})} />
            
            <button className={styles.primary} onClick={handleBook} disabled={loading}>
                {loading ? "Booking..." : "Confirm Appointment"}
            </button>
            <button className={styles.back} onClick={() => setStep(3)}>Back</button>
        </div>
      )}

      {/* STEP 5: SUCCESS */}
      {step === 5 && bookingResult && (
        <div className={styles.success}>
            <h3>Success!</h3>
            <p>Your appointment is booked for {new Date(bookingResult.startAt).toLocaleString()}.</p>
            <p>Booking ID: {bookingResult.id}</p>
        </div>
      )}
    </div>
  );
}
