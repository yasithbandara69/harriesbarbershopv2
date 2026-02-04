
import Image from "next/image";
import styles from "./AboutUs.module.css";

export default function AboutUs() {
  return (
    <section className={styles.sectionWrapper}>
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          {/* Using a relative container for Next.js Image fill layout, or specific width/height */}
          <Image 
            src="/harry-2.jpg" 
            alt="Harry - Owner of Harries Barbershop"
            width={500}
            height={667}
            className={styles.image}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.textContent}>
            <h2 className={styles.title}>
              Hey, I'm <span className={styles.nameHighlight}>Harry</span>
            </h2>
            <p className={styles.description}>
              Harries Barbershop wants to bring convenience back into people's lives. 
              With easy appointments and welcoming Walk-ins. Prices determined by demand and experience.
              We are dedicated to providing the best cuts in town with a personalized touch.
            </p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>5+</span>
              <span className={styles.statLabel}>Years of Experience</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>60+</span>
              <span className={styles.statLabel}>Haircuts Mastered</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>1000+</span>
              <span className={styles.statLabel}>Tailored Haircuts</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Satisfaction</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
