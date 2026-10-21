import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/common/Header';
import ImageEditor, { type ImageEditorSample } from '@/components/ImageEditor';
import CopyPromptButton from '@/components/burning-bridges/CopyPromptButton';
import { FAQSchema, BreadcrumbSchema } from '@/components/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { locales } from '@/i18n/config';
import sampleData from '@/data/flux-3-image-klein-samples.json';

const PATH = '/flux-3-image-klein';
const BASE = 'https://www.easynanobanana.com';
const R2_HOST = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev';
const localPath = (locale: string, path: string) => `${locale === 'en' ? '' : `/${locale}`}${path}`;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'flux3ImageKlein.seo' });
  const url = `${BASE}${localPath(locale, PATH)}`;
  const images = [
    {
      url: sampleData.ogImage,
      width: 1200,
      height: 630,
      alt: t('ogTitle'),
    },
  ];

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
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

export default async function Flux3ImageKleinPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'flux3ImageKlein' });
  const url = `${BASE}${localPath(locale, PATH)}`;

  const editorSamples: ImageEditorSample[] = sampleData.samples.map((item, idx) => ({
    title: t(`samples.items.${idx + 1}.title`),
    beforeImage: `${R2_HOST}/${item.beforeKey}`,
    afterImage: `${R2_HOST}/${item.afterKey}`,
    prompt: item.prompt,
    mode: item.mode as 'image-to-image' | 'text-to-image',
    aspectRatio: item.aspectRatio,
    enhancePrompt: item.enhancePrompt,
  }));

  const faqItems = [1, 2, 3, 4, 5, 6].map((i) => ({
    question: t(`faq.items.${i}.question`),
    answer: t(`faq.items.${i}.answer`),
  }));

  const related = [
    { path: '/image-editor', key: 'editor' },
    { path: '/ai-image-effects/object-removal', key: 'objectRemoval' },
    { path: '/blog/nano-banana-2-1', key: 'guide' },
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
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: t('hero.title'),
          url,
          description: t('seo.description'),
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web',
          isAccessibleForFree: false,
        }}
      />

      <div className="bg-[#FFFCF5] text-slate-900">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:pt-12">
          <nav aria-label={t('breadcrumb.current')} className="mb-6 flex flex-wrap gap-2 text-xs text-slate-500">
            <Link href={localPath(locale, '/')} className="hover:underline">
              {t('breadcrumb.home')}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{t('breadcrumb.current')}</span>
          </nav>

          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            <div>
              <p className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold tracking-[0.16em] text-amber-900">
                {t('hero.badge')}
              </p>
              <h1 className="mt-4 break-words text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
                {t('hero.title')}
              </h1>
              <p className="mt-4 text-xl font-medium text-amber-800 sm:text-2xl">{t('hero.subtitle')}</p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t('hero.description')}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#generator"
                  className="rounded-xl bg-[#FFD84D] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-300"
                >
                  {t('hero.generate')}
                </a>
                <a
                  href="#prompts"
                  className="rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-50"
                >
                  {t('hero.prompts')}
                </a>
              </div>
              <p className="mt-3 text-xs text-slate-500">{t('hero.note')}</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <figure className="relative overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={editorSamples[0].beforeImage}
                    alt={t('hero.beforeAlt')}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                    {t('hero.beforeBadge')}
                  </span>
                </figure>
                <figure className="relative overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={editorSamples[0].afterImage}
                    alt={t('hero.afterAlt')}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-slate-950">
                    {t('hero.afterBadge')}
                  </span>
                </figure>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{t('hero.previewCaption')}</p>
            </div>
          </div>
        </section>

        {/* Embedded Interactive FLUX 3 Image Klein Generator */}
        <ImageEditor
          defaultModel="flux-3-klein"
          defaultMode="image-to-image"
          defaultAspectRatio="3:4"
          customSamples={editorSamples}
          hideHeader
          hideFaq
          enhancePromptLabel={t('generator.enhanceLabel')}
          enhancePromptHelp={t('generator.enhanceHelp')}
        />

        <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 pt-8 sm:px-6">
          {/* What is FLUX 3 Image Klein & FLUX Klein Edit */}
          <section aria-labelledby="about-title" className="max-w-4xl">
            <h2 id="about-title" className="text-3xl font-semibold tracking-tight">
              {t('about.title')}
            </h2>
            <p className="mt-4 leading-8 text-slate-600">{t('about.text')}</p>
            <p className="mt-4 leading-8 text-slate-600">{t('about.detail')}</p>
          </section>

          {/* How to Use (3 Steps) */}
          <section aria-labelledby="how-title">
            <h2 id="how-title" className="text-3xl font-semibold tracking-tight">
              {t('howTo.title')}
            </h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="rounded-2xl border border-amber-200 bg-white p-6">
                  <span className="text-3xl font-light text-amber-600">0{i}</span>
                  <h3 className="mt-3 text-lg font-semibold">{t(`howTo.steps.${i}.title`)}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{t(`howTo.steps.${i}.text`)}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Real Before/After Showcase & Copyable Prompts */}
          <section id="prompts" aria-labelledby="prompts-title" className="scroll-mt-24">
            <h2 id="prompts-title" className="text-3xl font-semibold tracking-tight">
              {t('prompts.title')}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('prompts.intro')}</p>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              {sampleData.samples.map((item, idx) => {
                const index = idx + 1;
                return (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
                  >
                    <div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="relative overflow-hidden rounded-lg bg-slate-100">
                          <img
                            src={`${R2_HOST}/${item.beforeKey}`}
                            alt={`${t(`samples.items.${index}.title`)} - ${t('hero.beforeBadge')}`}
                            className="aspect-[3/4] w-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                            {t('hero.beforeBadge')}
                          </span>
                        </div>
                        <div className="relative overflow-hidden rounded-lg bg-slate-100">
                          <img
                            src={`${R2_HOST}/${item.afterKey}`}
                            alt={`${t(`samples.items.${index}.title`)} - ${t('hero.afterBadge')}`}
                            className="aspect-[3/4] w-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute left-1.5 top-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
                            {t('hero.afterBadge')}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold">{t(`samples.items.${index}.title`)}</h3>
                      <p className="mt-1 text-xs text-slate-500">{t(`samples.items.${index}.caption`)}</p>

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                          {t('prompts.editPromptLabel')}
                        </p>
                        <p
                          lang="en"
                          className="mt-1.5 whitespace-pre-wrap break-words rounded-xl bg-[#FFFBF0] p-3 font-mono text-xs leading-5 text-slate-700"
                        >
                          {item.prompt}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-start gap-3 pt-2">
                      <CopyPromptButton prompt={item.prompt} namespace="flux3ImageKlein.prompts" />
                      <a
                        href={`#generator`}
                        className="rounded-lg bg-[#FFD84D] px-3.5 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-300"
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

          {/* Model Comparison Table */}
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
                    <th className="px-5 py-3.5 font-semibold text-amber-900">{t('comparison.columns.fluxKlein')}</th>
                    <th className="px-5 py-3.5 font-semibold">{t('comparison.columns.nanoBanana')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row}>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {t(`comparison.rows.${row}.feature`)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{t(`comparison.rows.${row}.fluxKlein`)}</td>
                      <td className="px-5 py-3.5 text-slate-600">{t(`comparison.rows.${row}.nanoBanana`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Prompt Enhancement Tips */}
          <section aria-labelledby="tips-title" className="max-w-4xl rounded-2xl border border-amber-200 bg-white p-6 sm:p-8">
            <h2 id="tips-title" className="text-2xl font-semibold tracking-tight">
              {t('tips.title')}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">{t('tips.text')}</p>
          </section>

          {/* Related Tools */}
          <section aria-labelledby="related-title">
            <h2 id="related-title" className="text-3xl font-semibold tracking-tight">
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
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t(`related.${item.key}Description`)}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section aria-labelledby="faq-title" className="max-w-4xl">
            <h2 id="faq-title" className="text-3xl font-semibold tracking-tight">
              {t('faq.title')}
            </h2>
            <div className="mt-6 divide-y divide-amber-200 rounded-2xl border border-amber-200 bg-white px-6">
              {faqItems.map((item) => (
                <details key={item.question} className="py-5">
                  <summary className="cursor-pointer pr-4 text-lg font-medium">{item.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
