'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import styles from './BarberBreakModal.module.css';

export default function BarberBreakModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);

    const dismissed = sessionStorage.getItem('harrie_break_notice_dismissed') === 'true';
    if (dismissed) {
      setHasDismissed(true);
      return;
    }

    // Wait for splash screen to finish sliding up (~2.5s)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    setHasDismissed(true);
    try {
      sessionStorage.setItem('harrie_break_notice_dismissed', 'true');
    } catch {
      // Ignore in storage restricted environments
    }
  };

  const handleReopen = () => {
    setIsOpen(true);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Discreet floating pill on bottom right when closed so visitors can review notice anytime */}
      {!isOpen && hasDismissed && (
        <button
          onClick={handleReopen}
          className={styles.floatingPill}
          aria-label="View Barber Schedule Notice"
        >
          <span>✂️</span>
          <span>
            <strong className={styles.pillAccent}>Notice:</strong> Oct 13–22 Schedule
          </span>
        </button>
      )}

      {/* Clean Modal Portal */}
      {isOpen &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="break-modal-title"
          >
            {/* Backdrop click area */}
            <div
              style={{ position: 'absolute', inset: 0 }}
              onClick={handleDismiss}
              aria-hidden="true"
            />

            {/* Modal Card */}
            <div className={styles.modal}>
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className={styles.closeButton}
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Header */}
              <div className={styles.headerSection}>
                <div className={styles.catchyPhrase}>
                  <span className={styles.pulseDot} />
                  <span>Barber Availability</span>
                </div>

                <h2 id="break-modal-title" className={styles.title}>
                  Harry is Taking a <span className={styles.titleHighlight}>Short Break</span>
                </h2>

                <div className={styles.dateBadge}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>October 13th – 22nd</span>
                </div>
              </div>

              {/* Description */}
              <p className={styles.description}>
                Harry will be away during these dates. In the meantime, <strong>Kavish</strong> is
                in-store and ready to take care of all your haircuts, beard trims, and styling services.
              </p>

              {/* Barber Availability Grid */}
              <div className={styles.barberGrid}>
                {/* Harry */}
                <div className={styles.barberCard}>
                  <div className={styles.avatarWrapper}>
                    <Image
                      src="/barbers/Harry.jpg"
                      alt="Harry"
                      width={52}
                      height={52}
                      className={styles.avatarImg}
                    />
                  </div>
                  <h3 className={styles.barberName}>Harry</h3>
                  <span className={`${styles.statusTag} ${styles.statusAway}`}>
                    Away Oct 13–22
                  </span>
                </div>

                {/* Kavish */}
                <div className={`${styles.barberCard} ${styles.barberCardActive}`}>
                  <div className={styles.avatarWrapper}>
                    <Image
                      src="/barbers/Kavish.jpg"
                      alt="Kavish"
                      width={52}
                      height={52}
                      className={styles.avatarImg}
                    />
                  </div>
                  <h3 className={styles.barberName}>Kavish</h3>
                  <span className={`${styles.statusTag} ${styles.statusAvailable}`}>
                    <span className={styles.greenDot} />
                    Available In-Store
                  </span>
                </div>
              </div>

              {/* Advance Booking Note */}
              <div className={styles.noticeBox}>
                <svg
                  className={styles.noticeIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className={styles.noticeText}>
                  Please book in advance if you have an upcoming occasion or important event.
                </p>
              </div>

              {/* Actions */}
              <div className={styles.buttonGroup}>
                <Link
                  href="/book"
                  onClick={handleDismiss}
                  className={styles.primaryButton}
                >
                  <span>Book with Kavish</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className={styles.secondaryButton}
                >
                  Continue to Website
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
