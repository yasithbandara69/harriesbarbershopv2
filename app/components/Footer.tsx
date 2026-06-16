import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, MapPin, Phone, Mail, Clock } from 'lucide-react';
import styles from './Footer.module.css';

// TikTok SVG Icon
const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand Section */}
        <div className={styles.brandSection}>
          <Link href="/" className={styles.logoLink}>
            <Image 
              src="/logo-header.png" 
              alt="Harrie's Barbershop" 
              width={150} 
              height={50} 
              className={styles.logo}
            />
          </Link>
          <p className={styles.tagline}>
            Experience the art of traditional barbering with a modern touch. Detailed cuts, hot towel shaves, and premium styling.
          </p>
          <div className={styles.socialLinks}>
            <a href="https://www.instagram.com/harries_barbershop/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://www.tiktok.com/@harry_de_barber" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="TikTok">
              <TikTokIcon size={20} />
            </a>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className={styles.linksSection}>
          <h3 className={styles.heading}>Quick Links</h3>
          <ul className={styles.linkList}>
            <li><Link href="/" className={styles.link}>Home</Link></li>
            <li><Link href="/book" className={styles.link}>Book Appointment</Link></li>
            <li><Link href="/#services" className={styles.link}>Services</Link></li>
            <li><Link href="/#works" className={styles.link}>Our Work</Link></li>
            <li><Link href="/login" className={styles.link}>Login</Link></li>
          </ul>
        </div>

        {/* Contact Information Section */}
        <div className={styles.contactSection}>
          <h3 className={styles.heading}>Contact Us</h3>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <MapPin size={18} className={styles.contactIcon} />
              <span>250 Scoresby Rd, Boronia VIC 3155, Australia</span>
            </li>
            <li className={styles.contactItem}>
              <Phone size={18} className={styles.contactIcon} />
              <span>+61 425 465 557</span>
            </li>
            <li className={styles.contactItem}>
              <Mail size={18} className={styles.contactIcon} />
              <span>hello@harriesbarbershop.com</span>
            </li>
            <li className={styles.contactItem}>
              <Clock size={18} className={styles.contactIcon} />
              <div className={styles.hours}>
                <span>Wed - Mon: 10 am - 10 pm</span>
                <span>Tuesday: Closed</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <p>&copy; {currentYear} Harrie's Barbershop. All rights reserved.</p>
          <div className={styles.legalLinks}>
            <Link href="/" className={styles.legalLink}>Privacy Policy</Link>
            <span className={styles.separator}>|</span>
            <Link href="/" className={styles.legalLink}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
