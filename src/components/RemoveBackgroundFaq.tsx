'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function RemoveBackgroundFaq() {
  const t = useTranslations('backgroundRemover.faq');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          {t('title')}
        </h2>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-yellow-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{t(`items.${index}.question`)}</span>
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
                  <p className="text-gray-600 leading-relaxed">{t(`items.${index}.answer`)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}