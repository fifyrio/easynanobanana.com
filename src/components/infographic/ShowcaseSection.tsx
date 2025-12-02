"use client"

import { useTranslations } from 'next-intl'

export default function InfographicShowcaseSection() {
  const t = useTranslations('aiInfographicGenerator.showcase')

  const showcaseItems = [
    {
      key: "dataStories",
      image: "/images/infographic/data-visualization-infographic-with-charts-and-gra.webp",
      reverse: false,
    },
    {
      key: "socialMedia",
      image: "/images/infographic/social-media-infographic-template-colorful-modern.webp",
      reverse: true,
    },
    {
      key: "noDesignSkills",
      image: "/images/infographic/easy-to-use-infographic-maker-interface.webp",
      reverse: false,
    },
    {
      key: "customizable",
      image: "/images/infographic/customizable-infographic-editing-tools.webp",
      reverse: true,
    },
  ]

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
          {t('title')}
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>

        <div className="space-y-16 max-w-5xl mx-auto">
          {showcaseItems.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col ${item.reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center`}
            >
              <div className="flex-1">
                <img
                  src={item.image}
                  alt={t(`${item.key}.title`)}
                  className="w-full rounded-2xl shadow-lg border border-gray-200"
                />
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">{t(`${item.key}.title`)}</h3>
                <p className="text-gray-600 leading-relaxed">{t(`${item.key}.description`)}</p>
                <button className="text-yellow-600 p-0 hover:text-yellow-700 flex items-center font-medium">
                  {t('tryNow')}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
