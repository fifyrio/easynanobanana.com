"use client"

import { useTranslations } from 'next-intl'

export default function InfographicHowItWorksSection() {
  const t = useTranslations('aiInfographicGenerator.howItWorks')

  const steps = [
    {
      step: "step 1",
      key: "step1"
    },
    {
      step: "step 2",
      key: "step2"
    },
    {
      step: "step 3",
      key: "step3"
    },
  ]

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          {t('title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((item, index) => (
            <div key={index} className="text-center">
              <span className="inline-block px-4 py-1 bg-yellow-500 text-white text-sm font-medium rounded-full mb-4">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(`${item.key}.title`)}</h3>
              <p className="text-gray-600 text-sm">{t(`${item.key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
