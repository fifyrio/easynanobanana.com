import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/common/Header';
import VideoEffectGenerator from '@/components/video/VideoEffectGenerator';
import CopyPromptButton from '@/components/burning-bridges/CopyPromptButton';
import ShowcaseVideo from '@/components/burning-bridges/ShowcaseVideo';
import { FAQSchema, BreadcrumbSchema, VideoObjectSchema } from '@/components/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { locales } from '@/i18n/config';
import presetsData from '@/data/ai-crying-presets.json';

const PATH = '/video/crying-effect-video-generator';
const BASE = 'https://www.easynanobanana.com';
const ASSETS = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-crying';
const DEMO = `${ASSETS}/demo/soft-crying.mp4`;
const POSTER = `${ASSETS}/demo/soft-crying.jpg`;
const OG = `${ASSETS}/feature/og-image.jpg`;
const localPath = (locale: string, path: string) => `${locale === 'en' ? '' : `/${locale}`}${path}`;

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiCrying.seo' });
  const url = `${BASE}${localPath(locale, PATH)}`;
  return {
    title: t('title'), description: t('description'),
    alternates: { canonical: url, languages: Object.fromEntries(locales.map((lang) => [lang, `${BASE}${localPath(lang, PATH)}`])) },
    openGraph: { title: t('ogTitle'), description: t('ogDescription'), url, siteName: 'Easy Nano Banana', type: 'website',
      images: [{ url: OG, width: 1200, height: 630, alt: t('ogTitle') }] },
    twitter: { card: 'summary_large_image', title: t('ogTitle'), description: t('ogDescription'), images: [OG] },
  };
}

export default async function CryingEffectPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiCrying' });
  const preset = presetsData.presets[0];
  const url = `${BASE}${localPath(locale, PATH)}`;
  const faqItems = [1, 2, 3, 4, 5].map((i) => ({ question: t(`faq.items.${i}.question`), answer: t(`faq.items.${i}.answer`) }));
  const related = ['/ai-image-effects/ai-face-expression-changer', '/ai-image-effects/ai-smile-filter', '/video/drake-burning-bridges-ai-video-generator'];

  return (
    <>
      <Header />
      <FAQSchema items={faqItems} />
      <VideoObjectSchema name={t('hero.previewLabel')} description={t('hero.previewCaption')}
        contentUrl={DEMO} thumbnailUrl={POSTER} uploadDate="2026-10-12T00:00:00+08:00" duration="PT4S" />
      <BreadcrumbSchema items={[{ name: t('breadcrumb.home'), url: `${BASE}${localPath(locale, '/')}` }, { name: t('breadcrumb.current'), url }]} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: t('hero.title'), url,
        description: t('seo.description'), applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', isAccessibleForFree: false }} />
      <main className="bg-[#FFFCF5] text-slate-900">
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:pt-12">
          <nav aria-label={t('breadcrumb.current')} className="mb-8 flex flex-wrap gap-2 text-xs text-slate-500">
            <Link href={localPath(locale, '/')} className="hover:underline">{t('breadcrumb.home')}</Link><span aria-hidden="true">/</span><span>{t('breadcrumb.current')}</span>
          </nav>
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-amber-800">{t('hero.badge')}</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">{t('hero.title')}</h1>
              <p className="mt-5 text-2xl text-amber-800 sm:text-3xl">{t('hero.subtitle')}</p>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">{t('hero.description')}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#generator" className="rounded-xl bg-[#FFD84D] px-5 py-3 font-semibold hover:bg-amber-300">{t('hero.generate')}</a>
                <a href="#prompts" className="rounded-xl border border-amber-300 bg-white px-5 py-3 font-semibold hover:bg-amber-50">{t('hero.prompts')}</a>
              </div>
              <p className="mt-4 text-xs text-slate-500">{t('hero.note')}</p>
            </div>
            <figure className="mx-auto w-full max-w-xs">
              <ShowcaseVideo src={DEMO} poster={POSTER} label={t('hero.previewLabel')} />
              <figcaption className="mt-3 text-xs leading-5 text-slate-500">{t('hero.previewCaption')}</figcaption>
            </figure>
          </div>
        </section>
        <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 sm:px-6">
          <VideoEffectGenerator effectType="ai-crying" namespace="aiCrying" initialPreset={preset.id}
            presets={[{ id: preset.id, name: t('prompts.presetTitle') }]} />
          <section aria-labelledby="about-title" className="max-w-4xl">
            <h2 id="about-title" className="text-3xl font-semibold tracking-tight">{t('about.title')}</h2>
            <p className="mt-5 leading-8 text-slate-600">{t('about.text')}</p>
            <p className="mt-4 leading-8 text-slate-600">{t('about.detail')}</p>
          </section>
          <section aria-labelledby="how-title">
            <h2 id="how-title" className="text-3xl font-semibold tracking-tight">{t('howTo.title')}</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">{[1, 2, 3].map((i) => <li key={i}>
              <span className="text-4xl font-light text-amber-600">0{i}</span>
              <h3 className="mt-4 text-lg font-semibold">{t(`howTo.steps.${i}.title`)}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{t(`howTo.steps.${i}.text`)}</p>
            </li>)}</ol>
          </section>
          <section id="prompts" aria-labelledby="prompts-title" className="scroll-mt-28">
            <h2 id="prompts-title" className="text-3xl font-semibold tracking-tight">{t('prompts.title')}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('prompts.intro')}</p>
            <article className="mt-6 rounded-2xl border border-amber-200 bg-white p-5 sm:p-7">
              <h3 className="text-xl font-semibold">{t('prompts.presetTitle')}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{t('prompts.presetDescription')}</p>
              <p lang="en" className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-[#FFFBF0] p-4 font-mono text-xs leading-6 text-slate-700">{preset.prompt}</p>
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <CopyPromptButton prompt={preset.prompt} namespace="aiCrying.prompts" />
                <a href="#generator" className="rounded-lg bg-[#FFD84D] px-4 py-2 text-sm font-semibold hover:bg-amber-300">{t('prompts.use')}</a>
              </div>
            </article>
            <p className="mt-4 text-xs leading-6 text-slate-500">{t('prompts.note')}</p>
          </section>
          <section aria-labelledby="uses-title">
            <h2 id="uses-title" className="text-3xl font-semibold tracking-tight">{t('uses.title')}</h2>
            <div className="mt-7 space-y-6">{[1, 2, 3].map((i) => <article key={i} className="grid items-center gap-6 rounded-2xl border border-amber-200 bg-white p-5 md:grid-cols-2 sm:p-7">
              <figure className={i === 2 ? 'md:order-2' : ''}>
                <div className="grid grid-cols-2 gap-2">
                  {(['before', 'after'] as const).map((stage) => <div key={stage} className="relative overflow-hidden rounded-xl">
                    <Image src={`${ASSETS}/cases/${i}-${stage}.jpg`} width={i === 1 ? 496 : 1024} height={i === 1 ? 864 : 1024}
                      alt={t(`showcase.${stage}Alt`, { subject: t(`showcase.subjects.${i}`) })}
                      sizes="(min-width: 768px) 260px, 45vw" className="aspect-[3/4] w-full object-cover" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{t(`showcase.${stage}`)}</span>
                  </div>)}
                </div>
                <figcaption className="mt-3 text-xs leading-5 text-slate-500">{t(i === 1 ? 'showcase.videoExample' : 'showcase.illustrationExample')}</figcaption>
              </figure>
              <div>
                <h3 className="text-xl font-semibold">{t(`uses.items.${i}.title`)}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{t(`uses.items.${i}.text`)}</p>
              </div>
            </article>)}</div>
          </section>
          <section aria-labelledby="tips-title" className="max-w-4xl">
            <h2 id="tips-title" className="text-3xl font-semibold tracking-tight">{t('tips.title')}</h2>
            <p className="mt-4 leading-8 text-slate-600">{t('tips.text')}</p>
          </section>
          <section aria-labelledby="related-title">
            <h2 id="related-title" className="text-3xl font-semibold tracking-tight">{t('related.title')}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">{related.map((path, i) => <Link key={path} href={localPath(locale, path)} className="rounded-2xl border border-amber-200 bg-white p-6 hover:border-amber-400">
              <h3 className="font-semibold">{t(`related.items.${i + 1}.title`)} <span aria-hidden="true">↗</span></h3><p className="mt-3 text-sm leading-7 text-slate-600">{t(`related.items.${i + 1}.description`)}</p>
            </Link>)}</div>
          </section>
          <section aria-labelledby="faq-title" className="max-w-4xl">
            <h2 id="faq-title" className="text-3xl font-semibold tracking-tight">{t('faq.title')}</h2>
            <div className="mt-6 divide-y divide-amber-200">{faqItems.map((item) => <details key={item.question} className="py-5">
              <summary className="cursor-pointer pr-4 text-lg font-medium">{item.question}</summary><p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
            </details>)}</div>
          </section>
          <section className="rounded-3xl bg-[#27231E] p-8 text-white sm:p-12">
            <h2 className="text-3xl font-semibold sm:text-4xl">{t('cta.title')}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-stone-300">{t('cta.description')}</p>
            <a href="#generator" className="mt-6 inline-block rounded-xl bg-[#FFD84D] px-5 py-3 font-semibold text-slate-900 hover:bg-amber-300">{t('cta.button')}</a>
          </section>
        </div>
      </main>
    </>
  );
}
