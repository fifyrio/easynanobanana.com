"use client"

import { useTranslations } from 'next-intl'

export default function InfographicReviewsSection() {
  const t = useTranslations('aiInfographicGenerator.reviews')

  const reviews = [
    {
      key: "review1",
      rating: 5,
    },
    {
      key: "review2",
      rating: 5,
    },
    {
      key: "review3",
      rating: 5,
    },
  ]

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          {t('title')}
        </h2>

        <div className="flex overflow-x-auto gap-6 pb-4 -mx-4 px-4 md:grid md:grid-cols-3 md:overflow-visible max-w-5xl md:mx-auto">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-80 md:w-auto bg-white rounded-2xl p-6 border border-gray-200"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-900 mb-4 text-sm leading-relaxed">&ldquo;{t(`${review.key}.content`)}&rdquo;</p>
              <div>
                <p className="font-semibold text-gray-900">{t(`${review.key}.name`)}</p>
                <p className="text-gray-600 text-sm">{t(`${review.key}.role`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
