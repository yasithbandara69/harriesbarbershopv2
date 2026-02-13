
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
        squarePlanId: 'EN3KSUE7CWSLGN62HSC2OKOU', // Working Legacy Plan ($1)
        squarePlanVariationId: 'YX4DI7J4L2G2XEPM5IINNTMS',
        itemVariationId: 'MN74NI7HDAD56CGSQHATYX75',
        serviceId: 'IG3KC7ZQIDZFPETUY3UWRPTU', // Updated Subscription Haircut Variation ID
        tier: 'Gold',
        price: 1, // Keep as $1 test for now
        interval: 'MONTHLY',
        credits: 2,
        included: [
          'Monthly Haircut',
          'Free Cleanup',
          'Product Discounts'
        ],
        notIncluded: [
          'Beard Trim',
          'VIP Booking Priority'
        ]
      },
      {
        id: 'platinum-cut',
        squarePlanId: 'K52VUMY7K6YEJHVR2P2R3M6R', // New Forever Plan (Fixed Price)
        squarePlanVariationId: 'TFSY2VFPHQJ4JTGSPGFVVJQA',
        itemVariationId: 'L3M7G47Q63K2X5Q55K4I75U7',
        serviceId: 'IG3KC7ZQIDZFPETUY3UWRPTU', // Updated Subscription Haircut Variation ID
        tier: 'Platinum',
        price: 180,
        interval: 'MONTHLY',
        credits: 4,
        included: [
          'Bi-Weekly Haircut (2/mo)',
          'Free Cleanups (Unlimited)',
          'Priority Booking',
          'Product Discounts'
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
        squarePlanId: 'USRP54Q7NJFMR2PQ5MU43PM6', // New Forever Plan (Fixed Price)
        squarePlanVariationId: 'RT5YC76UK6CMGWJX3ROWZBHT',
        itemVariationId: 'MNIB2VOXZDWE27IUDYNU6OXC',
        serviceId: '6ZJHSA7CEIIK2MAYR4OBTNUW', // Updated Subscription Haircut + Beard Variation ID
        tier: 'Gold',
        price: 130,
        interval: 'MONTHLY',
        credits: 2,
        included: [
          'Monthly Haircut + Beard Trim',
          'Free Cleanup',
          'Product Discounts'
        ],
        notIncluded: [
          'VIP Booking Priority'
        ]
      },
      {
        id: 'platinum-combo',
        squarePlanId: 'SRDM2BT37ZJL2PL4F4O6654F', // New Forever Plan (Fixed Price)
        squarePlanVariationId: '6Y5M6Z4Q3J4J5G4X3K3I55J6',
        itemVariationId: 'J5K3M67Q43K2X5Q55K4I75U7',
        serviceId: '6ZJHSA7CEIIK2MAYR4OBTNUW', // Updated Subscription Haircut + Beard Variation ID
        tier: 'Platinum',
        price: 240,
        interval: 'MONTHLY',
        credits: 4,
        included: [
          'Bi-Weekly Haircut + Beard (2/mo)',
          'Free Cleanups (Unlimited)',
          'Priority Booking',
          'Product Discounts'
        ],
        notIncluded: []
      }
    ]
  }
];
