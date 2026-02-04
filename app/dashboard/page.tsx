import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import styles from "./dashboard.module.css";
import Link from "next/link";

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

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1 className={styles.title}>My Account</h1>
                <form action={logout}>
                    <button className={styles.logoutBtn}>
                        Sign Out
                    </button>
                </form>
            </header>

            <div className={styles.grid}>
                {/* Profile Section */}
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
                        <span className={styles.value}>{square_customer_id || 'Not linked'}</span>
                    </div>

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
                    
                    {/* Placeholder for bookings */}
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
                    </div>

                    {subscription && subscription.credits > 0 && (
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--primary-gold)', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary-gold)' }}>Member Booking</h3>
                            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>You have {subscription.credits} credits available for this month.</p>
                            <Link href="/dashboard/book" className={styles.logoutBtn} style={{ background: 'var(--primary-gold)', color: '#000', display: 'inline-block', textDecoration: 'none' }}>
                                Book with Credits
                            </Link>
                        </div>
                    )}

                    <h3 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Booking History</h3>
                     <div className={styles.emptyState}>
                        <p>No past appointments found.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
