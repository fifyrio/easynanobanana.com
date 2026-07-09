'use client';

import { ChangeEvent, DragEvent, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import LoginModal from './ui/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

export interface CigarAnalysisResult {
  brand: string;
  line: string;
  origin: string;
  wrapper: string;
  size: string;
  strength: string;
  tastingNotes: string[];
  estimatedPrice: string;
  confidence: string;
  summary: string;
}

interface UploadSlot {
  file: File | null;
  preview: string | null;
  fileName: string | null;
}

const createEmptySlot = (): UploadSlot => ({ file: null, preview: null, fileName: null });

const strengthLevels = ['Mild', 'Mild-Medium', 'Medium', 'Medium-Full', 'Full'];

export default function AiCigarScannerExperience() {
  const t = useTranslations('aiCigarScanner');
  const { user, profile, refreshProfile } = useAuth();

  const [slots, setSlots] = useState<UploadSlot[]>(() => [createEmptySlot(), createEmptySlot()]);
  const [notes, setNotes] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<CigarAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const creditsRequired = 5;

  const updateSlot = (index: number, partial: Partial<UploadSlot>) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...partial } : slot)));
  };

  const handleSelectedFile = (index: number, file?: File) => {
    if (!file) {
      updateSlot(index, createEmptySlot());
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      updateSlot(index, { file, fileName: file.name, preview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(index, event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setActiveDragIndex(null);
    handleSelectedFile(index, event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setActiveDragIndex(index);
  };

  const handleDragLeave = (index: number) => (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setActiveDragIndex((current) => (current === index ? null : current));
    }
  };

  const handleScan = async () => {
    const primary = slots[0];
    if (!primary.file) {
      setError(t('error.upload'));
      return;
    }
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(t('error.credits', { required: creditsRequired }));
      return;
    }

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append('image', primary.file);
      if (slots[1].file) {
        formData.append('image2', slots[1].file);
      }
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const response = await fetch('/api/analyze-cigar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setShowLoginModal(true);
        } else if (response.status === 402) {
          setError(t('error.credits', { required: data.required ?? creditsRequired }));
        } else {
          setError(data.error || t('error.failed'));
        }
        return;
      }

      if (!data.analysis) {
        setError(t('error.failed'));
        return;
      }

      setResult(data.analysis as CigarAnalysisResult);
      await refreshProfile();
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(t('error.network'));
      } else {
        setError(t('error.failed'));
      }
    } finally {
      setIsScanning(false);
    }
  };

  const strengthIndex = result ? strengthLevels.indexOf(result.strength) : -1;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-[#FBF6EC] to-white text-slate-900 pb-16">
        <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            {/* Left column — input */}
            <div className="rounded-[32px] border border-[#E7D2A6] bg-white/90 shadow-[0_40px_120px_rgba(120,72,20,0.18)] p-6 sm:p-10 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#F3E7C9] px-4 py-1 text-sm font-semibold text-[#7A5416]">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#B98A3C] text-lg shadow-lg">
                  🚬
                </div>
                {t('hero.badge')}
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                  {t('hero.title')}
                </h1>
                <p className="text-base text-slate-600">{t('hero.subtitle')}</p>
              </div>

              {/* Two upload slots */}
              <div className="grid grid-cols-2 gap-4">
                {slots.map((slot, index) => {
                  const inputId = `cigar-upload-${index}`;
                  const slotLabel = index === 0 ? t('input.upload.slot1') : t('input.upload.slot2');
                  const optional = index === 1;
                  return (
                    <div
                      key={index}
                      className={`relative rounded-2xl border-2 border-dashed bg-[#FBF6EC] p-3 transition ${
                        activeDragIndex === index ? 'border-[#B98A3C] bg-[#F3E7C9]' : 'border-[#E7D2A6]'
                      }`}
                      onDrop={handleDrop(index)}
                      onDragOver={handleDragOver(index)}
                      onDragLeave={handleDragLeave(index)}
                    >
                      <label htmlFor={inputId} className="block cursor-pointer">
                        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white">
                          {slot.preview ? (
                            <Image src={slot.preview} alt={slotLabel} fill sizes="240px" className="object-cover" />
                          ) : (
                            <div className="text-center px-2">
                              <div className="text-3xl">📷</div>
                              <p className="mt-2 text-xs font-medium text-slate-500">{t('input.upload.button')}</p>
                            </div>
                          )}
                        </div>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        id={inputId}
                        className="hidden"
                        onChange={handleFileChange(index)}
                      />
                      <p className="mt-2 text-center text-xs font-semibold text-slate-700">
                        {slotLabel}
                        {optional && <span className="text-slate-400"> · {t('input.upload.optional')}</span>}
                      </p>
                      {slot.preview && (
                        <button
                          type="button"
                          onClick={() => updateSlot(index, createEmptySlot())}
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900/70 text-xs text-white hover:bg-slate-900"
                          aria-label={t('input.upload.clear')}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">{t('input.upload.format')}</p>

              {/* Notes */}
              <div>
                <label htmlFor="cigar-notes" className="block text-sm font-semibold text-slate-900 mb-2">
                  {t('input.notes.label')}
                </label>
                <textarea
                  id="cigar-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('input.notes.placeholder')}
                  maxLength={300}
                  rows={3}
                  className="w-full rounded-2xl border border-[#E7D2A6] bg-[#FBF6EC] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-inner focus:border-[#B98A3C] focus:outline-none focus:ring-1 focus:ring-[#B98A3C] transition resize-none"
                />
                <p className="mt-1 text-xs text-slate-500">{t('input.notes.hint')}</p>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  onClick={handleScan}
                  loading={isScanning}
                  className="w-full rounded-2xl bg-[#B98A3C] px-6 py-3 text-center text-base font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#a87a2f]"
                >
                  {isScanning ? t('input.button.scanning') : t('input.button.scan')}
                </Button>
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  {t('input.button.credits', { count: creditsRequired })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                <div className="rounded-2xl border border-[#E7D2A6] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.accuracy.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.accuracy.label')}</div>
                </div>
                <div className="rounded-2xl border border-[#E7D2A6] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.time.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.time.label')}</div>
                </div>
              </div>
            </div>

            {/* Right column — result */}
            <div className="relative">
              <div className="rounded-[36px] border border-[#E7D2A6] bg-white shadow-[0_40px_140px_rgba(120,72,20,0.18)] p-6 min-h-[420px]">
                {isScanning ? (
                  <div className="flex h-full min-h-[380px] flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-[#E7D2A6]/40 border-t-[#B98A3C] animate-spin"></div>
                    </div>
                    <div className="mt-6 text-center space-y-2">
                      <p className="text-slate-900 font-semibold text-lg">{t('result.loading.title')}</p>
                      <p className="text-slate-500 text-sm">{t('result.loading.subtitle')}</p>
                    </div>
                  </div>
                ) : result ? (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#B98A3C]">{t('result.title')}</p>
                        <h2 className="mt-1 text-2xl font-semibold text-slate-900">{result.brand}</h2>
                        {result.line && result.line !== 'Unknown' && (
                          <p className="text-sm text-slate-500">{result.line}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-[#F3E7C9] px-3 py-1 text-xs font-semibold text-[#7A5416]">
                        {t('result.fields.confidence')}: {result.confidence}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: t('result.fields.origin'), value: result.origin },
                        { label: t('result.fields.wrapper'), value: result.wrapper },
                        { label: t('result.fields.size'), value: result.size },
                        { label: t('result.fields.price'), value: result.estimatedPrice },
                      ].map((field) => (
                        <div key={field.label} className="rounded-2xl border border-[#E7D2A6] bg-[#FBF6EC] px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">{field.label}</p>
                          <p className="mt-1 font-semibold text-slate-900">{field.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Strength meter */}
                    <div className="rounded-2xl border border-[#E7D2A6] bg-[#FBF6EC] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">{t('result.fields.strength')}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex flex-1 gap-1">
                          {strengthLevels.map((level, i) => (
                            <div
                              key={level}
                              className={`h-2 flex-1 rounded-full ${
                                strengthIndex >= 0 && i <= strengthIndex ? 'bg-[#B98A3C]' : 'bg-[#E7D2A6]'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{result.strength}</span>
                      </div>
                    </div>

                    {/* Tasting notes */}
                    {result.tastingNotes?.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">{t('result.fields.tasting')}</p>
                        <div className="flex flex-wrap gap-2">
                          {result.tastingNotes.map((note) => (
                            <span key={note} className="rounded-full border border-[#E7D2A6] bg-white px-3 py-1 text-xs font-medium text-slate-700">
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl bg-[#2B2118] px-4 py-4 text-sm leading-relaxed text-[#F3E7C9]">
                      {result.summary}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-[#E7D2A6] text-slate-900 hover:bg-[#F3E7C9]"
                      onClick={() => {
                        setResult(null);
                        setSlots([createEmptySlot(), createEmptySlot()]);
                        setNotes('');
                      }}
                    >
                      {t('result.scanAgain')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center">
                    <div className="text-5xl">🔍</div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">{t('result.empty.title')}</p>
                    <p className="mt-1 max-w-xs text-sm text-slate-500">{t('result.empty.subtitle')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* How to */}
        <section className="bg-gradient-to-b from-white to-[#F5EAD4] text-slate-900 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#B98A3C]">{t('howTo.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('howTo.title')}</h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="rounded-[28px] bg-white border border-[#E7D2A6] shadow-[0_30px_90px_rgba(120,72,20,0.15)] overflow-hidden flex flex-col hover:-translate-y-1 transition"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-[#B98A3C] text-white font-semibold flex items-center justify-center shadow-md mb-4">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">{t(`howTo.steps.${step}.title`)}</h3>
                  <p className="text-sm text-slate-600">{t(`howTo.steps.${step}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-gradient-to-b from-[#F5EAD4] via-white to-[#F5EAD4] text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#B98A3C]">{t('benefits.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('benefits.title')}</h2>
            <p className="text-slate-600 max-w-3xl">{t('benefits.subtitle')}</p>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="rounded-[28px] bg-white border border-[#E7D2A6] shadow-[0_30px_90px_rgba(120,72,20,0.15)] p-6 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F3E7C9] border border-[#E7D2A6] flex items-center justify-center text-xl text-[#7A5416]">
                  {['🎯', '💰', '📚'][key - 1]}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{t(`benefits.cards.${key}.title`)}</h3>
                <p className="text-slate-600 text-sm">{t(`benefits.cards.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white text-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#B98A3C]">{t('faq.badge')}</p>
            <h2 className="text-3xl font-semibold">{t('faq.title')}</h2>
            <p className="text-slate-600">{t('faq.subtitle')}</p>
          </div>
          <div className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
            {[1, 2, 3, 4].map((index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-3xl border border-[#E7D2A6] bg-white shadow-[0_25px_70px_rgba(120,72,20,0.12)] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-slate-900">{t(`faq.items.${index}.question`)}</span>
                    <span className="text-[#B98A3C] text-2xl">{isOpen ? '–' : '+'}</span>
                  </button>
                  {isOpen && <div className="px-6 pb-6 text-sm text-slate-600">{t(`faq.items.${index}.answer`)}</div>}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
