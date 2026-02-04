
'use client';


import React, { useEffect, useState } from 'react';
import { SUBSCRIPTION_DATA } from './subscription-data';
import { Button } from './Button';
import { Check, Crown, Star } from 'lucide-react';
import { SubscriptionPlan } from './subscription-data';
import styles from './Subscriptions.module.css';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import AuthModal from './auth/AuthModal';

interface EnrichedPlan extends SubscriptionPlan {
  serviceName: string;
}

export default function Subscriptions() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSelectPlan = async (plan: EnrichedPlan) => {
    if (!plan.squarePlanId) {
        alert("Configuration Error: No Square Plan ID found.");
        return;
    }

    if (user) {
        // User is logged in, redirect to checkout generation
        // Use window.location.href to handle API redirects/errors correctly
        window.location.href = `/api/checkout/subscription?planId=${plan.squarePlanId}`;
    } else {
        // User is NOT logged in, open the Auth Modal
        setSelectedPlanId(plan.squarePlanId);
        setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
      setIsAuthModalOpen(false);
      if (selectedPlanId) {
          // Use window.location.href so the browser handles the API response (redirect or JSON error) directly.
          // This avoids Next.js Router trying to "fetch" the API route as a page transition.
          window.location.href = `/api/checkout/subscription?planId=${selectedPlanId}`;
      } else {
          router.push('/dashboard');
      }
  };

  // Helper to extract plans by tier and attach service name
  const getPlansByTier = (tier: 'Gold' | 'Platinum'): EnrichedPlan[] => {
    return SUBSCRIPTION_DATA.map(category => {
      const plan = category.plans.find(p => p.tier === tier);
      return plan ? { ...plan, serviceName: category.label } : null;
    }).filter((p): p is EnrichedPlan => p !== null);
  };

  const goldPlans = getPlansByTier('Gold');
  const platinumPlans = getPlansByTier('Platinum');

  return (
    <section id="subscriptions" className={styles.section}>
        <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            initialView="signup"
            onSuccess={handleAuthSuccess}
        />
        {/* Background Decorative Elements */}
        <div className={styles.decorativeBg}>
            <div className={styles.circleOne}></div>
            <div className={styles.circleTwo}></div>
        </div>

      <div className={styles.container}>
        
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.subheading}>
            JOIN THE CLUB
          </span>
          <h2 className={styles.heading}>
            Membership Tiers
          </h2>
          <p className={styles.description}>
            Choose your tier, then select your preferred package.
          </p>
        </div>

        {/* Main Grid: Shows Gold and Platinum Side-by-Side on large screens */}
        <div className={styles.tiersGrid}>
          <TierContainer tier="Gold" plans={goldPlans} onSelect={handleSelectPlan} />
          <TierContainer tier="Platinum" plans={platinumPlans} onSelect={handleSelectPlan} />
        </div>
      </div>
    </section>
  );
};

const TierContainer: React.FC<{ tier: 'Gold' | 'Platinum', plans: EnrichedPlan[], onSelect: (p: EnrichedPlan) => void }> = ({ tier, plans, onSelect }) => {
  const isPlatinum = tier === 'Platinum';
  const containerClass = isPlatinum ? styles.platinumContainer : styles.goldContainer;
  const iconBgClass = isPlatinum ? styles.iconBgPlatinum : styles.iconBgGold;
  const titleClass = isPlatinum ? styles.tierTitlePlatinum : styles.tierTitleGold;
  
  return (
    <div className={`${styles.tierCard} ${containerClass}`}>
      
      {/* Tier Header (Top of the Box) */}
      <div className={styles.tierHeader}>
         <div className={`${styles.iconWrapper} ${iconBgClass}`}>
             {isPlatinum ? <Crown size={40} strokeWidth={1} /> : <Star size={40} strokeWidth={1} />}
         </div>
         <h3 className={`${styles.tierTitle} ${titleClass}`}>
            {tier} Membership
         </h3>
         <p className={styles.tierSubtitle}>
            {isPlatinum ? 'The ultimate grooming experience' : 'Essential maintenance for the modern man'}
         </p>
      </div>

      {/* Inner Content: Service Cards Side-by-Side */}
      <div className={styles.plansGrid}>
         {plans.map((plan) => (
             <ServiceSubCard key={plan.id} plan={plan} isPlatinum={isPlatinum} onSelect={onSelect} />
         ))}
      </div>
    </div>
  );
};

const ServiceSubCard: React.FC<{ plan: EnrichedPlan, isPlatinum: boolean, onSelect: (p: EnrichedPlan) => void }> = ({ plan, isPlatinum, onSelect }) => {
    const cardClass = isPlatinum ? styles.subCardPlatinum : styles.subCardGold;
    const priceColorClass = isPlatinum ? styles.textWhite : styles.textGold;
    const badgeClass = isPlatinum ? styles.badgePlatinum : styles.badgeGold;
    const dividerClass = isPlatinum ? styles.dividerPlatinum : styles.dividerGold;
    const checkColorClass = isPlatinum ? styles.textWhite : styles.textGold;
    const btnVariant = isPlatinum ? 'ghost' : 'outline';
    const btnClass = isPlatinum ? styles.btnPlatinum : styles.btnGold;

    return (
        <div className={`${styles.subCard} ${cardClass}`}>
            
            {/* Service Name Header */}
            <div className={styles.subCardHeader}>
                <h4 className={styles.serviceName}>
                    {plan.serviceName}
                </h4>
                <div className={styles.billingBadge}>
                     <span className={styles.billingText}>
                        {plan.billingCycle.replace('billed ', '')}
                    </span>
                </div>
            </div>

            {/* Price */}
            <div className={styles.priceWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <span className={`${styles.priceValue} ${priceColorClass}`}>{plan.price}</span>
            </div>

            {/* Savings Badge */}
            <div className={styles.savingsWrapper}>
                <span className={`${styles.savingsBadge} ${badgeClass}`}>
                    {plan.savings}
                </span>
            </div>

            {/* Features Divider */}
            <div className={`${styles.divider} ${dividerClass}`}></div>

            {/* Features List */}
            <ul className={styles.featuresList}>
                {plan.features.map((feature, idx) => (
                    <li key={idx} className={styles.featureItem}>
                        <Check size={18} className={`${styles.checkIcon} ${checkColorClass}`} />
                        <span className={styles.featureText}>{feature}</span>
                    </li>
                ))}
            </ul>

            {/* Action Button */}
            <Button 
                fullWidth 
                variant={btnVariant}
                className={`${styles.selectBtn} ${btnClass}`}
                onClick={() => onSelect(plan)}
            >
                Select
            </Button>
        </div>
    )
}
