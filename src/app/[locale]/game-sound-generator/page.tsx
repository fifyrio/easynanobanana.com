import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import Header from '@/components/common/Header'
import GameAudioGenerator, {
  type GameSoundPresetItem,
} from '@/components/sound/GameAudioGenerator'
import LoadSoundPresetButton from '@/components/sound/LoadSoundPresetButton'
import CopyPromptButton from '@/components/burning-bridges/CopyPromptButton'
import { FAQSchema, BreadcrumbSchema } from '@/components/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { locales } from '@/i18n/config'
import sampleData from '@/data/game-sound-samples.json'
import type {
  GameAudioMode,
  DurationHint,
  SoundKey,
} from '@/lib/kie-api/kie-sound-service'

const PATH = '/game-sound-generator'
const BASE = 'https://www.easynanobanana.com'
const R2_HOST = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'
const localPath = (locale: string, path: string) =>
  `${locale === 'en' ? '' : `/${locale}`}${path}`

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: 'gameSoundGenerator.seo',
  })
  const url = `${BASE}${localPath(locale, PATH)}`
  const images = [
    {
      url: sampleData.ogImage,
      width: 1200,
      height: 630,
      alt: t('ogTitle'),
    },
  ]

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((lang) => [lang, `${BASE}${localPath(lang, PATH)}`])
      ),
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url,
      siteName: 'Easy Nano Banana',
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images,
    },
    robots: { index: true, follow: true },
  }
}

export default async function GameSoundGeneratorPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: 'gameSoundGenerator' })
  const url = `${BASE}${localPath(locale, PATH)}`

  const showcaseTracks: GameSoundPresetItem[] = sampleData.samples.map(
    (item, idx) => ({
      id: item.id,
      title: t(`samples.items.${idx + 1}.title`),
      caption: t(`samples.items.${idx + 1}.caption`),
      mode: item.mode as GameAudioMode,
      soundLoop: item.soundLoop,
      soundTempo: item.soundTempo,
      soundKey: item.soundKey as SoundKey,
      durationHint: item.durationHint as DurationHint,
      duration: item.duration,
      audioUrl: `${R2_HOST}/${item.audioKey}`,
      prompt: item.prompt,
    })
  )

  const faqItems = [1, 2, 3, 4, 5, 6].map((i) => ({
    question: t(`faq.items.${i}.question`),
    answer: t(`faq.items.${i}.answer`),
  }))

  const related = [
    { path: '/ai-image-effects/ai-minecraft-skin', key: 'minecraftSkin' },
    { path: '/ai-image-effects/ai-image-to-3d', key: 'imageTo3d' },
    {
      path: '/video/seedance-2-5-ai-video-generator',
      key: 'seedance25',
    },
  ]

  return (
    <>
      <Header />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema
        items={[
          {
            name: t('breadcrumb.home'),
            url: `${BASE}${localPath(locale, '/')}`,
          },
          { name: t('breadcrumb.current'), url },
        ]}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: t('hero.title'),
          url,
          description: t('seo.description'),
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Web',
          isAccessibleForFree: false,
        }}
      />

      <div className="bg-[#FFFCF5] text-slate-900">
        {/* Hero + Embedded Ludo-Style Audio Generator Workbench */}
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:pt-10">
          <nav
            aria-label={t('breadcrumb.current')}
            className="mb-5 flex flex-wrap gap-2 text-xs text-slate-500"
          >
            <Link href={localPath(locale, '/')} className="hover:underline">
              {t('breadcrumb.home')}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{t('breadcrumb.current')}</span>
          </nav>

          <div className="mb-8 max-w-4xl">
            <p className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold tracking-[0.16em] text-indigo-900">
              {t('hero.badge')}
            </p>
            <h1 className="mt-3.5 break-words text-3xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="mt-3 text-lg font-medium text-indigo-800 sm:text-xl">
              {t('hero.subtitle')}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {t('hero.description')}
            </p>
          </div>

          <GameAudioGenerator showcaseTracks={showcaseTracks} />
        </section>

        <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 pt-6 sm:px-6">
          {/* What is AI Game Sound & Music Generator */}
          <section aria-labelledby="about-title" className="max-w-4xl">
            <h2
              id="about-title"
              className="text-3xl font-semibold tracking-tight"
            >
              {t('about.title')}
            </h2>
            <p className="mt-4 leading-8 text-slate-600">{t('about.text')}</p>
            <p className="mt-4 leading-8 text-slate-600">{t('about.detail')}</p>
          </section>

          {/* How It Works (3 Steps) */}
          <section aria-labelledby="how-title" className="scroll-mt-24">
            <h2
              id="how-title"
              className="text-3xl font-semibold tracking-tight"
            >
              {t('howTo.title')}
            </h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
                >
                  <span className="text-3xl font-light text-indigo-600">
                    0{i}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">
                    {t(`howTo.steps.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {t(`howTo.steps.${i}.text`)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Real Game Audio Showcase & Copyable Prompts */}
          <section
            id="prompts"
            aria-labelledby="prompts-title"
            className="scroll-mt-24"
          >
            <h2
              id="prompts-title"
              className="text-3xl font-semibold tracking-tight"
            >
              {t('prompts.title')}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              {t('prompts.intro')}
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {showcaseTracks.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-900">
                        {t(`workbench.modes.${item.mode}.label`)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {item.caption}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>

                    <div className="mt-3">
                      <audio
                        controls
                        loop={item.soundLoop}
                        preload="metadata"
                        src={item.audioUrl}
                        className="h-10 w-full"
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
                        {t('prompts.promptLabel')}
                      </p>
                      <p
                        lang="en"
                        className="mt-1.5 whitespace-pre-wrap break-words rounded-xl bg-[#FFFBF0] p-3 font-mono text-xs leading-5 text-slate-700"
                      >
                        {item.prompt}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 pt-2">
                    <CopyPromptButton
                      prompt={item.prompt}
                      namespace="gameSoundGenerator.prompts"
                    />
                    <LoadSoundPresetButton
                      label={t('prompts.use')}
                      prompt={item.prompt}
                      mode={item.mode}
                      soundLoop={item.soundLoop}
                      soundTempo={item.soundTempo}
                      soundKey={item.soundKey}
                      durationHint={item.durationHint}
                    />
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              {t('prompts.note')}
            </p>
          </section>

          {/* Supported Game Audio Modes & Capabilities Table */}
          <section aria-labelledby="compare-title">
            <h2
              id="compare-title"
              className="text-3xl font-semibold tracking-tight"
            >
              {t('comparison.title')}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              {t('comparison.subtitle')}
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-amber-200 bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-amber-200 bg-amber-50/70 text-xs uppercase tracking-wider text-slate-700">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">
                      {t('comparison.columns.mode')}
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-indigo-900">
                      {t('comparison.columns.loopSetting')}
                    </th>
                    <th className="px-5 py-3.5 font-semibold">
                      {t('comparison.columns.bestFor')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row}>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {t(`comparison.rows.${row}.mode`)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {t(`comparison.rows.${row}.loopSetting`)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {t(`comparison.rows.${row}.bestFor`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Use Cases for Indie Game Devs & Creators */}
          <section aria-labelledby="usecases-title">
            <h2
              id="usecases-title"
              className="text-3xl font-semibold tracking-tight"
            >
              {t('useCases.title')}
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">
                    {t(`useCases.items.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {t(`useCases.items.${i}.text`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Pro Tips Box */}
          <section
            aria-labelledby="tips-title"
            className="max-w-4xl rounded-2xl border border-indigo-200 bg-white p-6 sm:p-8"
          >
            <h2
              id="tips-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {t('tips.title')}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">{t('tips.text')}</p>
          </section>

          {/* Related Tools */}
          <section aria-labelledby="related-title">
            <h2
              id="related-title"
              className="text-3xl font-semibold tracking-tight"
            >
              {t('related.title')}
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.path}
                  href={localPath(locale, item.path)}
                  className="rounded-2xl border border-amber-200 bg-white p-6 transition hover:border-amber-400"
                >
                  <h3 className="font-semibold">
                    {t(`related.${item.key}`)} <span aria-hidden="true">↗</span>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t(`related.${item.key}Description`)}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section aria-labelledby="faq-title" className="max-w-4xl">
            <h2
              id="faq-title"
              className="text-3xl font-semibold tracking-tight"
            >
              {t('faq.title')}
            </h2>
            <div className="mt-6 divide-y divide-amber-200 rounded-2xl border border-amber-200 bg-white px-6">
              {faqItems.map((item) => (
                <details key={item.question} className="py-5">
                  <summary className="cursor-pointer pr-4 text-lg font-medium">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
