'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import BackgroundRemover from '@/components/BackgroundRemover';

export default function RemoveBackgroundPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What file formats are supported for background removal?',
      answer: 'We support JPG, PNG, WebP, and most common image formats. For best results, use high-resolution images with clear subject-background separation.'
    },
    {
      question: 'How many credits does background removal cost?',
      answer: 'Background removal costs 2 credits per image. You can download the preview for free, but downloading the full resolution result requires credits.'
    },
    {
      question: 'What is the maximum file size I can upload?',
      answer: 'You can upload images up to 10MB in size. Larger files will be automatically resized while maintaining quality.'
    },
    {
      question: 'How accurate is the AI background removal?',
      answer: 'Our AI achieves 95%+ accuracy on most images. It works best with clear subjects like people, products, and animals against distinct backgrounds.'
    },
    {
      question: 'Can I replace the background with a custom color or image?',
      answer: 'Yes! After removing the background, you can choose from preset colors or upload your own background image to create the perfect composition.'
    },
    {
      question: 'Is my uploaded image stored on your servers?',
      answer: 'Images are temporarily stored for processing and automatically deleted within 24 hours. We prioritize your privacy and data security.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BackgroundRemover />
      
      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </section>
    </div>
  );
}