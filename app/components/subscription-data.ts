
export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  squarePlanId: string; // The ID from Square Dashboard (e.g., "L6... or similar")
  squarePlanVariationId?: string; // The Variation ID specific for checkout (The ID inside the plan)
  itemVariationId?: string; // The specific Item Variation ID required for "Varies by item" plans
  serviceId: string; // The 0-dollar service ID for booking bookings
  tier: 'Gold' | 'Platinum';
  price: number;
  billingCycle: string; // e.g., "billed monthly"
  savings: string;
  credits: number; // Number of appointments included per month
  features: string[];
  recommended?: boolean;
}

export interface ServiceCategory {
  id: 'haircut' | 'beard';
  label: string;
  plans: SubscriptionPlan[];
}

export const SUBSCRIPTION_DATA: ServiceCategory[] = [
  {
    id: 'haircut',
    label: 'Haircut Only',
    plans: [
      {
        id: 'gold-cut',
        squarePlanId: 'EJGEEVYKOZMCQHWCLZI7MA4Z',
        squarePlanVariationId: 'CAL3SGZYVTDQJFR6NY5R72OD', // Correct Variation ID
        itemVariationId: 'MN74NI7HDAD56CGSQHATYX75', // Gold Membership Haircut ($100)
        serviceId: 'IG3KC7ZQIDZFPETUY3UWRPTU',
        tier: 'Gold',
        price: 100,
        billingCycle: 'per month',
        savings: 'Save 10%',
        credits: 2,
        features: [
          '2 Haircuts per month',
          'Priority Booking',
          'Complimentary Drink',
          'Save 10% from every haircut'
        ]
      },
      {
        id: 'plat-cut',
        squarePlanId: 'SFPSWC624HXPLC74XTMTTKAE',
        squarePlanVariationId: 'SFPSWC624HXPLC74XTMTTKAE',
        itemVariationId: 'K2N5M24UCFRN2TWJJCCPYUWU', // Platinum Membership Haircut (TESTING $1)
        serviceId: 'IG3KC7ZQIDZFPETUY3UWRPTU',
        tier: 'Platinum',
        price: 1,
        billingCycle: 'per month',
        savings: 'Save 20%',
        credits: 4,
        features: [
          '4 Haircuts per month',
          'VIP Priority Booking',
          'Complimentary Premium Drink',
          'Save 20% from every haircut',
          'Product Discount 5%'
        ],
        recommended: true
      }
    ]
  },
  {
    id: 'beard',
    label: 'Haircut + Beard',
    plans: [
      {
        id: 'gold-combo',
        squarePlanId: 'LW5ZSQKJQ2TQ6GH3ZDRU',
        squarePlanVariationId: 'NBFQJPSPRQMVTBHPC3LX6QCD',
        itemVariationId: 'UTYAA22JQROPKLS4KZ4TSQZI', // Gold Membership Haircut + Beard - Billing
        serviceId: '6ZJHSA7CEIIK2MAYR4OBTNUW',
        tier: 'Gold',
        price: 130,
        billingCycle: 'per month',
        savings: 'Save 10%',
        credits: 2,
        features: [
          'Includes 2 Haircut & Beard services',
          'Hot Towel Treatment',
          'Save 10% every time',
          'Standard Booking'
        ]
      },
      {
        id: 'plat-combo',
        squarePlanId: 'DWOHUIGPOJHQZQNG3ZJKL7U5',
        squarePlanVariationId: 'DWOHUIGPOJHQZQNG3ZJKL7U5',
        itemVariationId: 'VSZFN5PWDHPQDYNPKRDYYZMC', // Platinum Membership Haircut + Beard (TESTING $1)
        serviceId: '6ZJHSA7CEIIK2MAYR4OBTNUW',
        tier: 'Platinum',
        price: 1,
        billingCycle: 'per month',
        savings: 'Save 15%',
        credits: 4,
        features: [
          'Includes 4 Haircut & Beard services',
          'Premium Hot Towel Shave',
          'Save 15% every time',
          'VIP Booking Access'
        ],
        recommended: true
      }
    ]
  }
];
