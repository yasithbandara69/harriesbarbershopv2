'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import AuthModal from './auth/AuthModal';
import MembershipModal from './MembershipModal';
import styles from "./Memberships.module.css";

export default function Memberships() {
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedPlanTitle, setSelectedPlanTitle] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const handleJoinClick = async (planTitle: string) => {
    setSelectedPlanTitle(planTitle);
    setShowMembershipModal(true);
  };

  const memberships = [
    {
      title: "Haircut",
      price: "200",
      features: [
        "4 haircut credits per month",
        "Save 10% on every visit",
        "Monthly renewal",
        "Free birthday week refresh",
      ],
    },
    {
      title: "Haircut + Beard",
      price: "260",
      features: [
        "4 haircut and beard service credits per month",
        "Save 10% on every visit",
        "Monthly renewal",
        "Free birthday week refresh",
      ],
    },
  ];

  return (
    <section id="memberships" className={styles.sectionWrapper}>
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h2 className={styles.mainTitle}>Loyalty Memberships</h2>
          <p className={styles.mainSubtitle}>Choose the plan that suits your grooming needs.</p>
        </div>

        <div className={styles.cardsGrid}>
          {memberships.map((plan) => (
            <div key={plan.title} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{plan.title}</h3>
                <div className={styles.price}>
                  AUD {plan.price} <span className={styles.period}>/ month</span>
                </div>
              </div>
              <ul className={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <svg className={styles.featureIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className={styles.joinButton} 
                onClick={() => handleJoinClick(plan.title)}
              >
                Join Now
              </button>
            </div>
          ))}
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialView="signup" 
        onSuccess={() => {
            setShowAuthModal(false);
            if (selectedPlanTitle) {
                setShowMembershipModal(true);
            }
        }}
      />

      <MembershipModal 
        isOpen={showMembershipModal} 
        onClose={() => setShowMembershipModal(false)} 
        planTitle={selectedPlanTitle} 
        isAuthenticated={!!user}
        onRequireAuth={() => {
            setShowMembershipModal(false);
            setShowAuthModal(true);
        }}
      />
    </section>
  );
}
