export interface SubscriptionPlan {
  id: string;
  tier: 'Essential' | 'Premium';
  squarePlanId?: string;
  squarePlanVariationId?: string;
  price: string;
  interval: string;
  included: string[];
}

export const SUBSCRIPTION_DATA = [
  {
    label: 'Haircut Only',
    plans: [
      {
        id: 'essential-haircut',
        tier: 'Essential' as const,
        price: '100',
        interval: 'Monthly',
        included: ['2 Haircuts credits per month', 'Save 10% on every haircut', 'Billed monthly']
      },
      {
        id: 'premium-haircut',
        tier: 'Premium' as const,
        price: '180',
        interval: 'Monthly',
        included: ['4 Haircut credits per month','Save 20% every month', 'Free birthday week refresh', 'Billed monthly']
      }
    ]
  },
  {
    label: 'Haircut & Beard',
    plans: [
      {
        id: 'essential-beard',
        tier: 'Essential' as const,
        price: '130',
        interval: 'Monthly',
        included: ['2 Haircuts & Beard Credits per Month', 'Save 10% on every service', 'Billed monthly']
      },
      {
        id: 'premium-beard',
        tier: 'Premium' as const,
        price: '240',
        interval: 'Monthly',
        included: ['4 Haircut & Beard Credits per Month','Save 20% every month', 'Free birthday week refresh', 'Billed monthly']
      }
    ]
  }
];
