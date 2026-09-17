'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Header from '../common/Header';
import PetDanceFaq from './PetDanceFaq';
import PetDanceRelatedLinks, { type RelatedSection } from './PetDanceRelatedLinks';
import { R2_TALK_BASE } from '@/lib/pet-video/page-helpers';

export interface GalleryClip {
  id: string;
  name: string;
  description: string;
  displaySrc: string;
}

interface PetEffectGalleryProps {
  /** i18n namespace for this gallery's copy. */
  namespace: string;
  /** Pre-rendered clips shown in the wall; the first is the hero feature. */
  clips: GalleryClip[];
  /** `ideas` list length under `<namespace>.ideas.items`. */
  ideasCount: number;
  /** FAQ length under `<namespace>.faq.items`. */
  faqCount: number;
  related: RelatedSection;
  /** Locale-prefixed link to the matching generator (the transactional funnel). */
  generatorHref: string;
}

const clipVideoSrc = (id: string) => `${R2_TALK_BASE}/demo/${id}.mp4`;

/**
 * Effect-gallery page for informational-intent keywords (watch talking / singing
 * pets). Leads with the video wall — the "just let me see it" intent — and funnels
 * to the generator via CTA and internal links, instead of forcing a tool up top.
 */
export default function PetEffectGallery({
  namespace,
  clips,
  ideasCount,
  faqCount,
  related,
  generatorHref,
}: PetEffectGalleryProps) {
  const t = useTranslations(namespace);
  const featured = clips[0];
  const wallClips = clips;
  const ideaIndexes = Array.from({ length: ideasCount }, (_, i) => i + 1);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-[#FFFBEA] to-white text-slate-900 pb-16">
        {/* ===== Hero: text + featured clip ===== */}
        <section className="mx-auto max-w-6xl px-4 pt-10 md:pt-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFD84D] text-lg shadow-lg">🎤</div>
                {t('hero.badge')}
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                {t('hero.title')}
              </h1>
              <p className="text-base text-slate-600 sm:text-lg">{t('hero.subtitle')}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#effect-wall"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FFD84D] px-6 py-3 text-base font-semibold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                >
                  {t('hero.watchButton')} <span>↓</span>
                </a>
                <Link
                  href={generatorHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#FFE7A1] bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-[#FFF3B2]"
                >
                  {t('hero.makeButton')} <span>→</span>
                </Link>
              </div>
            </div>

            {featured && (
              <div className="rounded-[36px] border border-[#FFE7A1] bg-white p-4 shadow-[0_40px_140px_rgba(196,147,18,0.25)]">
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[28px] bg-black">
                  <video
                    src={clipVideoSrc(featured.id)}
                    poster={featured.displaySrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute left-5 top-5 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                    {featured.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===== Effect wall ===== */}
        <section id="effect-wall" className="mt-20 scroll-mt-24 bg-gradient-to-b from-white to-[#FFF7DA]">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-16 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('wall.badge')}</p>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('wall.title')}</h2>
            <p className="mx-auto max-w-3xl text-slate-600">{t('wall.subtitle')}</p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
            {wallClips.map((clip) => (
              <figure
                key={clip.id}
                className="overflow-hidden rounded-[24px] border border-[#FFE7A1] bg-white shadow-[0_20px_60px_rgba(247,201,72,0.18)] transition hover:-translate-y-1"
              >
                <video
                  src={clipVideoSrc(clip.id)}
                  poster={clip.displaySrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="aspect-[9/16] w-full bg-black object-cover"
                />
                <figcaption className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{clip.name}</p>
                  <p className="text-xs text-slate-500">{clip.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ===== How these are made ===== */}
        <section className="bg-white text-slate-900">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-16 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('howTo.badge')}</p>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('howTo.title')}</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="flex flex-col overflow-hidden rounded-[28px] border border-[#FFE7A1] bg-[#FFFBF0] shadow-[0_30px_90px_rgba(255,216,77,0.25)]"
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD84D] font-semibold text-slate-900 shadow-md">
                    {step}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">{t(`howTo.steps.${step}.title`)}</h3>
                  <p className="text-sm text-slate-600">{t(`howTo.steps.${step}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Ideas ===== */}
        <section className="bg-gradient-to-b from-[#FFF7DA] to-white text-slate-900">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-16 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('ideas.badge')}</p>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('ideas.title')}</h2>
            <p className="mx-auto max-w-3xl text-slate-600">{t('ideas.subtitle')}</p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
            {ideaIndexes.map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#FFE7A1] bg-white p-5 shadow-[0_15px_40px_rgba(247,201,72,0.15)]"
              >
                <div className="mb-3 text-3xl">{t(`ideas.items.${i}.emoji`)}</div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">{t(`ideas.items.${i}.title`)}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{t(`ideas.items.${i}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <PetDanceFaq namespace={namespace} count={faqCount} />

        <PetDanceRelatedLinks section={related} />

        {/* ===== CTA ===== */}
        <section className="bg-white text-slate-900">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="space-y-5 rounded-[36px] border border-[#FFE7A1] bg-gradient-to-br from-[#FFD84D] via-[#FFE062] to-[#FFF3B2] p-10 text-center shadow-[0_40px_120px_rgba(247,201,72,0.45)]">
              <div className="text-4xl">🎬</div>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('cta.title')}</h2>
              <p className="mx-auto max-w-2xl text-slate-700">{t('cta.subtitle')}</p>
              <Link
                href={generatorHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5"
              >
                {t('cta.button')} <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
