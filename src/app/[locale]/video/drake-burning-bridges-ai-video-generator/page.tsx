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
import presetsData from '@/data/ai-burning-bridges-presets.json';

const PATH = '/video/drake-burning-bridges-ai-video-generator';
const BASE = 'https://www.easynanobanana.com';
const ASSETS = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-burning-bridges';
const localPath = (locale: string, path: string) => `${locale === 'en' ? '' : `/${locale}`}${path}`;
const DEMOS = `${ASSETS}/demo/20261012`;
const OG = `${ASSETS}/feature/og-image.jpg`;

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiBurningBridges.seo' });
  const url = `${BASE}${localPath(locale, PATH)}`;
  return {
    title: t('title'), description: t('description'),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(locales.map((lang) => [lang, `${BASE}${localPath(lang, PATH)}`])),
    },
    openGraph: { title: t('ogTitle'), description: t('ogDescription'), url,
      siteName: 'Easy Nano Banana', type: 'website',
      images: [{ url: OG, width: 1200, height: 630, alt: t('ogTitle') }] },
    twitter: { card: 'summary_large_image', title: t('ogTitle'), description: t('ogDescription'), images: [OG] },
  };
}

export default async function BurningBridgesPage({ params: { locale }, searchParams }: {
  params: { locale: string };
  searchParams: { preset?: string };
}) {
  const t = await getTranslations({ locale, namespace: 'aiBurningBridges' });
  const { presets } = presetsData;
  const initialPreset = presets.find((preset) => preset.id === searchParams.preset)?.id ?? presets[0].id;
  const faqItems = [1, 2, 3, 4, 5].map((i) => ({ question: t(`faq.items.${i}.question`), answer: t(`faq.items.${i}.answer`) }));
  const url = `${BASE}${localPath(locale, PATH)}`;
  const showcases = [
    { id: 'virtual-character', label: t('gallery.items.virtual-character') },
    { id: 'hero', label: t('gallery.items.hero') },
    { id: 'pet-party', label: t('gallery.items.pet-party') },
    { id: 'where-she-at', label: t('gallery.items.where-she-at') },
    { id: 'party-lead', label: t('gallery.items.party-lead') },
  ];
  const related = ['/video/ai-vox-history-collage', '/ai-pet-video', '/ai-pet-video/ai-dog-dancing'];
  return (
    <>
      <Header />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema items={[{ name: t('breadcrumb.home'), url: `${BASE}${localPath(locale, '/')}` }, { name: t('breadcrumb.current'), url }]} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: t('hero.title'), url,
        description: t('seo.description'), applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', isAccessibleForFree: false }} />
      <VideoObjectSchema name={t('hero.demoTitle')} description={t('hero.demoCaption')}
        thumbnailUrl={`${DEMOS}/hero.jpg`} contentUrl={`${DEMOS}/hero.mp4`}
        uploadDate="2026-10-12" duration="PT20.062S" />
      <div className="bg-[#FFFCF5] text-slate-900">
        <section className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:pt-12">
          <nav aria-label={t('breadcrumb.current')} className="mb-6 flex flex-wrap gap-2 text-xs text-slate-500">
            <Link href={localPath(locale, '/')} className="hover:underline">{t('breadcrumb.home')}</Link><span aria-hidden="true">/</span><span>{t('breadcrumb.current')}</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.2em] text-amber-800">{t('hero.badge')}</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">{t('hero.title')}</h1>
          <p className="mt-3 text-xl text-amber-800 sm:text-2xl">{t('hero.subtitle')}</p>
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">{t('hero.description')}</p>
          <figure className="mt-7">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
              {showcases.map((showcase) => <div key={showcase.id} className="w-[68vw] max-w-[280px] shrink-0 snap-start md:w-auto md:max-w-none">
                <ShowcaseVideo src={`${DEMOS}/${showcase.id}.mp4`} poster={`${DEMOS}/${showcase.id}.jpg`} label={showcase.label} />
              </div>)}
            </div>
            <figcaption className="mt-3 text-xs leading-5 text-slate-500">{t('hero.demoCaption')}</figcaption>
          </figure>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#generator" className="rounded-xl bg-[#FFD84D] px-5 py-3 font-semibold hover:bg-amber-300">{t('hero.generate')}</a>
            <a href="#prompts" className="rounded-xl border border-amber-300 bg-white px-5 py-3 font-semibold hover:bg-amber-50">{t('hero.prompts')}</a>
          </div>
          <p className="mt-3 text-xs text-slate-500">{t('hero.note')}</p>
        </section>
        <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 sm:px-6">
          <VideoEffectGenerator effectType="ai-burning-bridges" namespace="aiBurningBridges" key={initialPreset} initialPreset={initialPreset}
            presets={presets.map((preset) => ({ id: preset.id, name: t(`prompts.items.${preset.id}.title`) }))} />

          <section aria-labelledby="search-guide-title" className="max-w-4xl">
            <h2 id="search-guide-title" className="text-3xl font-semibold tracking-tight">{t('searchGuide.title')}</h2>
            <p className="mt-5 leading-8 text-slate-600">{t('searchGuide.intro')}</p>
            <h3 className="mt-6 text-xl font-semibold">{t('searchGuide.choiceTitle')}</h3>
            <p className="mt-3 leading-8 text-slate-600">{t('searchGuide.choiceText')}</p>
            <h3 className="mt-6 text-xl font-semibold">{t('searchGuide.expectTitle')}</h3>
            <p className="mt-3 leading-8 text-slate-600">{t('searchGuide.expectText')}</p>
            <Link href={localPath(locale, '/video/rumpelstiltskin-ai-video-generator')} className="mt-5 inline-block font-semibold text-amber-800 underline">{t('searchGuide.related')}</Link>
          </section>

          <section aria-labelledby="trend-title" className="max-w-4xl">
            <h2 id="trend-title" className="text-3xl font-semibold tracking-tight">{t('what.title')}</h2>
            <p className="mt-5 text-slate-600 leading-8">{t('what.paragraph1')}</p>
            <p className="mt-4 text-slate-600 leading-8">{t('what.paragraph2')}</p>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {['identity', 'motion'].map((key) => <div key={key} className="border-l-2 border-amber-300 pl-5">
                <h3 className="text-lg font-semibold">{t(`what.${key}Title`)}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{t(`what.${key}Text`)}</p>
              </div>)}
            </div>
          </section>

          <section aria-labelledby="how-title">
            <h2 id="how-title" className="text-3xl font-semibold tracking-tight">{t('howTo.title')}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('howTo.intro')}</p>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">{[1, 2, 3].map((i) => <li key={i}>
              <span className="text-4xl font-light text-amber-600">0{i}</span>
              <h3 className="mt-4 text-lg font-semibold">{t(`howTo.steps.${i}.title`)}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{t(`howTo.steps.${i}.text`)}</p>
            </li>)}</ol>
          </section>

          <section id="prompts" aria-labelledby="prompts-title" className="scroll-mt-28">
            <h2 id="prompts-title" className="text-3xl font-semibold tracking-tight">{t('prompts.title')}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('prompts.intro')}</p>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">{presets.map((preset) => <article key={preset.id} className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
              <div className="min-w-0 p-5 sm:p-7">
                <p className="text-xs font-semibold text-amber-800">{t('prompts.input')}</p>
                <h3 className="mt-2 text-xl font-semibold">{t(`prompts.items.${preset.id}.title`)}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{t(`prompts.items.${preset.id}.description`)}</p>
                <p lang="en" className="mt-4 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-[#FFFBF0] p-4 font-mono text-xs leading-6 text-slate-700">{preset.prompt}</p>
                <div className="mt-4 flex flex-wrap items-start gap-4">
                  <CopyPromptButton prompt={preset.prompt} />
                  <Link href={`${localPath(locale, PATH)}?preset=${preset.id}#generator`} className="rounded-lg bg-[#FFD84D] px-4 py-2 text-sm font-semibold hover:bg-amber-300">{t('prompts.use')}</Link>
                </div>
              </div>
            </article>)}</div>
            <p className="mt-4 text-xs leading-6 text-slate-500">{t('prompts.note')}</p>
          </section>

          <section aria-labelledby="tips-title">
            <h2 id="tips-title" className="text-3xl font-semibold tracking-tight">{t('tips.title')}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{t('tips.intro')}</p>
            <div className="mt-7 grid gap-7 md:grid-cols-3">{[1, 2, 3].map((i) => <div key={i}>
              <h3 className="font-semibold">{t(`tips.items.${i}.title`)}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{t(`tips.items.${i}.text`)}</p>
            </div>)}</div>
          </section>

          <section aria-labelledby="related-title">
            <h2 id="related-title" className="text-3xl font-semibold tracking-tight">{t('related.title')}</h2>
            <p className="mt-3 leading-7 text-slate-600">{t('related.intro')}</p>
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
      </div>
    </>
  );
}
