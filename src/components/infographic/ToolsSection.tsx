"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'

export default function InfographicToolsSection() {
  const t = useTranslations('aiInfographicGenerator.prompts')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const prompts = [
    {
      key: "businessData",
      image: "/images/infographic/business-data-visualization-infographic.webp",
    },
    {
      key: "timeline",
      image: "/images/infographic/colorful-timeline-process-infographic.webp",
    },
    {
      key: "statistics",
      image: "/images/infographic/modern-statistics-infographic-design.webp",
    },
    {
      key: "comparison",
      image: "/images/infographic/colorful-chart-infographic.webp",
    },
    {
      key: "minimal",
      image: "/images/infographic/minimalist-stats-infographic.webp",
    },
    {
      key: "process",
      image: "/images/infographic/business-data-infographic.webp",
    },
  ]

  const handleCopy = async (prompt: string, index: number) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedIndex(index)
      toast.success(t('copySuccess'))
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      toast.error(t('copyError'))
    }
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-3">
          {t('title')}
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {prompts.map((prompt, index) => (
            <div
              key={index}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-yellow-300 hover:shadow-xl transition-all group"
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                <img
                  src={prompt.image}
                  alt={t(`${prompt.key}.title`)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-base mb-2">
                  {t(`${prompt.key}.title`)}
                </h3>

                {/* Prompt Display */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                    {t(`${prompt.key}.prompt`)}
                  </p>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(t(`${prompt.key}.prompt`), index)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    copiedIndex === index
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  {copiedIndex === index ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t('copyPrompt')}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
