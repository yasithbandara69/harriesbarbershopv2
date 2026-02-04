
export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  squarePlanId: string; // The ID from Square Dashboard (e.g., "L6... or similar")
  itemVariationId?: string; // The specific Item Variation ID required for "Varies by item" plans
  tier: 'Gold' | 'Platinum';
  price: number;
  billingCycle: string; // e.g., "every 2 months"
  savings: string;
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
        squarePlanId: 'KBSCWFLBQ4XFOKLB3SI5HNWY',
        itemVariationId: '476R3Q6R3TFKNNPQ2DYQ47KE', // Gold haircut subscription - $100
        tier: 'Gold',
        price: 200,
        billingCycle: 'billed every 2 months',
        savings: 'Save 10%',
        features: [
          '2 Haircuts per month',
          'Priority Booking',
          'Complimentary Drink',
          'Save 10% from every haircut'
        ]
      },
      {
        id: 'plat-cut',
        squarePlanId: 'PUHE4GTFY5J2BMLX3JFTP27Y',
        itemVariationId: 'DFLWJUF5ECY32UDE7CBU6DQN', // Platinum Haircut Subscription - $180
        tier: 'Platinum',
        price: 360,
        billingCycle: 'billed every 2 months',
        savings: 'Save 20%',
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
        squarePlanId: 'VAHMD5HHO2SV63VBVG5CGWOM',
        itemVariationId: 'TZF5UHVBPH47RLICWPFHQA55', // Gold Subscription Haircut + Beard - $130
        tier: 'Gold',
        price: 260,
        billingCycle: 'billed every 2 months',
        savings: 'Save 10%',
        features: [
          'Includes 2 Haircut & Beard services',
          'Hot Towel Treatment',
          'Save 10% every time',
          'Standard Booking'
        ]
      },
      {
        id: 'plat-combo',
        squarePlanId: 'HATGGV4XB53Q6MXZHGO3ACJ5',
        itemVariationId: '2ALT23O67AI77UJ5LXYYTL4I', // Platinum Haircut + Beard Subscription - $240
        tier: 'Platinum',
        price: 480,
        billingCycle: 'billed every 2 months',
        savings: 'Save 15%',
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
