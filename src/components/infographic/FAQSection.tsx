"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function InfographicFAQSection() {
  const t = useTranslations('aiInfographicGenerator.faq')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    { key: "howItWorks" },
    { key: "noDesignExperience" },
    { key: "exportFormats" },
    { key: "freeVersion" },
    { key: "customizable" },
    { key: "typesOfInfographics" },
    { key: "uploadData" },
    { key: "dataSecure" },
  ]

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          {t('title')}
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-900 font-medium pr-4">
                  {index + 1}. {t(`${faq.key}.question`)}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    {t(`${faq.key}.answer`)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
