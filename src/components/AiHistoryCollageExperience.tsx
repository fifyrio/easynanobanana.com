'use client';

import { ChangeEvent, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import LoginModal from './ui/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

export interface AiHistoryCollagePreset {
  id: string;
  name: string;
  description: string;
  displaySrc: string;
  prompt: string;
}

interface AiHistoryCollageExperienceProps {
  presets: AiHistoryCollagePreset[];
}

type AspectRatio = '9:16' | '16:9';

interface ImageSlot {
  file: File | null;
  preview: string | null;
  uploadedUrl: string | null;
  fileName: string | null;
}

const EMPTY_SLOT: ImageSlot = {
  file: null,
  preview: null,
  uploadedUrl: null,
  fileName: null,
};

const R2_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-history-collage';
const SAMPLE_BEFORE_IMAGE = `${R2_BASE}/feature/sample-collage.jpg`;
const SAMPLE_AFTER_VIDEO = `${R2_BASE}/feature/sample-collage.mp4`;

const CREDITS_REQUIRED = 100;
const CUSTOM_TEXT_MAX_LENGTH = 300;
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 48; // 4 min ceiling — Seedance 4s 480p typ. completes < 2 min

export default function AiHistoryCollageExperience({ presets }: AiHistoryCollageExperienceProps) {
  const t = useTranslations('aiHistoryCollage');
  const { user, profile, refreshProfile } = useAuth();

  const [slotA, setSlotA] = useState<ImageSlot>(EMPTY_SLOT);
  const [slotB, setSlotB] = useState<ImageSlot>(EMPTY_SLOT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [customText, setCustomText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<AiHistoryCollagePreset | null>(
    presets[0] ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleFileChange = (
    slot: 'A' | 'B',
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const next: ImageSlot = {
        file,
        preview: e.target?.result as string,
        uploadedUrl: null,
        fileName: file.name,
      };
      if (slot === 'A') setSlotA(next);
      else setSlotB(next);
    };
    reader.readAsDataURL(file);
    setGeneratedVideoUrl(null);
  };

  const clearSlot = (slot: 'A' | 'B') => {
    if (slot === 'A') setSlotA(EMPTY_SLOT);
    else setSlotB(EMPTY_SLOT);
  };

  const uploadIfNeeded = async (slot: ImageSlot): Promise<string | null> => {
    if (slot.uploadedUrl) return slot.uploadedUrl;
    if (!slot.file) return null;
    const formData = new FormData();
    formData.append('file', slot.file);
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(json.error || 'upload failed');
    }
    const json = await response.json();
    if (!json.imageUrl) throw new Error('upload returned no url');
    return json.imageUrl as string;
  };

  const handleGenerate = async () => {
    if (!slotA.preview || !slotB.preview) {
      setError(t('error.uploadBoth'));
      return;
    }

    if (!selectedPreset) {
      setError(t('error.preset'));
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!profile || (profile.credits || 0) < CREDITS_REQUIRED) {
      setError(t('error.credits', { required: CREDITS_REQUIRED }));
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        setShowLoginModal(true);
        return;
      }

      // Step 1: upload both images
      let urlA: string;
      let urlB: string;
      try {
        const [a, b] = await Promise.all([uploadIfNeeded(slotA), uploadIfNeeded(slotB)]);
        if (!a || !b) throw new Error('missing url');
        urlA = a;
        urlB = b;
        setSlotA((s) => ({ ...s, uploadedUrl: a }));
        setSlotB((s) => ({ ...s, uploadedUrl: b }));
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : 'unknown';
        setError(t('error.uploadFailed', { msg }));
        return;
      }

      // Step 2: kick off video generation
      const generateResponse = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          effectType: 'ai-history-collage',
          presetId: selectedPreset.id,
          sourceImageUrl: urlA,
          referenceImageUrls: [urlA, urlB],
          aspectRatio,
          customText: customText.trim() || undefined,
        }),
      });

      const generateJson = await generateResponse.json();

      if (!generateResponse.ok || !generateJson.success) {
        if (generateResponse.status === 401) {
          setShowLoginModal(true);
        } else if (generateResponse.status === 402) {
          setError(t('error.credits', { required: generateJson.required ?? CREDITS_REQUIRED }));
        } else {
          setError(generateJson.error || t('error.generic'));
        }
        return;
      }

      const taskId: string | undefined = generateJson.data?.taskId;
      if (!taskId) {
        setError(t('error.generic'));
        return;
      }

      // Step 3: poll task-status
      for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        const statusResponse = await fetch(
          `/api/video/task-status?taskId=${encodeURIComponent(taskId)}`,
          {
            cache: 'no-store',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!statusResponse.ok) continue;
        const statusJson = await statusResponse.json();
        if (!statusJson.success) continue;

        const status: string = statusJson.data.status;
        if (status === 'completed' && statusJson.data.videoUrl) {
          setGeneratedVideoUrl(statusJson.data.videoUrl as string);
          await refreshProfile();
          return;
        }
        if (status === 'failed') {
          setError(statusJson.data.errorMessage || t('error.generic'));
          return;
        }
      }

      setError(t('error.timeout'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(t('error.network', { msg }));
    } finally {
      setIsGenerating(false);
    }
  };

  const hasUserUpload = Boolean(slotA.preview || slotB.preview);
  const showingSample = !hasUserUpload && !generatedVideoUrl && !isGenerating;
  const previewImage = slotA.preview || slotB.preview || SAMPLE_BEFORE_IMAGE;
  const displayVideoUrl = generatedVideoUrl ?? (showingSample ? SAMPLE_AFTER_VIDEO : null);

  const renderUploadSlot = (
    slot: ImageSlot,
    key: 'A' | 'B',
    labelKey: 'a' | 'b'
  ) => (
    <div className="flex-1 rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 shadow-inner">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {t(`input.upload.${labelKey}.label`)}
          </p>
          <p className="text-[11px] text-slate-500">
            {t(`input.upload.${labelKey}.hint`)}
          </p>
        </div>
        {slot.preview && (
          <button
            type="button"
            onClick={() => clearSlot(key)}
            className="text-xs text-[#C69312] hover:underline"
          >
            {t('input.upload.clear')}
          </button>
        )}
      </div>

      {slot.preview ? (
        <label
          htmlFor={`collage-upload-${key}`}
          className="block relative aspect-square w-full overflow-hidden rounded-xl border border-dashed border-[#F5C04B] cursor-pointer"
        >
          <Image
            src={slot.preview}
            alt={slot.fileName ?? 'preview'}
            fill
            sizes="200px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/30 transition flex items-center justify-center text-white text-xs font-semibold opacity-0 hover:opacity-100">
            {t('input.upload.replace')}
          </div>
        </label>
      ) : (
        <label
          htmlFor={`collage-upload-${key}`}
          className="flex flex-col items-center justify-center aspect-square w-full rounded-xl border border-dashed border-[#F5C04B] bg-white/60 cursor-pointer hover:bg-[#FFF4CC] transition"
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#FFD84D] text-slate-900 shadow mb-2">+</div>
          <p className="text-xs font-semibold text-slate-700">{t('input.upload.button')}</p>
          <p className="text-[10px] text-slate-500 mt-1 px-2 text-center">
            {t('input.upload.format')}
          </p>
        </label>
      )}

      <input
        type="file"
        accept="image/*"
        id={`collage-upload-${key}`}
        className="hidden"
        onChange={(e) => handleFileChange(key, e)}
      />
    </div>
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-[#FFFBEA] to-white text-slate-900 pb-16">
        <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            {/* Left column — controls */}
            <div className="rounded-[32px] border border-[#FFE58F] bg-white/90 shadow-[0_40px_120px_rgba(247,201,72,0.25)] p-6 sm:p-10 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFD84D] text-lg shadow-lg">
                  📜
                </div>
                {t('hero.badge')}
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                  {t('hero.title')}
                </h1>
                <p className="text-base text-slate-600">{t('hero.subtitle')}</p>
              </div>

              <div className="space-y-6">
                {/* Two image uploads */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">{t('input.upload.label')}</p>
                  <div className="flex gap-3">
                    {renderUploadSlot(slotA, 'A', 'a')}
                    {renderUploadSlot(slotB, 'B', 'b')}
                  </div>
                </div>

                {/* Aspect ratio toggle */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">{t('input.aspect.label')}</p>
                  <div className="inline-flex rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-1 shadow-inner">
                    {(['9:16', '16:9'] as const).map((ratio) => {
                      const active = aspectRatio === ratio;
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAspectRatio(ratio)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            active
                              ? 'bg-[#FFD84D] text-slate-900 shadow'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {ratio === '9:16' ? `📱 ${t('input.aspect.portrait')}` : `🖥 ${t('input.aspect.landscape')}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preset selector */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>{t('input.preset.label')}</span>
                    <span className="hidden sm:block text-xs text-[#C69312]">{t('input.preset.swipe')}</span>
                  </div>

                  {/* Mobile grid */}
                  <div className="grid grid-cols-4 gap-2 sm:hidden">
                    {presets.map((preset) => {
                      const isSelected = selectedPreset?.id === preset.id;
                      return (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => setSelectedPreset(isSelected ? null : preset)}
                          className={`flex flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
                            isSelected
                              ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                              : 'border-transparent bg-white text-slate-500'
                          }`}
                        >
                          <div
                            className={`relative h-14 w-full overflow-hidden rounded-xl border ${
                              isSelected ? 'border-[#F0A202]' : 'border-gray-100'
                            }`}
                          >
                            <Image
                              src={preset.displaySrc}
                              alt={preset.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <div
                            className={`mt-2 text-[10px] font-semibold text-center leading-tight line-clamp-2 ${
                              isSelected ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {preset.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Desktop horizontal scroll */}
                  <div className="hidden sm:block overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                    <div className="inline-flex gap-3 pr-6">
                      {presets.map((preset) => {
                        const isSelected = selectedPreset?.id === preset.id;
                        return (
                          <button
                            type="button"
                            key={preset.id}
                            onClick={() => setSelectedPreset(isSelected ? null : preset)}
                            className={`flex w-[110px] flex-shrink-0 flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
                              isSelected
                                ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                : 'border-transparent bg-white text-slate-500'
                            }`}
                          >
                            <div
                              className={`relative h-20 w-full overflow-hidden rounded-xl border ${
                                isSelected ? 'border-[#F0A202]' : 'border-gray-100'
                              }`}
                            >
                              <Image
                                src={preset.displaySrc}
                                alt={preset.name}
                                fill
                                sizes="110px"
                                className="object-cover"
                              />
                            </div>
                            <div
                              className={`mt-2 text-[11px] font-semibold text-center leading-tight ${
                                isSelected ? 'text-slate-900' : 'text-slate-500'
                              }`}
                            >
                              {preset.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">{t('input.preset.summary.title')}</p>
                    <p>
                      {selectedPreset
                        ? t('input.preset.summary.selected', { name: selectedPreset.name })
                        : t('input.preset.summary.none')}
                    </p>
                  </div>
                </div>

                {/* Custom details (optional) */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>{t('input.custom.label')}</span>
                    <span className="text-xs font-normal text-slate-400">
                      {customText.length}/{CUSTOM_TEXT_MAX_LENGTH}
                    </span>
                  </div>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.slice(0, CUSTOM_TEXT_MAX_LENGTH))}
                    placeholder={t('input.custom.placeholder')}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 text-sm text-slate-700 shadow-inner placeholder:text-slate-400 focus:border-[#F0A202] focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  onClick={handleGenerate}
                  loading={isGenerating}
                  className="w-full rounded-2xl bg-[#FFD84D] px-6 py-3 text-center text-base font-semibold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                >
                  {isGenerating ? t('input.button.generating') : t('input.button.generate')}
                </Button>
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  {t('input.button.credits', { count: CREDITS_REQUIRED })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.presets.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.presets.label')}</div>
                </div>
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.time.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.time.label')}</div>
                </div>
              </div>
            </div>

            {/* Right column — preview */}
            <div className="relative">
              <div className="rounded-[36px] border border-[#FFE7A1] bg-white shadow-[0_40px_140px_rgba(196,147,18,0.25)] p-4">
                <div
                  className={`relative w-full overflow-hidden rounded-[28px] bg-gray-200 ${
                    aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
                  }`}
                >
                  {displayVideoUrl ? (
                    <video
                      key={displayVideoUrl}
                      src={displayVideoUrl}
                      poster={previewImage}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-contain bg-black"
                    />
                  ) : (
                    <Image
                      src={previewImage}
                      alt={t('preview.placeholderAlt')}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain"
                      priority
                    />
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-[#FFE7A1]/30 border-t-[#FFD84D] animate-spin" />
                        <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#FFD84D]/20 blur-xl" />
                      </div>
                      <div className="mt-6 text-center space-y-2">
                        <p className="text-white font-semibold text-lg">{t('preview.loading.title')}</p>
                        <p className="text-[#FFE7A1] text-sm">{t('preview.loading.subtitle')}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  {showingSample && (
                    <span className="absolute left-6 top-6 rounded-full bg-[#FFD84D] px-3 py-1 text-xs font-semibold text-slate-900 shadow">
                      {t('preview.sampleHint')}
                    </span>
                  )}
                  {generatedVideoUrl && (
                    <span className="absolute left-6 top-6 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                      {t('preview.labels.result')}
                    </span>
                  )}
                </div>
              </div>

              {generatedVideoUrl && (
                <div className="mt-6 rounded-[28px] border border-[#FFE7A1] bg-white/90 p-5 shadow-[0_20px_60px_rgba(247,201,72,0.2)]">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('preview.saved.title')}</p>
                      <p className="text-xs text-slate-500">{t('preview.saved.subtitle')}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <a
                        href={generatedVideoUrl}
                        download={`ai-history-collage-${selectedPreset?.id ?? 'video'}.mp4`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FFD84D] px-4 py-3 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition"
                      >
                        ⬇ {t('preview.saved.download')}
                      </a>
                      <a
                        href={generatedVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#FFE7A1] bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-[#FFF3B2] transition"
                      >
                        ↗ {t('preview.saved.openTab')}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How to */}
        <section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('howTo.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('howTo.title')}</h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="rounded-[28px] bg-white border border-[#FFE7A1] shadow-[0_30px_90px_rgba(255,216,77,0.35)] overflow-hidden flex flex-col hover:-translate-y-1 transition"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-[#FFD84D] text-slate-900 font-semibold flex items-center justify-center shadow-md mb-4">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">{t(`howTo.steps.${step}.title`)}</h3>
                  <p className="text-sm text-slate-600">{t(`howTo.steps.${step}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits — style showcase cards */}
        <section className="bg-gradient-to-b from-[#FFF7DA] via-white to-[#FFF7DA] text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('benefits.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('benefits.title')}</h2>
            <p className="text-slate-600 max-w-3xl">{t('benefits.subtitle')}</p>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
            {[
              {
                key: 1,
                icon: '🗺️',
                before: `${R2_BASE}/preset/ancient-dynasty.jpg`,
                after: `${R2_BASE}/preset/silk-road.jpg`,
              },
              {
                key: 2,
                icon: '📰',
                before: `${R2_BASE}/preset/newsreel-1940s.jpg`,
                after: `${R2_BASE}/preset/industrial-revolution.jpg`,
              },
              {
                key: 3,
                icon: '🚀',
                before: `${R2_BASE}/preset/age-of-exploration.jpg`,
                after: `${R2_BASE}/preset/space-race.jpg`,
              },
            ].map((card, index) => (
              <div
                key={card.key}
                className="grid gap-6 rounded-[32px] bg-white border border-[#FFE7A1] shadow-[0_35px_120px_rgba(250,212,87,0.35)] p-6 md:p-10 items-center md:grid-cols-2"
              >
                {(index === 0 || index === 2) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-[#FFF3B2]/40 aspect-[4/3] flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 p-3 w-full h-full">
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={card.before} alt="Style A" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{t('benefits.beforeLabel')}</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={card.after} alt="Style B" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{t('benefits.afterLabel')}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center text-xl text-[#C69312]">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">{t(`benefits.cards.${card.key}.title`)}</h3>
                  <p className="text-slate-600 text-sm">{t(`benefits.cards.${card.key}.desc`)}</p>
                </div>
                {index === 1 && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-[#FFF3B2]/40 aspect-[4/3] flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 p-3 w-full h-full">
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={card.before} alt="Style A" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{t('benefits.beforeLabel')}</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={card.after} alt="Style B" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{t('benefits.afterLabel')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-white text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('useCases.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('useCases.title')}</h2>
            <p className="text-slate-600 max-w-3xl mx-auto">{t('useCases.subtitle')}</p>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(['explainer', 'education', 'tiktok', 'documentary', 'family', 'brand', 'travel', 'fandom'] as const).map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-[0_15px_40px_rgba(247,201,72,0.15)] hover:-translate-y-1 transition"
              >
                <div className="text-3xl mb-3">{t(`useCases.items.${key}.icon`)}</div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{t(`useCases.items.${key}.title`)}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t(`useCases.items.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-gradient-to-b from-[#FFF7DA] to-white text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('features.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('features.title')}</h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {(['seedance', 'collage', 'customText', 'fast', 'commercial', 'privacy'] as const).map((key) => (
              <div
                key={key}
                className="rounded-[24px] bg-white border border-[#FFE7A1] p-6 shadow-[0_20px_60px_rgba(247,201,72,0.18)]"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#FFD84D] text-slate-900 flex items-center justify-center text-xl mb-4 shadow">
                  {t(`features.items.${key}.icon`)}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{t(`features.items.${key}.title`)}</h3>
                <p className="text-sm text-slate-600">{t(`features.items.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white text-slate-900">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="rounded-[36px] bg-gradient-to-br from-[#FFD84D] via-[#FFE062] to-[#FFF3B2] border border-[#FFE7A1] shadow-[0_40px_120px_rgba(247,201,72,0.45)] p-10 text-center space-y-5">
              <div className="text-4xl">📜</div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('cta.title')}</h2>
              <p className="text-slate-700 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
              <a
                href="#collage-upload-A"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition"
              >
                {t('cta.button')} <span>→</span>
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white text-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('faq.badge')}</p>
            <h2 className="text-3xl font-semibold">{t('faq.title')}</h2>
            <p className="text-slate-600">{t('faq.subtitle')}</p>
          </div>
          <div className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
            {[1, 2, 3, 4].map((index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-3xl border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-slate-900">{t(`faq.items.${index}.question`)}</span>
                    <span className="text-[#C69312] text-2xl">{isOpen ? '–' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-600">{t(`faq.items.${index}.answer`)}</div>
                  )}
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
