import { listCustomerBookings } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { Suspense } from "react";
import EmailVerificationSuccess from "../components/EmailVerificationSuccess";
import StripeSuccessModal from "../components/StripeSuccessModal";
import RescheduleLink from "../components/RescheduleLink";
import { CalendarDays, Clock, History, User } from "lucide-react";

const formatStatus = (status: string) => {
    const map: Record<string, string> = {
        'ACCEPTED': 'Confirmed',
        'PENDING': 'Pending',
        'CANCELLED_BY_SELLER': 'Cancelled (Shop)',
        'CANCELLED_BY_CUSTOMER': 'Cancelled (You)',
        'DECLINED': 'Declined',
        'NOSHOW': 'No Show'
    };
    return map[status] || status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACCEPTED': return '#b49b57'; // Gold
        case 'PENDING': return '#ff9800'; // Orange
        case 'CANCELLED_BY_SELLER':
        case 'CANCELLED_BY_CUSTOMER':
        case 'DECLINED':
            return '#f44336'; // Red
        default: return '#aaa'; // Grey
    }
};

export default async function DashboardPage(props: any) {
    const searchParams = await props.searchParams;
    const activeTab = searchParams?.tab === 'past' ? 'past' : 'upcoming';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const { first_name, last_name, square_customer_id, subscription_tier, haircut_credits, beard_credits } = profile || user.user_metadata || {};

    let correctCustomerId = null;
    try {
        const { squareClient } = await import("@/lib/square");
        const searchEmail = (user.email || '').toLowerCase().trim();
        if (searchEmail) {
            const searchRes = await squareClient.customers.search({
                query: { filter: { emailAddress: { exact: searchEmail } } }
            });
            const customers = searchRes.customers || (searchRes as any).result?.customers || (searchRes as any).body?.customers || [];
            
            if (customers.length > 0) {
                correctCustomerId = customers[0].id;
                if (correctCustomerId && square_customer_id !== correctCustomerId) {
                    await supabase
                        .from('profiles')
                        .update({ square_customer_id: correctCustomerId })
                        .eq('id', user.id);
                }
            }
        }
    } catch (e) {
        console.error("Auto-heal check failed:", e);
    }

    let upcomingBookings: any[] = [];
    let pastBookings: any[] = [];
    
    const targetSquareId = correctCustomerId || square_customer_id;

    if (targetSquareId) {
        try {
            const bookings = await listCustomerBookings(targetSquareId);
            const now = new Date();
            
            upcomingBookings = bookings.filter((b: any) => new Date(b.startAt) >= now);
            pastBookings = bookings.filter((b: any) => new Date(b.startAt) < now);
        } catch (e) {
            console.error("Failed to load bookings:", e);
        }
    }

    const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1 className={styles.title}>My Account</h1>
                <form action={logout}>
                    <button className={styles.logoutBtn}>Sign Out</button>
                </form>
            </header>

            <Suspense fallback={null}>
                <EmailVerificationSuccess />
                <StripeSuccessModal sessionId={searchParams?.session_id} />
            </Suspense>

            <div className={styles.grid}>
                <div>
                    <div className={`${styles.card} ${styles.profileCard}`}>
                        <h2 className={styles.profileName}>{first_name} {last_name}</h2>
                        <p className={styles.profileEmail}>{user.email}</p>
                        <form action={logout} style={{ marginTop: '1.5rem' }}>
                            <button className={styles.btnSecondary} style={{ borderColor: 'transparent', color: '#888' }}>
                                Sign Out
                            </button>
                        </form>
                    </div>
                    
                    {subscription_tier && (
                        <div className={styles.card} style={{ marginTop: '2rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--primary-gold), transparent)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loyalty Membership</h2>
                                    <p style={{ color: 'var(--primary-gold)', fontSize: '0.875rem' }}>{subscription_tier} Plan</p>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '1rem', background: '#141414', borderRadius: '0.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '2rem', fontFamily: 'var(--font-oswald)', color: '#fff', fontWeight: 700, lineHeight: 1 }}>
                                        {subscription_tier.includes('Beard') ? (beard_credits || 0) : (haircut_credits || 0)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                                        {subscription_tier.includes('Beard') ? 'Haircut + Beard Credits' : 'Haircut Credits'}
                                    </div>
                                </div>
                            </div>
                            
                            {((haircut_credits || 0) > 0 || (beard_credits || 0) > 0) && (
                                <Link href="/book/member" style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    padding: '0.75rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--primary-gold)',
                                    fontWeight: 600,
                                    borderRadius: '0.5rem',
                                    textDecoration: 'none',
                                    border: '1px solid var(--primary-gold)',
                                    transition: 'all 0.2s'
                                }}>
                                    Book Included Appointment
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className={`${styles.card} ${styles.appointmentsCard}`}>
                    <div className={styles.appointmentsHeaderRow}>
                        <h2 className={styles.sectionTitle}>Your Appointments</h2>
                        
                        <div className={styles.tabs}>
                            <Link href="?tab=upcoming" className={`${styles.tabBtn} ${activeTab === 'upcoming' ? styles.tabActive : styles.tabInactive}`} scroll={false}>
                                <CalendarDays size={16} /> Upcoming
                            </Link>
                            <Link href="?tab=past" className={`${styles.tabBtn} ${activeTab === 'past' ? styles.tabActive : styles.tabInactive}`} scroll={false}>
                                <History size={16} /> Past
                            </Link>
                        </div>
                    </div>

                    {displayBookings.length > 0 ? (
                        <div>
                            {displayBookings.map((booking: any) => {
                                const bookingDate = new Date(booking.startAt);
                                
                                return (
                                    <div key={booking.id} className={styles.appointmentCard}>
                                        <div className={styles.appointmentIconWrapper}>
                                            <CalendarDays size={20} />
                                        </div>
                                        <div className={styles.appointmentContent}>
                                            <div className={styles.appointmentTitleRow}>
                                                <h4 className={styles.appointmentService}>
                                                    {
                                                        booking.serviceVariationId === process.env.NEXT_PUBLIC_SQUARE_MEMBER_HAIRCUT_ID || 
                                                        booking.serviceVariationId === process.env.NEXT_PUBLIC_SQUARE_MEMBER_BEARD_ID 
                                                            ? 'Membership Appointment' 
                                                            : 'Standard Appointment'
                                                    }
                                                </h4>
                                                
                                                {booking.status !== 'ACCEPTED' && booking.status !== 'PENDING' && (
                                                     <span style={{ fontSize: '0.8rem', color: getStatusColor(booking.status), fontWeight: 'bold' }}>
                                                        {formatStatus(booking.status)}
                                                     </span>
                                                )}
                                            </div>

                                            <div className={styles.appointmentDetails}>
                                                <div className={styles.appointmentDetailItem}>
                                                    <User size={14} />
                                                    <span>Harry</span>
                                                </div>
                                                <div className={styles.appointmentDetailItem}>
                                                    <Clock size={14} />
                                                    <span>
                                                        {bookingDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {activeTab === 'upcoming' && booking.status === 'ACCEPTED' && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <RescheduleLink />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>You have no {activeTab} appointments.</p>
                            {activeTab === 'upcoming' && (
                                <Link href="/book" style={{ 
                                    display: 'inline-block', 
                                    marginTop: '1rem', 
                                    color: 'var(--primary-gold)', 
                                    textDecoration: 'none',
                                    fontWeight: 'bold'
                                }}>
                                    Book a haircut now
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
