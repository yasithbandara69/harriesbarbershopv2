import Image from "next/image";
import styles from "./AboutUs.module.css";

export default function AboutUs() {
  const team = [
    {
      name: "Harry",
      title: "Founder & Owner | Experienced Barber",
      description: "Founder and owner of Harries Barbershop. With years of experience, Harry is dedicated to providing the best cuts in town with a personalized touch.",
      instagram: "harries_barbershop",
      image: "/barbers/Harry.jpg"
    },
    {
      name: "Kavish",
      title: "Skilled Barber | Best All-Rounder",
      description: "A master of all trades, providing top-tier grooming services and exceptional attention to detail.",
      instagram: "kavish_cuts.",
      image: "/barbers/Kavish.jpg"
    }
  ];

  return (
    <section id="about" className={styles.sectionWrapper}>
      <div className={styles.container}>
        
        <div className={styles.headerSection}>
          <h2 className={styles.mainTitle}>Meet The Team</h2>
          <p className={styles.mainSubtitle}>The experienced barbers behind Harries Barbershop</p>
        </div>

        <div className={styles.teamGrid}>
          {team.map((member) => (
            <div key={member.name} className={styles.teamCard}>
              <div className={styles.imageContainer}>
                <Image 
                  src={member.image} 
                  alt={member.name}
                  width={500}
                  height={667}
                  className={styles.image}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className={styles.teamContent}>
                <h3 className={styles.teamName}>{member.name}</h3>
                <p className={styles.teamTitle}>{member.title}</p>
                <p className={styles.teamDescription}>{member.description}</p>
                <a 
                  href={`https://instagram.com/${member.instagram.replace('.', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.instagramLink}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  @{member.instagram}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
