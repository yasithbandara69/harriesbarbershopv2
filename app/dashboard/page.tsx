import { listCustomerBookings, getSubscriptionUsage } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { Suspense } from "react";
import EmailVerificationSuccess from "../components/EmailVerificationSuccess";
import RescheduleLink from "../components/RescheduleLink";
import { Star, Scissors, Calendar, Clock, User, CreditCard, History, CalendarDays, Crown } from "lucide-react";

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
    const isSuccess = searchParams?.success === 'true';
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

    const { first_name, last_name, square_customer_id } = profile || user.user_metadata || {};

    let planId = '';
    let usage: any = null;
    let subscriptionCreatedDate: Date | null = null;

    if (profile?.stripe_subscription_id) {
        usage = await getSubscriptionUsage();
        planId = usage.planId || '';
        if (usage.subscriptionCreated) {
            subscriptionCreatedDate = new Date(usage.subscriptionCreated);
        }
    }

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

    // Determine the list to show based on the active tab
    const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    // Formatting plan name for display
    const planNameMap: Record<string, string> = {
        'essential-haircut': 'Essential Haircut',
        'essential-beard': 'Essential Haircut & Beard',
        'premium-haircut': 'Premium Haircut',
        'premium-beard': 'Premium Haircut & Beard'
    };
    const displayPlanName = planId ? planNameMap[planId] || planId : '';

    return (
        <main className={styles.main}>
            {/* Using a form action for logout here but it is technically hidden in CSS, 
                leaving it in case they want a button back in the future */}
            <header className={styles.header}>
                <h1 className={styles.title}>My Account</h1>
                <form action={logout}>
                    <button className={styles.logoutBtn}>Sign Out</button>
                </form>
            </header>

            <Suspense fallback={null}>
                <EmailVerificationSuccess />
            </Suspense>

            {isSuccess && (
                <div style={{ backgroundColor: '#b49b57', color: 'black', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
                    <p style={{ margin: 0 }}>Payment Successful! Your subscription is active and your credits have been added to your account.</p>
                </div>
            )}

            <div className={styles.grid}>
                {/* Left Column */}
                <div>
                    {/* Profile Card */}
                    <div className={`${styles.card} ${styles.profileCard}`}>
                        <h2 className={styles.profileName}>{first_name} {last_name}</h2>
                        <p className={styles.profileEmail}>{user.email}</p>
                        {subscriptionCreatedDate && (
                            <div className={styles.memberSince}>
                                <Star size={12} fill="currentColor" />
                                <span>MEMBER SINCE {subscriptionCreatedDate.getFullYear()}</span>
                            </div>
                        )}
                    </div>

                    {/* Current Plan Card (Only show if active usage) */}
                    {usage && usage.isActive && planId && (
                        <div className={styles.planCard}>
                            <div className={styles.planHeader}>
                                <div>
                                    <p className={styles.planLabel}>CURRENT PLAN</p>
                                    <h3 className={styles.planName}>{displayPlanName}</h3>
                                </div>
                                <div className={styles.planIconWrapper}>
                                    <Star size={16} />
                                </div>
                            </div>

                            <div className={styles.creditsText}>
                                {usage.remainingCredits} <span>/ {usage.maxCredits} credits</span>
                            </div>

                            {/* Progress bar logic: Percentage of remaining credits vs total */}
                            <div className={styles.progressBarContainer}>
                                <div 
                                    className={styles.progressBarFill} 
                                    style={{ width: `${(usage.remainingCredits / usage.maxCredits) * 100}%` }}
                                ></div>
                            </div>

                            {usage.resetDate && (
                                <div className={styles.renewsText}>
                                    <Clock size={14} />
                                    <span>Renews on {new Date(usage.resetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            )}

                            {usage.remainingCredits > 0 ? (
                                <Link href={`/book/subscription?planId=${planId}`} className={styles.btnPrimary}>
                                    <Scissors size={18} />
                                    Book with Credit
                                </Link>
                            ) : (
                                <button className={styles.btnPrimary} style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                                    <Scissors size={18} />
                                    Out of Credits
                                </button>
                            )}

                            <Link href="/book" className={styles.btnSecondary}>
                                <CreditCard size={18} />
                                Book Standard
                            </Link>

                            <form action={logout} style={{ marginTop: '1.5rem' }}>
                                <button className={styles.btnSecondary} style={{ borderColor: 'transparent', color: '#888' }}>
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    )}

                    {(!usage || !usage.isActive) && (
                         <div className={styles.card} style={{marginTop: '1rem', textAlign: 'center'}}>
                            <p style={{color: '#888', marginBottom: '1rem'}}>You do not have an active subscription.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <Link href="/#subscriptions" className={styles.btnPrimary} style={{ backgroundColor: 'var(--primary-gold)', color: '#000' }}>
                                    <Crown size={18} />
                                    Buy Subscription
                                </Link>
                                <Link href="/book" className={styles.btnSecondary}>
                                    <CreditCard size={18} />
                                    Book Standard
                                </Link>
                            </div>

                            <form action={logout} style={{ marginTop: '1.5rem' }}>
                                <button className={styles.btnSecondary} style={{ borderColor: 'transparent', color: '#888' }}>
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Right Column: Appointments */}
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
                                // Determine if this was a credit booking by checking service ID
                                const isSubscriptionService = ['IG3KC7ZQIDZFPETUY3UWRPTU', '6ZJHSA7CEIIK2MAYR4OBTNUW'].includes(booking.serviceVariationId);
                                
                                return (
                                    <div key={booking.id} className={styles.appointmentCard}>
                                        <div className={styles.appointmentIconWrapper}>
                                            <CalendarDays size={20} />
                                        </div>
                                        <div className={styles.appointmentContent}>
                                            <div className={styles.appointmentTitleRow}>
                                                <h4 className={styles.appointmentService}>
                                                    {isSubscriptionService ? "Subscription Appointment" : "Standard Appointment"}
                                                </h4>
                                                
                                                {isSubscriptionService && (
                                                    <span className={styles.creditBadge}>
                                                        <Star size={10} fill="currentColor" /> CREDIT USED
                                                    </span>
                                                )}
                                                
                                                {booking.status !== 'ACCEPTED' && booking.status !== 'PENDING' && (
                                                     <span style={{ fontSize: '0.8rem', color: getStatusColor(booking.status), fontWeight: 'bold' }}>
                                                        {formatStatus(booking.status)}
                                                     </span>
                                                )}
                                            </div>

                                            <div className={styles.appointmentDetails}>
                                                <div className={styles.appointmentDetailItem}>
                                                    <User size={14} />
                                                    <span>Harry</span> {/* Assuming Harry is the primary barber */}
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
