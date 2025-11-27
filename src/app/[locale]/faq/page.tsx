'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      faqs: [
        {
          question: 'How do I create an account?',
          answer: 'Simply click on the "Sign In" button and use your Google account to register. You&rsquo;ll receive 10 free credits to get started immediately.'
        },
        {
          question: 'Do I need to install any software?',
          answer: 'No installation required! Easy Nano Banana is a web-based platform that works directly in your browser. Just visit our website and start creating.'
        },
        {
          question: 'What browsers are supported?',
          answer: 'We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of Chrome or Firefox.'
        }
      ]
    },
    {
      title: 'Credits & Billing',
      icon: '💰',
      faqs: [
        {
          question: 'How does the credit system work?',
          answer: 'Each action (like generating an image or removing a background) consumes credits. Image generation costs 2 credits, background removal costs 1 credit. Credits never expire unless specified otherwise.'
        },
        {
          question: 'Can I get a refund for unused credits?',
          answer: 'Due to the nature of our AI-powered services, we don\'t offer refunds for unused credits. However, credits never expire, so you can use them whenever you\'re ready to create.'
        },
        {
          question: 'How can I earn free credits?',
          answer: 'You can earn free credits through daily check-ins, referring friends, sharing on social media, and participating in special promotions. New users also get 10 free credits upon signup.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual subscriptions. All payments are processed securely through our trusted payment partners.'
        }
      ]
    },
    {
      title: 'Image Generation',
      icon: '🎨',
      faqs: [
        {
          question: 'How do I write a good prompt?',
          answer: 'Be specific and descriptive! Include details about style, colors, mood, setting, and composition. For example: "A majestic mountain landscape at sunset, oil painting style, warm colors, dramatic clouds" works better than just "mountain".'
        },
        {
          question: 'Why didn\'t my image generate properly?',
          answer: 'This could be due to prompts containing inappropriate content, server overload, or overly complex requests. Try simplifying your prompt, avoid sensitive topics, or wait a few minutes and try again.'
        },
        {
          question: 'Can I generate images in different sizes?',
          answer: 'Yes! You can choose from various aspect ratios including square (1:1), portrait (3:4), landscape (4:3), and wide (16:9). The resolution is optimized for each format to ensure high quality.'
        },
        {
          question: 'How long does it take to generate an image?',
          answer: 'Most images generate within 10-30 seconds. During peak times or for complex prompts, it might take up to 2 minutes. Pro subscribers get priority processing for faster generation.'
        }
      ]
    },
    {
      title: 'Background Removal',
      icon: '✂️',
      faqs: [
        {
          question: 'What image formats are supported?',
          answer: 'You can upload JPG, JPEG, PNG, and WebP files. The output is always a PNG file with a transparent background, which you can use in any design software or platform.'
        },
        {
          question: 'What\'s the maximum file size I can upload?',
          answer: 'You can upload images up to 10MB in size. For best results, we recommend images between 1-5MB with clear subjects and good lighting.'
        },
        {
          question: 'Why isn\'t the background removal perfect?',
          answer: 'AI works best with images that have clear contrast between the subject and background. Images with complex backgrounds, similar colors, or fine details (like hair) might need manual touch-ups.'
        }
      ]
    },
    {
      title: 'Account & Technical',
      icon: '🛠️',
      faqs: [
        {
          question: 'How do I download my images?',
          answer: 'After generating or processing an image, click the download button. Images are saved in high quality - generated images as JPG/PNG and background-removed images as transparent PNG files.'
        },
        {
          question: 'Are my images stored on your servers?',
          answer: 'Images are temporarily stored for processing and download purposes, then automatically deleted after 30 days. We don\'t use your personal images for any purpose other than providing our service.'
        },
        {
          question: 'Can I use the images commercially?',
          answer: 'Yes! All images you generate or process through our platform can be used for commercial purposes. You retain full ownership and rights to your creations.'
        },
        {
          question: 'Is there a mobile app?',
          answer: 'Currently, we\'re web-only, but our website is fully optimized for mobile browsers. A dedicated mobile app is in development and will be available soon!'
        }
      ]
    },
    {
      title: 'Subscriptions & Plans',
      icon: '📋',
      faqs: [
        {
          question: 'What\'s the difference between credit packs and subscriptions?',
          answer: 'Credit packs are one-time purchases that never expire, perfect for occasional use. Subscriptions provide monthly credits at a lower per-credit cost, ideal for regular users. Subscriptions also include priority processing and support.'
        },
        {
          question: 'Can I change my subscription plan?',
          answer: 'Yes! You can upgrade or downgrade your subscription at any time. Changes take effect at your next billing cycle, and you\'ll be charged the prorated difference.'
        },
        {
          question: 'What happens if I cancel my subscription?',
          answer: 'You can continue using the service until your current billing period ends. Any remaining credits from your subscription will expire, but credits from one-time purchases never expire.'
        },
        {
          question: 'Do unused monthly credits roll over?',
          answer: 'Subscription credits don\'t roll over - they reset each month. However, credits purchased through one-time packs never expire and will always be available in your account.'
        }
      ]
    }
  ];

  const allFaqs = faqCategories.flatMap((category, categoryIndex) =>
    category.faqs.map((faq, faqIndex) => ({
      ...faq,
      categoryTitle: category.title,
      categoryIcon: category.icon,
      globalIndex: categoryIndex * 100 + faqIndex
    }))
  );

  const filteredFaqs = searchTerm
    ? allFaqs.filter(
        faq =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allFaqs;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Find answers to common questions about Easy Nano Banana
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search FAQs..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {!searchTerm ? (
          /* Category View */
          <div className="space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <div key={category.title} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <span className="text-3xl mr-3">{category.icon}</span>
                  <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                </div>
                
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const globalIndex = categoryIndex * 100 + faqIndex;
                    return (
                      <div key={globalIndex} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => setOpenFaq(openFaq === globalIndex ? null : globalIndex)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-yellow-50 transition-colors rounded-lg"
                        >
                          <span className="font-medium text-gray-900">{faq.question}</span>
                          <svg
                            className={`w-5 h-5 text-gray-500 transition-transform ${
                              openFaq === globalIndex ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {openFaq === globalIndex && (
                          <div className="px-6 pb-4 border-t border-gray-100">
                            <p className="text-gray-700 leading-relaxed pt-4">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Search Results View */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results ({filteredFaqs.length} found)
              </h2>
              {filteredFaqs.length === 0 && (
                <p className="text-gray-600">
                  No results found for &ldquo;{searchTerm}&rdquo;. Try different keywords or browse categories above.
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <div key={faq.globalIndex} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.globalIndex ? null : faq.globalIndex)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-yellow-50 transition-colors rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="text-sm mr-2">{faq.categoryIcon}</span>
                        <span className="text-sm text-gray-500">{faq.categoryTitle}</span>
                      </div>
                      <span className="font-medium text-gray-900">{faq.question}</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-4 ${
                        openFaq === faq.globalIndex ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {openFaq === faq.globalIndex && (
                    <div className="px-6 pb-4 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed pt-4">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-gray-700 mb-6">
              Can&rsquo;t find what you&rsquo;re looking for? Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@easynanobanana.com"
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/docs"
                className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-6 py-3 rounded-xl border border-gray-300 transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}