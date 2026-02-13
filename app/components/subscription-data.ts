
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
        squarePlanId: 'EN3KSUE7CWSLGN62HSC2OKOU', // Working Legacy Plan ($1)
        squarePlanVariationId: 'YX4DI7J4L2G2XEPM5IINNTMS',
        itemVariationId: 'MN74NI7HDAD56CGSQHATYX75',
        serviceId: 'IG3KC7ZQIDZFPETUY3UWRPTU',
        tier: 'Gold',
        price: 1, // Keep as $1 test for now
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
        squarePlanId: 'K52VUMY7IX4MVVQ3LEG6EWI2', // New Forever Plan (Fixed Price)
        squarePlanVariationId: 'ACN565PXFAYNQIFZTZVI4WBJ',
        itemVariationId: 'J2UQ3PMSLG3XU7Y4XYZ2EXWF',
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
        squarePlanId: 'USRP54Q7NJFMR2PQ5MU43PM6', // New Forever Plan (Fixed Price)
        squarePlanVariationId: 'RT5YC76UK6CMGWJX3ROWZBHT',
        itemVariationId: 'MNIB2VOXZDWE27IUDYNU6OXC',
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
        squarePlanId: 'SRDM2BT3QI32SIN4XYVJCCKW', // New Forever Plan (Fixed Price)
        squarePlanVariationId: 'LXQEGF7HRF2ODK26STS7AA33',
        itemVariationId: '5XANHPRPBRTYTJMV6B2POJ5S',
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
