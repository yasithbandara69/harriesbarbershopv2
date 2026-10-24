import Link from "next/link";
import styles from "./page.module.css";
import SplashScreen from "./components/SplashScreen";
import AboutUs from "./components/AboutUs";
import Memberships from "./components/Memberships";
import Carousel from "./components/Carousel";
import GoogleReviews from "./components/GoogleReviews";
import BackgroundVideo from "./components/BackgroundVideo";

export default function Home() {
  return (
    <main>
      <BackgroundVideo />
      <SplashScreen />
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.catchyPhrase}>Classic Grooming Experience</div>
          <h1 className={styles.heroTitle}>
            Premium Cuts <br />
            <span>Classic Style</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Experience the art of traditional barbering with a modern touch. 
            Detailed cuts, hot towel shaves, and premium styling services.
          </p>
          <Link href="/book" className={styles.ctaButton}>
            Book Appointment
          </Link>
        </div>
      </section>
      <AboutUs />
      <Memberships />
      <Carousel />
      <GoogleReviews />
    </main>
  );
}
