'use client';
import styles from '../dashboard/dashboard.module.css';

export default function RescheduleLink() {
    return (
        <a href="#" className={styles.rescheduleLink} onClick={(e) => { e.preventDefault(); alert('Please call the shop to reschedule.'); }}>
            Reschedule
        </a>
    );
}
