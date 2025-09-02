'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  const [pricingType, setPricingType] = useState<'subscriptions' | 'credits'>('subscriptions');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user, signInWithGoogle } = useAuth();

  const subscriptionPlans = {
    monthly: [
      {
        name: 'Basic',
        icon: '⚡',
        price: 7.99,
        credits: '100 credits/month',
        description: 'Perfect for individuals and light users',
        buttonText: 'Subscribe Now',
        buttonVariant: 'secondary' as const,
        features: [
          '50 high-quality images/month',
          'All style templates included',
          'Standard generation speed',
          'Basic customer support',
          'JPG/PNG format downloads'
        ]
      },
      {
        name: 'Pro',
        icon: '🚀',
        price: 27.99,
        credits: '500 credits/month',
        description: 'For professional creators and teams',
        buttonText: 'Subscribe Now',
        buttonVariant: 'primary' as const,
        isPopular: true,
        features: [
          '250 high-quality images/month',
          'All style templates included',
          'Priority generation queue',
          'Priority customer support',
          'JPG/PNG/WebP format downloads',
          'Batch generation feature',
          'Image editing tools (Coming in October)'
        ]
      },
      {
        name: 'Max',
        icon: '👑',
        price: 78.99,
        credits: '1600 credits/month',
        description: 'Designed for large enterprises and professional studios',
        buttonText: 'Subscribe Now',
        buttonVariant: 'secondary' as const,
        features: [
          '800 high-quality images/month',
          'All style templates included',
          'Fastest generation speed',
          'Dedicated account manager',
          'All format downloads',
          'Batch generation feature',
          'Professional editing suite (Coming in October)'
        ]
      }
    ],
    yearly: [
      {
        name: 'Basic',
        icon: '⚡',
        price: 6.99,
        originalPrice: 7.99,
        yearlyPrice: 83.99,
        credits: '1200 credits/year',
        description: 'Perfect for individuals and light users',
        buttonText: 'Subscribe Now',
        buttonVariant: 'secondary' as const,
        features: [
          '50 high-quality images/month',
          'All style templates included',
          'Standard generation speed',
          'Basic customer support',
          'JPG/PNG format downloads'
        ]
      },
      {
        name: 'Pro',
        icon: '🚀',
        price: 22.99,
        originalPrice: 27.99,
        yearlyPrice: 275.99,
        credits: '6000 credits/year',
        description: 'For professional creators and teams',
        buttonText: 'Subscribe Now',
        buttonVariant: 'primary' as const,
        isPopular: true,
        features: [
          '250 high-quality images/month',
          'All style templates included',
          'Priority generation queue',
          'Priority customer support',
          'JPG/PNG/WebP format downloads',
          'Batch generation feature',
          'Image editing tools (Coming in October)'
        ]
      },
      {
        name: 'Max',
        icon: '👑',
        price: 62.99,
        originalPrice: 78.99,
        yearlyPrice: 755.99,
        credits: '19200 credits/year',
        description: 'Designed for large enterprises and professional studios',
        buttonText: 'Subscribe Now',
        buttonVariant: 'secondary' as const,
        features: [
          '800 high-quality images/month',
          'All style templates included',
          'Fastest generation speed',
          'Dedicated account manager',
          'All format downloads',
          'Batch generation feature',
          'Professional editing suite (Coming in October)'
        ]
      }
    ]
  };

  const creditPacks = [
    {
      name: 'Starter Pack',
      icon: '🎯',
      price: 28,
      credits: 200,
      description: 'Try out our AI capabilities',
      buttonText: 'Buy Now',
      features: [
        '200 credits included',
        'Never expires',
        'All features unlocked'
      ]
    },
    {
      name: 'Growth Pack',
      icon: '📈',
      price: 78,
      credits: 555,
      description: 'Perfect for regular creators',
      buttonText: 'Buy Now',
      isPopular: true,
      features: [
        '533 credits included',
        'Never expires',
        'Priority support included'
      ]
    },
    {
      name: 'Professional Pack',
      icon: '💼',
      price: 220,
      credits: 1366,
      description: 'For serious content creators',
      buttonText: 'Buy Now',
      features: [
        '1333 credits included',
        'Never expires',
        'Priority support & batch processing'
      ]
    },
    {
      name: 'Enterprise Pack',
      icon: '🏢',
      price: 880,
      credits: 5633,
      description: 'Maximum value for teams',
      buttonText: 'Buy Now',
      features: [
        '5333 credits included',
        'Never expires',
        'Dedicated support & API access'
      ]
    }
  ];

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
          
          {/* Main Category Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 mb-8 shadow-sm border border-gray-200">
            <button
              onClick={() => setPricingType('subscriptions')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                pricingType === 'subscriptions'
                  ? 'bg-yellow-400 text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Subscriptions
            </button>
            <button
              onClick={() => setPricingType('credits')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                pricingType === 'credits'
                  ? 'bg-yellow-400 text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎁 Credit Packs
            </button>
          </div>

          {/* Billing Toggle - Only show for subscriptions */}
          {pricingType === 'subscriptions' && (
            <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-yellow-400 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-yellow-400 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly Save 20%
              </button>
            </div>
          )}
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
                onClick={user ? undefined : signInWithGoogle}
                className={`w-full mb-6 font-medium ${
                  plan.isPopular 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {plan.buttonText}
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