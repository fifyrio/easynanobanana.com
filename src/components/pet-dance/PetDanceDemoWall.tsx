'use client';

import { useTranslations } from 'next-intl';
import type { AiPetDancePreset } from '../AiPetDanceExperience';

interface PetDanceDemoWallProps {
  /** Pre-rendered showcase clips — zero API cost, serves the "just let me see it" intent. */
  presets: AiPetDancePreset[];
  demoVideoSrc: (presetId: string) => string;
  /** i18n namespace supplying the `demo.*` copy for this page. */
  namespace?: string;
}

export default function PetDanceDemoWall({ presets, demoVideoSrc, namespace = 'aiPetDance' }: PetDanceDemoWallProps) {
  const t = useTranslations(namespace);

  if (presets.length === 0) return null;

  return (
    <section className="mt-20 bg-gradient-to-b from-white to-[#FFF7DA]">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('demo.badge')}</p>
        <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('demo.title')}</h2>
        <p className="mx-auto max-w-3xl text-slate-600">{t('demo.subtitle')}</p>
      </div>
      <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {presets.map((preset) => (
          <figure
            key={preset.id}
            className="overflow-hidden rounded-[24px] border border-[#FFE7A1] bg-white shadow-[0_20px_60px_rgba(247,201,72,0.18)] transition hover:-translate-y-1"
          >
            <video
              src={demoVideoSrc(preset.id)}
              poster={preset.displaySrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="aspect-[9/16] w-full bg-black object-cover"
            />
            <figcaption className="px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{preset.name}</p>
              <p className="text-xs text-slate-500">{preset.description}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
