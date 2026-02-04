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

                    <h3 className={styles.sectionTitle} style={{marginTop: '2rem'}}>Booking History</h3>
                     <div className={styles.emptyState}>
                        <p>No past appointments found.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
