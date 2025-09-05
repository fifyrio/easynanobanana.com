// Simplified AIASMR pricing plans

import { Product } from './types';
import { getPaymentConfig } from './config';

// Function to get products with current configuration
type PlanIds = { trial: string; basic: string; pro: string };

function createPlans(ids: PlanIds): Product[] {
  return [
    {
      product_id: ids.trial,
      product_name: 'AI ASMR Trial',
      price: 790, // $7.9 in cents
      originalPrice: 990, // $9.9 in cents
      credits: 100,
      videos: 8,
      pricePerVideo: 0.79,
      pricePerCredit: 0.079,
      duration: '8s',
      resolution: '720p',
      commercial: false,
      type: 'once',
      features: [
        'Google Veo 3 ASMR support',
        'Max 8s video duration',
        '720p resolution',
        'Binaural audio effects',
        'ASMR trigger library',
      ],
      buttonText: 'Try AI ASMR ⚡',
      buttonColor: 'from-blue-500 to-purple-600',
      popular: false,
    },
    {
      product_id: ids.basic,
      product_name: 'AI ASMR Basic',
      price: 1990, // $19.9 in cents
      originalPrice: 2490, // $24.9 in cents
      credits: 300,
      videos: 25,
      pricePerVideo: 0.66,
      pricePerCredit: 0.066,
      duration: '8s',
      resolution: '720p',
      commercial: true,
      priceIncrease: true,
      type: 'subscription',
      billing_period: 'monthly',
      features: [
        'Google Veo 3 ASMR support',
        'Max 8s video duration',
        '720p resolution',
        'Whisper & voice sync',
        'Binaural audio effects',
        'ASMR trigger library',
        'Commercial usage rights',
        'Standard processing',
        'Basic support',
        'Global availability',
      ],
      buttonText: 'Subscribe to Basic ⚡',
      buttonColor: 'from-blue-500 to-purple-600',
      popular: true,
    },
    {
      product_id: ids.pro,
      product_name: 'AI ASMR Pro',
      price: 4990, // $49.9 in cents
      originalPrice: 5990, // $59.9 in cents
      credits: 1500,
      videos: 125,
      pricePerVideo: 0.33,
      pricePerCredit: 0.033,
      duration: '8s',
      resolution: '1080p',
      commercial: true,
      type: 'subscription',
      billing_period: 'monthly',
      features: [
        'All Basic features included',
        '1080p video resolution',
        'Advanced whisper sync',
        'Premium binaural audio',
        'Full ASMR trigger library',
        'Fastest processing',
        'Commercial usage rights',
        'Priority support',
        'Global availability',
        'Pro-level features',
      ],
      buttonText: 'Go Pro 🔥',
      buttonColor: 'from-purple-600 to-pink-500',
      popular: false,
    },
  ];
}

export function getPlans(): Product[] {
  // Only call getPaymentConfig when this function is called (server-side)
  const config = getPaymentConfig();
  return createPlans({
    trial: config.trialProductId,
    basic: config.basicProductId,
    pro: config.proProductId,
  });
}

// Static fallback plans for client-side use (with fallback values)
const DEFAULT_IDS: PlanIds = {
  trial: 'prod_4oJ0n9ZOU0x2Tn9rQ1oDJ5',
  basic: 'prod_6JrHGnC707qbtiMBiLGlkX',
  pro: 'prod_5H9ctZ7GUs425KayUilncU',
};

export const PLANS: Product[] = createPlans(DEFAULT_IDS);

// For backward compatibility
export const ALL_PRODUCTS: Product[] = PLANS;
export const CREDIT_PACKAGES: Product[] = PLANS.filter(plan => plan.type === 'once');
export const SUBSCRIPTION_PLANS: Product[] = PLANS.filter(plan => plan.type === 'subscription');

// Helper functions
export const getProductById = (productId: string): Product | undefined => {
  // Use server-side configuration when available
  try {
    const plans = getPlans();
    return plans.find(product => product.product_id === productId);
  } catch {
    // Fallback to static plans for client-side
    return PLANS.find(product => product.product_id === productId);
  }
};

export const getCreditPackages = (): Product[] => {
  return CREDIT_PACKAGES;
};

export const getSubscriptionPlans = (): Product[] => {
  return SUBSCRIPTION_PLANS;
};

export const getMonthlyPlans = (): Product[] => {
  return SUBSCRIPTION_PLANS.filter(plan => plan.billing_period === 'monthly');
};

export const getYearlyPlans = (): Product[] => {
  return SUBSCRIPTION_PLANS.filter(plan => plan.billing_period === 'yearly');
};

// Format price for display
export const formatPrice = (priceInCents: number): string => {
  return `$${(priceInCents / 100).toFixed(2)}`;
};

// Calculate yearly savings
export const calculateYearlySavings = (monthlyPlan: Product, yearlyPlan: Product): number => {
  const monthlyYearlyPrice = monthlyPlan.price * 12;
  return monthlyYearlyPrice - yearlyPlan.price;
};