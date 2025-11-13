'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  MONTHLY_SUBSCRIPTION_PLANS,
  YEARLY_SUBSCRIPTION_PLANS,
  CREDIT_PACKS
} from '@/lib/payment/products';

export default function PricingPage() {
  const [pricingType] = useState<'subscriptions' | 'credits'>('subscriptions');
  const [billingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [planIdMap, setPlanIdMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Fetch subscription plans from database to get plan IDs
  useEffect(() => {
    async function fetchPlans() {
      try {
        const { supabase } = await import('@/lib/supabase');

        const { data: plans, error } = await supabase
          .from('payment_plans')
          .select('id, name')
          .eq('plan_type', 'subscription')
          .eq('is_active', true);

        if (error) throw error;

        if (plans) {
          // Create mapping from plan name to plan ID
          const mapping: Record<string, string> = {};
          plans.forEach((plan: { name: string; id: string }) => {
            mapping[plan.name] = plan.id;
          });
          setPlanIdMap(mapping);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      }
    }

    fetchPlans();
  }, []);

  // Handle subscription
  async function handleSubscribe(planName: string) {
    if (!user) {
      toast.error('Please sign in to subscribe');
      await signInWithGoogle();
      return;
    }

    console.log('handleSubscribe called with planName:', planName);
    console.log('Current planIdMap:', planIdMap);

    const lookupKey = `${planName} Monthly`;
    console.log('Looking up plan ID with key:', lookupKey);

    const planId = planIdMap[lookupKey];
    if (!planId) {
      console.error('Plan not found! Available keys:', Object.keys(planIdMap));
      toast.error('Plan not found. Please try again.');
      return;
    }

    console.log('Found plan ID:', planId);

    setLoading(true);
    try {
      // Get access token from Supabase session
      const { supabase } = await import('@/lib/supabase');
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);

      if (!token) {
        toast.error('Authentication failed. Please sign in again.');
        await signInWithGoogle();
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to payment page
      window.location.href = data.payment_url;

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription');
      setLoading(false);
    }
  }

  const subscriptionPlans = {
    monthly: MONTHLY_SUBSCRIPTION_PLANS,
    yearly: YEARLY_SUBSCRIPTION_PLANS
  };

  const creditPacks = CREDIT_PACKS;

  const faqs = [
    {
      question: 'What is the difference between credits and minutes?',
      answer: 'Credits are used for generating content, while minutes are used for video processing. Each plan includes a certain number of credits and minutes per month.'
    },
    {
      question: 'Can I upgrade or downgrade my plan at any time?',
      answer: 'Yes, you can change your plan at any time. Changes will be reflected in your next billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.'
    }
  ];

  const currentPlans = pricingType === 'subscriptions' ? subscriptionPlans[billingCycle] : creditPacks;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Unlimited creativity starts here
          </h1>
          
          {/* Pricing toggles hidden for now */}
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-8 mb-20 ${
          pricingType === 'credits' ? 'md:grid-cols-4' : 'md:grid-cols-3'
        }`}>
          {currentPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm border p-8 ${
                plan.isPopular 
                  ? 'ring-2 ring-yellow-400 shadow-xl border-yellow-200' 
                  : 'border-gray-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                    ⭐ Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <div className="text-3xl mb-4">{plan.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  {pricingType === 'subscriptions' && billingCycle === 'yearly' && 'originalPrice' in plan && (plan as any).originalPrice && (
                    <div className="text-sm text-gray-400 line-through mb-1">
                      ${(plan as any).originalPrice}
                    </div>
                  )}
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-yellow-600">${plan.price}</span>
                    {pricingType === 'subscriptions' && (
                      <span className="text-gray-600 ml-1">/mo</span>
                    )}
                  </div>
                  {pricingType === 'subscriptions' && billingCycle === 'yearly' && 'yearlyPrice' in plan && (plan as any).yearlyPrice && (
                    <div className="text-sm text-orange-600 mt-1">
                      ${(plan as any).yearlyPrice}/year
                    </div>
                  )}
                </div>

                {pricingType === 'subscriptions' ? (
                  <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                    {plan.credits}
                  </div>
                ) : (
                  <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                    {'credits' in plan && `${plan.credits} credits`}
                  </div>
                )}
              </div>

              {pricingType === 'credits' && (
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium text-center mb-6">
                  ✓ One-time purchase • No expiry
                </div>
              )}

              <Button
                onClick={() => {
                  if (pricingType === 'subscriptions' && billingCycle === 'monthly') {
                    handleSubscribe(plan.name);
                  } else if (!user) {
                    signInWithGoogle();
                  }
                }}
                disabled={loading}
                className={`w-full mb-6 font-medium ${
                  plan.isPopular
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : plan.buttonText}
              </Button>

              <ul className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-yellow-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
