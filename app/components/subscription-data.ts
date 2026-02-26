
export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  squarePlanId: string; // The ID from Square Dashboard (e.g., "L6... or similar")
  squarePlanVariationId?: string; // The Variation ID specific for checkout (The ID inside the plan)
  serviceId: string; // The 0-dollar service ID for booking bookings
  tier: 'Essential' | 'Premium';
  price: number;
  interval: string; // e.g., "MONTHLY"
  credits: number; // Number of appointments included per month
  included: string[];
  notIncluded: string[];
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
        squarePlanId: 'TZFH5YML6ZEMQHMKQBUJ34UN', // Fixed Price Endless Plan ($100)
        squarePlanVariationId: 'LNYMDFILAERC4QFPNQPZIBFF',
        serviceId: 'IG3KC7ZQIDZFPETUY3UWRPTU', // Updated Subscription Haircut Variation ID
        tier: 'Essential',
        price: 100, // Updated price
        interval: 'MONTHLY',
        credits: 2,
        included: [
          '2 haircut credits per month',
          'Save 10% on every haircut',
          'Monthly renewal',
          'Free birthday week refresh'
        ],
        notIncluded: [
          'Beard Trim',
          'VIP Booking Priority'
        ]
      },
      {
        id: 'platinum-cut',
        squarePlanId: 'BUDXPHD2Y5EZ7UIDBYMW623E', // Fixed Price Endless Plan ($180)
        squarePlanVariationId: 'LN5H7B6ESL45L6YYHX3MUNNS',
        serviceId: 'IG3KC7ZQIDZFPETUY3UWRPTU', // Updated Subscription Haircut Variation ID
        tier: 'Premium',
        price: 180,
        interval: 'MONTHLY',
        credits: 4,
        included: [
          '4 haircut credits per month',
          'Save 20% every month',
          'Monthly renewal',
          'Free birthday week refresh',
          '10% discount on any product'
        ],
        notIncluded: [
          'Beard Trim'
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
        squarePlanId: 'HL5VE743PNSICUCYAOCLTTET', // Fixed Price Endless Plan ($130)
        squarePlanVariationId: 'WODSYCJGMBI7VB2EQMAYR4UB',
        serviceId: '6ZJHSA7CEIIK2MAYR4OBTNUW', // Updated Subscription Haircut + Beard Variation ID
        tier: 'Essential',
        price: 130,
        interval: 'MONTHLY',
        credits: 2,
        included: [
          '2 haircut & beard trims per month',
          'Save 10% on every service',
          'Monthly renewal',
          'Free birthday week refresh'
        ],
        notIncluded: [
          'VIP Booking Priority'
        ]
      },
      {
        id: 'platinum-combo',
        squarePlanId: 'MHOBTRKJ75F6S2DH5QWSPXPB', // Fixed Price Endless Plan ($240)
        squarePlanVariationId: 'T36L2EOTEHWDUSYDIFHU3C5G',
        serviceId: '6ZJHSA7CEIIK2MAYR4OBTNUW', // Updated Subscription Haircut + Beard Variation ID
        tier: 'Premium',
        price: 240,
        interval: 'MONTHLY',
        credits: 4,
        included: [
          '4 haircut & beard credits per month',
          'Save 20% every month',
          'Monthly renewal',
          'Free birthday week refresh',
          '10% discount on any product'
        ],
        notIncluded: []
      }
    ]
  }
];
