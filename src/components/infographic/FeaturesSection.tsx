"use client"

import { useTranslations } from 'next-intl'

export default function InfographicFeaturesSection() {
  const t = useTranslations('aiInfographicGenerator.features')

  const features = [
    {
      number: "1",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>,
      key: "dataVisualization"
    },
    {
      number: "2",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
      </svg>,
      key: "templates"
    },
    {
      number: "3",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>,
      key: "smartSuggestions"
    },
    {
      number: "4",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>,
      key: "exportFormats"
    },
  ]

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          {t('title')}
        </h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-yellow-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="text-5xl font-bold text-yellow-200">{feature.number}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500">{feature.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{t(`${feature.key}.title`)}</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{t(`${feature.key}.description`)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
