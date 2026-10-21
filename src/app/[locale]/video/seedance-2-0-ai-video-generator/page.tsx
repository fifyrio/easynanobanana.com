import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/common/Header';
import VideoEffectGenerator from '@/components/video/VideoEffectGenerator';
import CopyPromptButton from '@/components/burning-bridges/CopyPromptButton';
import ShowcaseVideo from '@/components/burning-bridges/ShowcaseVideo';
import { FAQSchema, BreadcrumbSchema, VideoObjectSchema } from '@/components/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { locales } from '@/i18n/config';
import presetsData from '@/data/ai-seedance-2-0-presets.json';

const PATH = '/video/seedance-2-0-ai-video-generator';
const BASE = 'https://www.easynanobanana.com';
const ASSETS = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-seedance-2-0';
const localPath = (locale: string, path: string) => `${locale === 'en' ? '' : `/${locale}`}${path}`;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiSeedance20.seo' });
  const url = `${BASE}${localPath(locale, PATH)}`;
  const images = [
    {
      url: `${ASSETS}/feature/og-image.jpg`,
      width: 1200,
      height: 630,
      alt: t('ogTitle'),
    },
  ];
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(locales.map((lang) => [lang, `${BASE}${localPath(lang, PATH)}`])),
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
  };
}

export default async function Seedance20Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'aiSeedance20' });
  const presets = presetsData.presets;
  const url = `${BASE}${localPath(locale, PATH)}`;
  const faqItems = [1, 2, 3, 4, 5, 6].map((i) => ({
    question: t(`faq.items.${i}.question`),
    answer: t(`faq.items.${i}.answer`),
  }));

  const related = [
    { path: '/video/rumpelstiltskin-ai-video-generator', title: 'rumpelstiltskin' },
    { path: '/video/drake-burning-bridges-ai-video-generator', title: 'party' },
    { path: '/flux-3-image-klein', title: 'fluxKlein' },
  ];

  return (
    <>
      <Header />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema
        items={[
          { name: t('breadcrumb.home'), url: `${BASE}${localPath(locale, '/')}` },
          { name: t('breadcrumb.current'), url },
        ]}
      />
      <VideoObjectSchema
        name={t('hero.previewLabel')}
        description={t('hero.previewCaption')}
        contentUrl={`${ASSETS}/demo/cinematic-portrait-motion.mp4`}
        thumbnailUrl={`${ASSETS}/demo/cinematic-portrait-motion.jpg`}
        uploadDate="2026-10-21"
        duration="PT4.000S"
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
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:pt-12">
          <nav aria-label={t('breadcrumb.current')} className="mb-8 flex flex-wrap gap-2 text-xs text-slate-500">
            <Link href={localPath(locale, '/')} className="hover:underline">
              {t('breadcrumb.home')}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{t('breadcrumb.current')}</span>
          </nav>

          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-amber-800">{t('hero.badge')}</p>
              <h1 className="mt-5 break-words text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                {t('hero.title')}
              </h1>
              <p className="mt-5 text-2xl text-amber-800 sm:text-3xl">{t('hero.subtitle')}</p>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">{t('hero.description')}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#generator"
                  className="rounded-xl bg-[#FFD84D] px-5 py-3 font-semibold hover:bg-amber-300"
                >
                  {t('hero.generate')}
                </a>
                <a
                  href="#prompts"
                  className="rounded-xl border border-amber-300 bg-white px-5 py-3 font-semibold hover:bg-amber-50"
                >
                  {t('hero.prompts')}
                </a>
              </div>
              <p className="mt-4 text-xs text-slate-500">{t('hero.note')}</p>
            </div>
            <figure className="mx-auto w-full max-w-xs">
              <ShowcaseVideo
                src={`${ASSETS}/demo/cinematic-portrait-motion.mp4`}
                poster={`${ASSETS}/demo/cinematic-portrait-motion.jpg`}
                label={t('hero.previewLabel')}
              />
              <figcaption className="mt-3 text-xs leading-5 text-slate-500">{t('hero.previewCaption')}</figcaption>
            </figure>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 sm:px-6">
          <VideoEffectGenerator
            effectType="ai-seedance-2-0"
            namespace="aiSeedance20"
            initialPreset={presets[0].id}
            presets={presets.map((p, idx) => ({
              id: p.id,
              name: t(`prompts.items.${idx + 1}.title`),
            }))}
            allowAspectRatio
            allowCustomText
          />

          <section aria-labelledby="about-title" className="max-w-4xl">
            <h2 id="about-title" className="text-3xl font-semibold tracking-tight">
              {t('about.title')}
            </h2>
            <p className="mt-5 leading-8 text-slate-600">{t('about.text')}</p>
            <p className="mt-4 leading-8 text-slate-600">{t('about.detail')}</p>
          </section>

          <section aria-labelledby="how-title">
            <h2 id="how-title" className="text-3xl font-semibold tracking-tight">
              {t('howTo.title')}
            </h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <li key={i}>
                  <span className="text-4xl font-light text-amber-600">0{i}</span>
                  <h3 className="mt-4 text-lg font-semibold">{t(`howTo.steps.${i}.title`)}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{t(`howTo.steps.${i}.text`)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="prompts" aria-labelledby="prompts-title" className="scroll-mt-28">
            <h2 id="prompts-title" className="text-3xl font-semibold tracking-tight">
              {t('prompts.title')}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('prompts.intro')}</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {presets.map((preset, idx) => {
                const index = idx + 1;
                return (
                  <article
                    key={preset.id}
                    className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-5 sm:p-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold">{t(`prompts.items.${index}.title`)}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {t(`prompts.items.${index}.description`)}
                      </p>
                      <p
                        lang="en"
                        className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-[#FFFBF0] p-4 font-mono text-xs leading-6 text-slate-700"
                      >
                        {preset.prompt}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-start gap-3 pt-2">
                      <CopyPromptButton prompt={preset.prompt} namespace="aiSeedance20.prompts" />
                      <a
                        href="#generator"
                        className="rounded-lg bg-[#FFD84D] px-4 py-2 text-sm font-semibold hover:bg-amber-300"
                      >
                        {t('prompts.use')}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">{t('prompts.note')}</p>
          </section>

          <section aria-labelledby="examples-title">
            <h2 id="examples-title" className="text-3xl font-semibold tracking-tight">
              {t('examples.title')}
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-600">{t('examples.intro')}</p>
            <div className="mt-7 grid max-w-2xl gap-6 sm:grid-cols-2">
              {(['street-walk-tracking', 'product-tabletop-reveal'] as const).map((id) => (
                <figure key={id} className="mx-auto w-full max-w-xs">
                  <ShowcaseVideo
                    src={`${ASSETS}/demo/${id}.mp4`}
                    poster={`${ASSETS}/demo/${id}.jpg`}
                    label={t(`examples.${id}`)}
                  />
                  <figcaption className="mt-3 text-sm text-slate-600">{t(`examples.${id}`)}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section aria-labelledby="compare-title">
            <h2 id="compare-title" className="text-3xl font-semibold tracking-tight">
              {t('comparison.title')}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('comparison.subtitle')}</p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-amber-200 bg-white">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-amber-200 bg-amber-50/70 text-xs uppercase tracking-wider text-slate-700">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">{t('comparison.columns.feature')}</th>
                    <th className="px-5 py-3.5 font-semibold text-amber-900">{t('comparison.columns.mini')}</th>
                    <th className="px-5 py-3.5 font-semibold">{t('comparison.columns.fast')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {[1, 2, 3, 4].map((row) => (
                    <tr key={row}>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {t(`comparison.rows.${row}.feature`)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{t(`comparison.rows.${row}.mini`)}</td>
                      <td className="px-5 py-3.5 text-slate-600">{t(`comparison.rows.${row}.fast`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="tips-title" className="max-w-4xl">
            <h2 id="tips-title" className="text-3xl font-semibold tracking-tight">
              {t('tips.title')}
            </h2>
            <p className="mt-4 leading-8 text-slate-600">{t('tips.text')}</p>
          </section>

          <section aria-labelledby="related-title">
            <h2 id="related-title" className="text-3xl font-semibold tracking-tight">
              {t('related.title')}
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.path}
                  href={localPath(locale, item.path)}
                  className="rounded-2xl border border-amber-200 bg-white p-6 hover:border-amber-400"
                >
                  <h3 className="font-semibold">
                    {t(`related.${item.title}`)} <span aria-hidden="true">↗</span>
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {t(`related.${item.title}Description`)}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="faq-title" className="max-w-4xl">
            <h2 id="faq-title" className="text-3xl font-semibold tracking-tight">
              {t('faq.title')}
            </h2>
            <div className="mt-6 divide-y divide-amber-200">
              {faqItems.map((item) => (
                <details key={item.question} className="py-5">
                  <summary className="cursor-pointer pr-4 text-lg font-medium">{item.question}</summary>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
