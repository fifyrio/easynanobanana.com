'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from './common/Header';
import { useTranslations } from 'next-intl';
import { Season, Centerpiece } from './qr-tree/palette';

const QrTreeCanvas = dynamic(() => import('./qr-tree/QrTreeCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[#8C6A00]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FFE7A1]/40 border-t-[#F0A202]" />
    </div>
  ),
});

const PIECES: { id: Centerpiece; icon: string; label: string }[] = [
  { id: 'banana', icon: '🍌', label: 'Banana' },
  { id: 'tree', icon: '🌳', label: 'Tree' },
  { id: 'rocket', icon: '🚀', label: 'Rocket' },
];

// Theme slots (spring/summer/autumn) relabelled per centerpiece.
const THEME_TABS: Record<Centerpiece, { id: Season; icon: string; label: string }[]> = {
  banana: [
    { id: 'spring', icon: '🌅', label: 'Sunrise' },
    { id: 'summer', icon: '☀️', label: 'Noon' },
    { id: 'autumn', icon: '🌇', label: 'Sunset' },
  ],
  tree: [
    { id: 'spring', icon: '🌸', label: 'Spring' },
    { id: 'summer', icon: '☀️', label: 'Summer' },
    { id: 'autumn', icon: '🍂', label: 'Autumn' },
  ],
  rocket: [
    { id: 'spring', icon: '🌅', label: 'Dawn' },
    { id: 'summer', icon: '🚀', label: 'Day' },
    { id: 'autumn', icon: '🌆', label: 'Dusk' },
  ],
};

const DEFAULT_URL = 'https://www.easynanobanana.com';

export default function AiQrTreeExperience() {
  const t = useTranslations('aiQrTree');
  const [inputValue, setInputValue] = useState(DEFAULT_URL);
  const [value, setValue] = useState(DEFAULT_URL);
  const [season, setSeason] = useState<Season>('summer');
  const [centerpiece, setCenterpiece] = useState<Centerpiece>('banana');
  const [scanning, setScanning] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const commit = useCallback(() => {
    const v = inputValue.trim() || DEFAULT_URL;
    setValue(v);
    setScanning(false);
  }, [inputValue]);

  const handleDownload = useCallback(() => {
    const canvas = stageRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'easy-nano-banana-qr-tree.png';
    a.click();
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#f5efe2] via-[#f3ece1] to-white text-slate-900 pb-16">
        <section className="max-w-4xl mx-auto px-4 pt-8 md:pt-12">
          <div className="text-center space-y-2 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
              <span>🌳</span>{t('hero.badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">{t('hero.title')}</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">{t('hero.subtitle')}</p>
          </div>

          {/* 3D stage */}
          <div
            ref={stageRef}
            className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-[32px] border border-[#e7ddc9] bg-[#f3ece1] shadow-[0_40px_120px_rgba(160,140,90,0.22)]"
          >
            <QrTreeCanvas value={value} season={season} centerpiece={centerpiece} scanning={scanning} />
            {/* Centerpiece switcher (pluggable "腾笼换鸟"); hidden in QR view so it does not cover the finder pattern */}
            {!scanning && (
            <div className="absolute left-4 top-4 flex gap-1 rounded-full border border-[#e0d6c0] bg-white/85 p-1 shadow-sm backdrop-blur">
              {PIECES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setCenterpiece(p.id); setScanning(false); }}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition ${
                    centerpiece === p.id ? 'bg-[#efe7d6] text-slate-900' : 'text-slate-500 hover:bg-[#f6f0e4]'
                  }`}
                  aria-pressed={centerpiece === p.id}
                >
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
            )}
            <button
              onClick={() => setScanning((s) => !s)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-[#e0d6c0] bg-white/85 px-5 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              {scanning ? t('stage.showTree') : t('stage.showQr')}
            </button>
          </div>

          {/* URL input + share */}
          <div className="mt-5 flex gap-3">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
              placeholder={t('input.placeholder')}
              className="flex-1 rounded-2xl border border-[#e0d6c0] bg-white px-5 py-4 text-lg font-medium text-slate-800 shadow-inner outline-none focus:border-[#F0A202]"
            />
            <button
              onClick={commit}
              className="rounded-2xl bg-[#b5732e] px-5 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#a5661f]"
              aria-label={t('input.generate')}
            >
              {t('input.generate')}
            </button>
          </div>

          {/* Season tabs + download */}
          <div className="mt-3 flex gap-2">
            <div className="flex flex-1 gap-2 rounded-2xl">
              {THEME_TABS[centerpiece].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSeason(s.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    season === s.id
                      ? 'border-[#e0d6c0] bg-[#efe7d6] text-slate-900'
                      : 'border-transparent bg-white text-slate-500 hover:bg-[#f6f0e4]'
                  }`}
                >
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleDownload}
              className="rounded-2xl border border-[#e0d6c0] bg-white px-4 text-slate-700 shadow-sm transition hover:bg-[#f6f0e4]"
              aria-label={t('stage.download')}
              title={t('stage.download')}
            >
              ⬇
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">{t('stage.privacy')}</p>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-4 mt-16">
          <div className="text-center space-y-2 mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('howTo.badge')}</p>
            <h2 className="text-3xl font-semibold">{t('howTo.title')}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="rounded-[28px] bg-white border border-[#eadfca] p-6 shadow-[0_20px_60px_rgba(200,180,120,0.2)]">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-[#FFD84D] font-semibold text-slate-900">{step}</div>
                <h3 className="text-lg font-semibold mb-2">{t(`howTo.steps.${step}.title`)}</h3>
                <p className="text-sm text-slate-600">{t(`howTo.steps.${step}.description`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 mt-16">
          <div className="text-center space-y-2 mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('faq.badge')}</p>
            <h2 className="text-3xl font-semibold">{t('faq.title')}</h2>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="rounded-3xl border border-[#eadfca] bg-white overflow-hidden">
                  <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between px-6 py-4 text-left">
                    <span className="font-semibold">{t(`faq.items.${i}.question`)}</span>
                    <span className="text-[#C69312] text-2xl">{open ? '–' : '+'}</span>
                  </button>
                  {open && <div className="px-6 pb-6 text-sm text-slate-600">{t(`faq.items.${i}.answer`)}</div>}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
