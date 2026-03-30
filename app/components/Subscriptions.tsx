'use client';

import React, { useState } from 'react';
import { SUBSCRIPTION_DATA } from './subscription-data';
import { Button } from './Button';
import { Check, Crown, Star } from 'lucide-react';
import { SubscriptionPlan } from './subscription-data';
import styles from './Subscriptions.module.css';

interface EnrichedPlan extends SubscriptionPlan {
  serviceName: string;
}

export default function Subscriptions() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (plan: EnrichedPlan) => {
    try {
      // 1. Check if user is logged in
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to login with a return URL
        window.location.href = `/login?redirect=/?selectedPlan=${plan.id}#subscriptions`;
        return;
      }

      // Map local plan to Stripe Price ID
      const priceMap: Record<string, string> = {
        'essential-haircut': 'price_1TGfDmLJS030B1q4alm4pDpe',
        'essential-beard': 'price_1TGfCMLJS030B1q41AbO2kwV',
        'premium-haircut': 'price_1TFFPdLJS030B1q4pOhImkwQ',
        'premium-beard': 'price_1TFFRVLJS030B1q4FNqhcnBS'
      };

      const priceId = priceMap[plan.id];
      if (!priceId) {
         alert("Invalid plan selected or missing Price ID.");
         return;
      }

      // 2. Create Checkout Session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId, planId: plan.id }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to initiate checkout. Please try again.");
    }
  };

  const getPlansByTier = (tier: 'Essential' | 'Premium'): EnrichedPlan[] => {
    return SUBSCRIPTION_DATA.map(category => {
      const plan = category.plans.find(p => p.tier === tier);
      return plan ? { ...plan, serviceName: category.label } : null;
    }).filter((p): p is EnrichedPlan => p !== null);
  };

  const goldPlans = getPlansByTier('Essential');
  const platinumPlans = getPlansByTier('Premium');

  return (
    <section id="subscriptions" className={styles.section}>
        <div className={styles.decorativeBg}>
            <div className={styles.circleOne}></div>
            <div className={styles.circleTwo}></div>
        </div>

      <div className={styles.container}>
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

        <div className={styles.tiersGrid}>
          <TierContainer tier="Essential" plans={goldPlans} onSelect={handleSelectPlan} />
          <TierContainer tier="Premium" plans={platinumPlans} onSelect={handleSelectPlan} />
        </div>
      </div>
    </section>
  );
};

const TierContainer: React.FC<{ tier: 'Essential' | 'Premium', plans: EnrichedPlan[], onSelect: (p: EnrichedPlan) => void }> = ({ tier, plans, onSelect }) => {
  const isPlatinum = tier === 'Premium';
  const containerClass = isPlatinum ? styles.platinumContainer : styles.goldContainer;
  const iconBgClass = isPlatinum ? styles.iconBgPlatinum : styles.iconBgGold;
  const titleClass = isPlatinum ? styles.tierTitlePlatinum : styles.tierTitleGold;
  
  return (
    <div className={`${styles.tierCard} ${containerClass}`}>
      <div className={styles.tierHeader}>
         <div className={`${styles.iconWrapper} ${iconBgClass}`}>
             {isPlatinum ? <Crown size={40} strokeWidth={1} /> : <Star size={40} strokeWidth={1} />}
         </div>
         <h3 className={`${styles.tierTitle} ${titleClass}`}>
            {tier}
         </h3>
         <p className={styles.tierSubtitle}>
            {isPlatinum ? 'Weekly Refresh' : 'Fortnightly Refresh'}
         </p>
      </div>

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
            <div className={styles.subCardHeader}>
                <h4 className={styles.serviceName}>
                    {plan.serviceName}
                </h4>
            </div>

            <div className={styles.priceWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <span className={`${styles.priceValue} ${priceColorClass}`}>{plan.price}</span>
            </div>
            
            <div className={styles.billedText}>
                Billed {plan.interval === 'MONTHLY' ? 'Monthly' : plan.interval.toLowerCase()}
            </div>

            <div className={`${styles.divider} ${dividerClass}`}></div>

            <ul className={styles.featuresList}>
                {plan.included.map((feature, idx) => (
                    <li key={idx} className={styles.featureItem}>
                        <Check size={18} className={`${styles.checkIcon} ${checkColorClass}`} />
                        <span className={styles.featureText}>{feature}</span>
                    </li>
                ))}
            </ul>

            <Button 
                fullWidth 
                variant={btnVariant as any}
                className={`${styles.selectBtn} ${btnClass}`}
                onClick={() => onSelect(plan)}
            >
                Select
            </Button>
        </div>
    )
}
