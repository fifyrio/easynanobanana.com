'use client';

import { useState } from 'react';
import Header from '@/components/common/HeaderSimple';
import Button from '@/components/ui/Button';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: 'Free',
      price: 0,
      buttonText: 'Get started',
      buttonVariant: 'primary' as const,
      features: [
        '100 credits/month',
        'Basic editing tools',
        'Standard export quality'
      ]
    },
    {
      name: 'Basic',
      price: 10,
      buttonText: 'Get started',
      buttonVariant: 'secondary' as const,
      isPopular: true,
      badge: 'Invite friends: +30 credits each',
      features: [
        '500 credits/month',
        'HD export',
        'Priority queue',
        'Advanced editing tools'
      ]
    },
    {
      name: 'Pro',
      price: 20,
      buttonText: 'Get started',
      buttonVariant: 'primary' as const,
      badge: 'Invite friends: +30 credits each',
      features: [
        'Unlimited credits',
        '4K export',
        'Dedicated support',
        'All features'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose the plan that&apos;s right for you
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Simple, transparent pricing. No hidden fees.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
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
              Yearly
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl border p-8 ${
                plan.isPopular 
                  ? 'border-yellow-400 shadow-lg' 
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 mr-2">{plan.name}</h3>
                  {plan.badge && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {plan.badge}
                    </span>
                  )}
                </div>
                
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
              </div>

              <Button
                className="w-full mb-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium"
              >
                {plan.buttonText}
              </Button>

              <ul className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
              <div key={index} className="bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
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