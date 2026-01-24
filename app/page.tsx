import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Harrie's Barbershop</h1>
        <p>Premium cuts, classic style.</p>
        
        <div className={styles.ctas}>
          <Link href="/book" className={styles.primary}>
            Book Now
          </Link>
        </div>
      </main>
    </div>
  );
}
