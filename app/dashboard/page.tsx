import { listTeamMembers, listServices, searchAvailability, getServiceById, listCustomerBookings } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { Suspense } from "react";
import SubscriptionSuccess from "../components/SubscriptionSuccess";
import SyncSubscriptionButton from "../components/SyncSubscriptionButton";
import { SUBSCRIPTION_DATA } from "../components/subscription-data";

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
        case 'ACCEPTED': return '#4caf50'; // Green
        case 'PENDING': return '#ff9800'; // Orange
        case 'CANCELLED_BY_SELLER':
        case 'CANCELLED_BY_CUSTOMER':
        case 'DECLINED':
            return '#f44336'; // Red
        default: return '#aaa'; // Grey
    }
};

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch profile data from the new 'profiles' table
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Fetch subscription data
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE') // Only active subscriptions
        .single();
    
    // Fallback to metadata if profile doesn't exist yet (e.g. legacy user or trigger failure)
    const { first_name, last_name, phone, role, square_customer_id } = profile || user.user_metadata || {};

    // Derive Plan Details if subscription exists
    let planDetails = null;
    if (subscription && subscription.plan_id) {
        const allPlans = SUBSCRIPTION_DATA.flatMap(cat => cat.plans.map(p => ({ ...p, categoryLabel: cat.label })));
        planDetails = allPlans.find(p => p.squarePlanId === subscription.plan_id);
    }

    // AUTO-HEALING: Check and fix mismatch
    let correctCustomerId = null;
    try {
        const { squareClient } = await import("@/lib/square");
        // Normalize email search
        const searchEmail = (user.email || '').toLowerCase().trim();
        if (searchEmail) {
            const searchRes = await squareClient.customers.search({
                query: { filter: { emailAddress: { exact: searchEmail } } }
            });
            const customers = searchRes.customers || (searchRes as any).result?.customers || (searchRes as any).body?.customers || [];
            
            if (customers.length > 0) {
                correctCustomerId = customers[0].id;
                
                // If mismatch found, fix it in Supabase immediately
                if (correctCustomerId && square_customer_id !== correctCustomerId) {
                    console.log(`[Auto-Heal] Fixing mismatch for ${user.email}. DB: ${square_customer_id} -> Square: ${correctCustomerId}`);
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ square_customer_id: correctCustomerId })
                        .eq('id', user.id);
                    
                    if (!updateError) {
                         // Update current page variable for display
                    } else {
                        console.error("[Auto-Heal] Failed to update profile:", updateError);
                    }
                }
            }
        }
    } catch (e) {
        console.error("Auto-heal check failed:", e);
    }

    // FETCH APPOINTMENTS
    let upcomingBookings = [];
    let pastBookings = [];
    
    // Use the Found ID (if auto-heal found one) or the Linked ID
    const targetSquareId = correctCustomerId || square_customer_id;

    if (targetSquareId) {
        try {
            // @ts-ignore
            const bookings = await listCustomerBookings(targetSquareId);
            const now = new Date();
            
            upcomingBookings = bookings.filter((b: any) => new Date(b.startAt) >= now);
            pastBookings = bookings.filter((b: any) => new Date(b.startAt) < now);
        } catch (e) {
            console.error("Failed to load bookings:", e);
        }
    }

    return (
        <main className={styles.main}>
            {/* ... (Header remains same) ... */}
            <header className={styles.header}>
                <h1 className={styles.title}>My Account</h1>
                <form action={logout}>
                    <button className={styles.logoutBtn}>
                        Sign Out
                    </button>
                </form>
            </header>

            <Suspense fallback={null}>
                <SubscriptionSuccess />
            </Suspense>

            <div className={styles.grid}>
                {/* Profile Section (remains same) */}
                <div className={`${styles.card} ${styles.profileCard}`}>
                    <h2 className={styles.welcome}>Welcome, {first_name || 'Guest'}</h2>
                    
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Full Name</span>
                        <span className={styles.value}>{first_name} {last_name}</span>
                    </div>
                    
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Email</span>
                        <span className={styles.value}>{user.email}</span>
                    </div>

                    <div className={styles.detailRow}>
                        <span className={styles.label}>Phone</span>
                        <span className={styles.value}>{phone || 'Not provided'}</span>
                    </div>

                    <div className={styles.detailRow}>
                        <span className={styles.label}>Square Customer ID</span>
                        <span className={styles.value} style={{ fontSize: '0.8rem', color: '#666' }}>
                            {correctCustomerId ? 'Linked & Verified' : (square_customer_id ? 'Linked' : 'Not linked')}
                        </span>
                    </div>

                    {/* Debug UI Removed - Auto-Heal is active */}

                    {subscription && (
                         <div className={styles.detailRow} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333' }}>
                            <span className={styles.label}>Membership Credits</span>
                            <span className={styles.value} style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>
                                {subscription.credits} remaining
                            </span>
                        </div>
                    )}
                    
                    {role === 'admin' && (
                        <div className={styles.detailRow}>
                            <span className={styles.label}>Role</span>
                            <span className="text-[--primary-gold] font-bold uppercase">{role}</span>
                        </div>
                    )}
                </div>

                {/* Appointments / Content Section */}
                <div className={styles.card}>
                    <h3 className={styles.sectionTitle}>Upcoming Appointments</h3>
                    
                    {upcomingBookings.length > 0 ? (
                        <div className={styles.bookingsList}>
                            {upcomingBookings.map((booking: any) => (
                                <div key={booking.id} style={{ 
                                    padding: '1rem', 
                                    border: '1px solid #333', 
                                    borderRadius: '8px', 
                                    marginBottom: '1rem',
                                    background: '#1a1a1a'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {new Date(booking.startAt).toLocaleDateString()}
                                        </span>
                                        <span style={{ color: 'var(--primary-gold)' }}>
                                            {new Date(booking.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#aaa' }}>
                                        <span>Status: <span style={{ color: getStatusColor(booking.status), fontWeight: 'bold' }}>{formatStatus(booking.status)}</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>You have no upcoming appointments.</p>
                            <Link href="/book" style={{ 
                                display: 'inline-block', 
                                marginTop: '1rem', 
                                color: 'var(--primary-gold)', 
                                textDecoration: 'underline' 
                            }}>
                                Book a haircut now
                            </Link>
                            
                            <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#666' }}>
                                Don't see your booking? {' '}
                                <Link href="/api/fix-account" style={{ color: '#888', textDecoration: 'underline' }}>
                                    Find missing appointments
                                </Link>
                            </p>
                        </div>
                    )}

                    {subscription && subscription.credits > 0 && (
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--primary-gold)', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary-gold)' }}>Member Booking</h3>
                            
                            <div style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                {planDetails && (
                                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#aaa' }}>Plan:</span>
                                        <span style={{ fontWeight: 'bold' }}>{planDetails.tier} - {planDetails.categoryLabel}</span>
                                    </div>
                                )}
                                
                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#aaa' }}>Status:</span>
                                    <span style={{ color: '#4caf50', fontWeight: 'bold', textTransform: 'uppercase' }}>{subscription.status}</span>
                                </div>

                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#aaa' }}>Credits:</span>
                                    <span>{subscription.credits} remaining</span>
                                </div>

                                {subscription.current_period_end && (
                                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#aaa' }}>Next Billing:</span>
                                        <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            <Link href="/dashboard/book" className={styles.logoutBtn} style={{ background: 'var(--primary-gold)', color: '#000', display: 'inline-block', textDecoration: 'none', textAlign: 'center', width: '100%' }}>
                                Book with Credits
                            </Link>
                        </div>
                    )}

                    {!subscription && square_customer_id && (
                        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px dashed #444', borderRadius: '8px' }}>
                             <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#888' }}>
                                Recently subscribed but don't see it here?
                             </p>
                             <SyncSubscriptionButton />
                        </div>
                    )}

                    <h3 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Booking History</h3>
                     {pastBookings.length > 0 ? (
                        <div className={styles.bookingsList}>
                            {pastBookings.map((booking: any) => (
                                <div key={booking.id} style={{ 
                                    padding: '0.75rem', 
                                    borderBottom: '1px solid #333', 
                                    fontSize: '0.9rem',
                                    color: '#888'
                                }}>
                                    <span>{new Date(booking.startAt).toLocaleDateString()}</span> - <span style={{ color: getStatusColor(booking.status) }}>{formatStatus(booking.status)}</span>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <div className={styles.emptyState}>
                            <p>No past appointments found.</p>
                        </div>
                     )}
                </div>
            </div>
        </main>
    );
}
