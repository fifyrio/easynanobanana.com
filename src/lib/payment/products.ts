// Nano Banana AI Image Editor pricing plans
// Based on actual pricing page data structure

import { Product } from './types';
import { getPaymentConfig } from './config';

// Subscription Plans - Monthly
export const MONTHLY_SUBSCRIPTION_PLANS: Product[] = [
  {
    product_id: 'basic_monthly',
    name: 'Basic',
    icon: '⚡',
    price: 7.99,
    credits: '100 credits/month',
    description: 'Perfect for individuals and light users',
    buttonText: 'Subscribe Now',
    buttonVariant: 'secondary',
    type: 'subscription',
    billing_period: 'monthly',
    isPopular: false,
    features: [
      '50 high-quality images/month',
      'All style templates included',
      'Standard generation speed',
      'Basic customer support',
      'JPG/PNG format downloads'
    ],
    // Legacy compatibility
    product_name: 'Basic Monthly',
    popular: false,
    pricePerCredit: 0.0799
  },
  {
    product_id: 'pro_monthly',
    name: 'Pro',
    icon: '🚀',
    price: 27.99,
    credits: '500 credits/month',
    description: 'For professional creators and teams',
    buttonText: 'Subscribe Now',
    buttonVariant: 'primary',
    type: 'subscription',
    billing_period: 'monthly',
    isPopular: true,
    features: [
      '250 high-quality images/month',
      'All style templates included',
      'Priority generation queue',
      'Priority customer support',
      'JPG/PNG/WebP format downloads',
    ],
    // Legacy compatibility
    product_name: 'Pro Monthly',
    popular: true,
    pricePerCredit: 0.056
  },
  {
    product_id: 'max_monthly',
    name: 'Max',
    icon: '👑',
    price: 78.99,
    credits: '1600 credits/month',
    description: 'Designed for large enterprises and professional studios',
    buttonText: 'Subscribe Now',
    buttonVariant: 'secondary',
    type: 'subscription',
    billing_period: 'monthly',
    isPopular: false,
    features: [
      '800 high-quality images/month',
      'All style templates included',
      'Fastest generation speed',
      'Dedicated account manager',      
      'Professional editing suite (Coming in October)'
    ],
    // Legacy compatibility
    product_name: 'Max Monthly',
    popular: false,
    pricePerCredit: 0.049
  }
];

// Subscription Plans - Yearly (with discounts)
export const YEARLY_SUBSCRIPTION_PLANS: Product[] = [
  {
    product_id: 'basic_yearly',
    name: 'Basic',
    icon: '⚡',
    price: 6.99,
    originalPrice: 7.99,
    yearlyPrice: 83.99,
    credits: '1200 credits/year',
    description: 'Perfect for individuals and light users',
    buttonText: 'Subscribe Now',
    buttonVariant: 'secondary',
    type: 'subscription',
    billing_period: 'yearly',
    isPopular: false,
    features: [
      '50 high-quality images/month',
      'All style templates included',
      'Standard generation speed',
      'Basic customer support',
      'JPG/PNG format downloads'
    ],
    // Legacy compatibility
    product_name: 'Basic Yearly',
    popular: false,
    pricePerCredit: 0.070
  },
  {
    product_id: 'pro_yearly',
    name: 'Pro',
    icon: '🚀',
    price: 22.99,
    originalPrice: 27.99,
    yearlyPrice: 275.99,
    credits: '6000 credits/year',
    description: 'For professional creators and teams',
    buttonText: 'Subscribe Now',
    buttonVariant: 'primary',
    type: 'subscription',
    billing_period: 'yearly',
    isPopular: true,
    features: [
      '250 high-quality images/month',
      'All style templates included',
      'Priority generation queue',
      'Priority customer support',
      'JPG/PNG/WebP format downloads',    
      'Image editing tools (Coming in October)'
    ],
    // Legacy compatibility
    product_name: 'Pro Yearly',
    popular: true,
    pricePerCredit: 0.046
  },
  {
    product_id: 'max_yearly',
    name: 'Max',
    icon: '👑',
    price: 62.99,
    originalPrice: 78.99,
    yearlyPrice: 755.99,
    credits: '19200 credits/year',
    description: 'Designed for large enterprises and professional studios',
    buttonText: 'Subscribe Now',
    buttonVariant: 'secondary',
    type: 'subscription',
    billing_period: 'yearly',
    isPopular: false,
    features: [
      '800 high-quality images/month',
      'All style templates included',
      'Fastest generation speed',
      'Dedicated account manager',      
      'Professional editing suite (Coming in October)'
    ],
    // Legacy compatibility
    product_name: 'Max Yearly',
    popular: false,
    pricePerCredit: 0.039
  }
];

// Credit Packs - One-time purchases
export const CREDIT_PACKS: Product[] = [
  {
    product_id: 'starter_pack',
    name: 'Starter Pack',
    icon: '🎯',
    price: 28,
    credits: 200,
    description: 'Try out our AI capabilities',
    buttonText: 'Buy Now',
    type: 'once',
    isPopular: false,
    features: [
      '200 credits included',
      'Never expires',
      'All features unlocked'
    ],
    // Legacy compatibility
    product_name: 'Starter Pack',
    popular: false,
    pricePerCredit: 0.14
  },
  {
    product_id: 'growth_pack',
    name: 'Growth Pack',
    icon: '📈',
    price: 78,
    credits: 555,
    description: 'Perfect for regular creators',
    buttonText: 'Buy Now',
    type: 'once',
    isPopular: true,
    features: [
      '555 credits included',  // Note: pricing page shows 555 but features show 533
      'Never expires',
      'Priority support included'
    ],
    // Legacy compatibility
    product_name: 'Growth Pack',
    popular: true,
    pricePerCredit: 0.14
  },
  {
    product_id: 'professional_pack',
    name: 'Professional Pack',
    icon: '💼',
    price: 220,
    credits: 1366,
    description: 'For serious content creators',
    buttonText: 'Buy Now',
    type: 'once',
    isPopular: false,
    features: [
      '1366 credits included',  // Note: pricing page shows 1366 but features show 1333
      'Never expires',
      'Priority support & batch processing'
    ],
    // Legacy compatibility
    product_name: 'Professional Pack',
    popular: false,
    pricePerCredit: 0.16
  },
  {
    product_id: 'enterprise_pack',
    name: 'Enterprise Pack',
    icon: '🏢',
    price: 880,
    credits: 5633,
    description: 'Maximum value for teams',
    buttonText: 'Buy Now',
    type: 'once',
    isPopular: false,
    features: [
      '5633 credits included',  // Note: pricing page shows 5633 but features show 5333
      'Never expires',
      'Dedicated support & API access'
    ],
    // Legacy compatibility
    product_name: 'Enterprise Pack',
    popular: false,
    pricePerCredit: 0.16
  }
];

// All products combined
export const ALL_PRODUCTS: Product[] = [
  ...MONTHLY_SUBSCRIPTION_PLANS,
  ...YEARLY_SUBSCRIPTION_PLANS,
  ...CREDIT_PACKS
];

// Categorized exports
export const SUBSCRIPTION_PLANS: Product[] = [
  ...MONTHLY_SUBSCRIPTION_PLANS,
  ...YEARLY_SUBSCRIPTION_PLANS
];

// Legacy compatibility - use ALL_PRODUCTS as default PLANS
export const PLANS: Product[] = ALL_PRODUCTS;

// Helper functions with server-side configuration support
export function getPlans(): Product[] {
  try {
    const config = getPaymentConfig();
    // Map actual product IDs from config if available
    return ALL_PRODUCTS.map(product => ({
      ...product,
      // Override product_id with actual IDs from config if they exist
      product_id: getActualProductId(product.product_id, config) || product.product_id
    }));
  } catch {
    // Fallback to static plans for client-side
    return ALL_PRODUCTS;
  }
}

function getActualProductId(defaultId: string, config: any): string | null {
  // Map default IDs to config IDs based on naming convention
  const idMap: Record<string, string> = {
    'basic_monthly': config.basicProductId,
    'pro_monthly': config.proProductId,
    'max_monthly': config.maxProductId,
    'basic_yearly': config.basicYearlyProductId,
    'pro_yearly': config.proYearlyProductId,
    'max_yearly': config.maxYearlyProductId,
    'starter_pack': config.starterPackId,
    'growth_pack': config.growthPackId,
    'professional_pack': config.professionalPackId,
    'enterprise_pack': config.enterprisePackId
  };
  
  return idMap[defaultId] || null;
}

// Helper functions
export const getProductById = (productId: string): Product | undefined => {
  try {
    const plans = getPlans();
    return plans.find(product => product.product_id === productId);
  } catch {
    return ALL_PRODUCTS.find(product => product.product_id === productId);
  }
};

export const getCreditPackages = (): Product[] => {
  return CREDIT_PACKS;
};

export const getSubscriptionPlans = (): Product[] => {
  return SUBSCRIPTION_PLANS;
};

export const getMonthlyPlans = (): Product[] => {
  return MONTHLY_SUBSCRIPTION_PLANS;
};

export const getYearlyPlans = (): Product[] => {
  return YEARLY_SUBSCRIPTION_PLANS;
};

// Format price for display
export const formatPrice = (priceInCents: number): string => {
  return `$${(priceInCents / 100).toFixed(2)}`;
};

// Calculate yearly savings
export const calculateYearlySavings = (monthlyPlan: Product, yearlyPlan: Product): number => {
  const monthlyYearlyPrice = monthlyPlan.price * 12;
  return monthlyYearlyPrice - (yearlyPlan.yearlyPrice || yearlyPlan.price * 12);
};

// Get plans by billing period
export const getPlansByBillingPeriod = (billingPeriod: 'monthly' | 'yearly'): Product[] => {
  return SUBSCRIPTION_PLANS.filter(plan => plan.billing_period === billingPeriod);
};

// Get popular plans
export const getPopularPlans = (): Product[] => {
  return ALL_PRODUCTS.filter(product => product.isPopular || product.popular);
};