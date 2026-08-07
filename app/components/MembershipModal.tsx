'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import styles from './MembershipModal.module.css';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  planTitle: string | null;
}

const planDetails = {
  "Haircut": {
    price: "200",
    description: "Everything you need for a consistently sharp look, on a plan that renews itself every month.",
    included: [
      "4 haircut credits per month — use them for any standard haircut service.",
      "Monthly renewal — your credits automatically refresh on your billing date, no need to re-purchase.",
      "Free birthday week refresh — book an extra haircut, on us, during the week of your birthday."
    ],
    creditsWork: [
      "Credits are loaded to your account on the day your membership starts, and again on each monthly renewal date.",
      "Each credit covers one standard haircut booking at any Harries Barbershop location.",
      "Credits do not roll over. Any credit not used by the end of your monthly cycle expires and cannot be carried into the next month or refunded.",
      "Credits have no cash value and cannot be exchanged for other services, sold, or transferred to another person."
    ]
  },
  "Haircut + Beard": {
    price: "260",
    description: "Full grooming coverage — haircut and beard care bundled into one monthly membership.",
    included: [
      "4 haircut and beard service credits per month",
      "Monthly renewal — your credits automatically refresh on your billing date, no need to re-purchase.",
      "Free birthday week refresh — book an extra service, on us, during the week of your birthday."
    ],
    creditsWork: [
      "Credits are loaded to your account on the day your membership starts, and again on each monthly renewal date.",
      "Each credit covers one haircut and beard service at any Harries Barbershop location.",
      "Credits do not roll over. Any credit not used by the end of your monthly cycle expires and cannot be carried into the next month or refunded.",
      "Credits have no cash value and cannot be exchanged for other services, sold, or transferred to another person."
    ]
  }
};

export default function MembershipModal({ isOpen, onClose, planTitle }: MembershipModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !planTitle || !(planTitle in planDetails)) return null;

  const details = planDetails[planTitle as keyof typeof planDetails];

  const handleCheckout = async () => {
    if (!agreed) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planTitle }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Error from checkout API:', data.error);
        alert(`Error starting checkout: ${data.error}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to start checkout:', err);
      alert('Failed to start checkout. Please try again later.');
      setIsLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>{planTitle} Membership</h2>
            <div className={styles.price}>
              AUD {details.price} <span className={styles.period}>/ month</span>
            </div>
          </div>

          <p className={styles.description}>{details.description}</p>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>What's included</h3>
            <ul className={styles.list}>
              {details.included.map((item, index) => (
                <li key={index} className={styles.listItem}>
                  <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>How your credits work</h3>
            <ul className={styles.list}>
              {details.creditsWork.map((item, index) => (
                <li key={index} className={styles.listItem}>
                  <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.termsContainer}>
            <input 
              type="checkbox" 
              id="terms-agreement"
              className={styles.checkbox}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="terms-agreement" className={styles.termsLabel}>
              I have read and agree to the <Link href="/terms" target="_blank" className={styles.termsLink}>Terms and Conditions</Link>.
            </label>
          </div>

          <button 
            className={styles.checkoutButton}
            onClick={handleCheckout}
            disabled={!agreed || isLoading}
          >
            {isLoading ? 'Redirecting to Stripe...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
