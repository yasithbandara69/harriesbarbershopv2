
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
        squarePlanId: 'LBZTK3K4MEBVIIWAVSURO2SK',
        squarePlanVariationId: 'KBSCWFLBQ4XFOKLB3SI5HNWY',
        itemVariationId: '476R3Q6R3TFKNNPQ2DYQ47KE', // Gold haircut subscription - $100
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
        squarePlanId: 'TSHE4PYA5732HHUE3YG3FQJR',
        squarePlanVariationId: 'PUHE4GTFY5J2BMLX3JFTP27Y',
        itemVariationId: 'DFLWJUF5ECY32UDE7CBU6DQN', // Platinum Haircut Subscription - $180
        serviceId: 'IG3KC7ZQIDZFPETUY3UWRPTU',
        tier: 'Platinum',
        price: 180,
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
        squarePlanId: 'QALKFCB6FL5TSTCCKWE6VU57',
        squarePlanVariationId: 'HATGGV4XB53Q6MXZHGO3ACJ5',
        itemVariationId: '2ALT23O67AI77UJ5LXYYTL4I', // Platinum Haircut + Beard Subscription - $240
        serviceId: '6ZJHSA7CEIIK2MAYR4OBTNUW',
        tier: 'Platinum',
        price: 240,
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
