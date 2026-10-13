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

    // Splash screen runs for 2000ms + 800ms slide-up transition on homepage.
    // Reveal popup smoothly right after splash screen slides away.
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
      // Ignore in private browsing / storage restricted environments
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
          className={styles.floatingNoticePill}
          aria-label="View Barber Schedule Notice"
          title="Harry's Break Schedule: Oct 13 - 22"
        >
          <span style={{ fontSize: '1rem' }}>✂️</span>
          <span>
            <strong className={styles.pillGoldText}>Schedule Notice:</strong> Oct 13–22
          </span>
        </button>
      )}

      {/* Modal Portal */}
      {isOpen &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-break-title"
          >
            {/* Backdrop click area */}
            <div
              style={{ position: 'absolute', inset: 0 }}
              onClick={handleDismiss}
              aria-hidden="true"
            />

            {/* Modal Box */}
            <div className={styles.modalWrapper}>
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className={styles.closeButton}
                aria-label="Close Announcement"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className={styles.scrollContainer}>
                {/* Top Banner Image with atmospheric razor shave */}
                <div className={styles.bannerContainer}>
                  <Image
                    src="/break-banner.jpg"
                    alt="Barber Grooming Experience"
                    fill
                    priority
                    className={styles.bannerImage}
                    sizes="(max-width: 500px) 100vw, 480px"
                  />
                  <div className={styles.bannerOverlay} />
                  <div className={styles.badgePill}>
                    <span className={styles.badgeDot} />
                    <span>Schedule Notice</span>
                  </div>
                </div>

                {/* Content Body */}
                <div className={styles.bodyContent}>
                  {/* Headline matching user's post */}
                  <div className={styles.headerGroup} id="modal-break-title">
                    <h3 className={styles.titlePrefix}>Taking a</h3>
                    <h2 className={styles.titleItalic}>short break</h2>
                  </div>

                  {/* Dates Display */}
                  <div className={styles.dateContainer}>
                    <svg
                      className={styles.dateIcon}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span className={styles.dateText}>13TH – 22ND OF OCTOBER</span>
                  </div>

                  {/* Gold Divider */}
                  <div className={styles.goldDivider} />

                  {/* Advance Booking Note */}
                  <div className={styles.noticeBox}>
                    <span className={styles.noticeNumber}>1</span>
                    <p className={styles.noticeText}>
                      Please book in advance if you have something important coming up.
                    </p>
                  </div>

                  {/* Gold Divider */}
                  <div className={styles.goldDivider} />

                  {/* Barber Availability Cards */}
                  <div className={styles.barberStatusGrid}>
                    {/* Harry Card */}
                    <div className={styles.barberCard}>
                      <div className={styles.barberCardAvatarWrapper}>
                        <Image
                          src="/barbers/Harry.jpg"
                          alt="Harry"
                          width={60}
                          height={60}
                          className={styles.barberAvatarImg}
                        />
                      </div>
                      <h4 className={styles.barberName}>Harry</h4>
                      <span className={`${styles.barberStatusTag} ${styles.statusAway}`}>
                        Away Oct 13–22
                      </span>
                    </div>

                    {/* Kavish Card */}
                    <div className={`${styles.barberCard} ${styles.barberCardActive}`}>
                      <div className={styles.barberCardAvatarWrapper}>
                        <Image
                          src="/barbers/Kavish.jpg"
                          alt="Kavish"
                          width={60}
                          height={60}
                          className={styles.barberAvatarImg}
                        />
                      </div>
                      <h4 className={styles.barberName}>Kavish</h4>
                      <span className={`${styles.barberStatusTag} ${styles.statusAvailable}`}>
                        <span className={styles.activeDot} />
                        In-Store & Ready
                      </span>
                    </div>
                  </div>

                  {/* Highlight message */}
                  <p className={styles.highlightMessage}>
                    In the meantime, <strong>Kavish</strong> will take care of you ✂️
                  </p>

                  {/* CTAs */}
                  <div className={styles.actionsWrapper}>
                    <Link
                      href="/book"
                      onClick={handleDismiss}
                      className={styles.primaryCta}
                    >
                      <span>Book with Kavish</span>
                      <svg
                        width="16"
                        height="16"
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
                      className={styles.secondaryDismiss}
                    >
                      Got it, continue to site
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
