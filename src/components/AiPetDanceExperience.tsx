'use client';

import { ChangeEvent, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import LoginModal from './ui/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { availableTrialCredits } from '@/lib/payment/paid-trial';
import { useTranslations } from 'next-intl';
import PetDanceDemoWall from './pet-dance/PetDanceDemoWall';
import PetDanceFaq from './pet-dance/PetDanceFaq';
import PetDanceRelatedLinks, { type RelatedSection } from './pet-dance/PetDanceRelatedLinks';

export interface AiPetDancePreset {
  id: string;
  name: string;
  description: string;
  displaySrc: string;
  stillPrompt: string;
  prompt: string;
}

interface AiPetDanceExperienceProps {
  presets: AiPetDancePreset[];
  /** Preset ids shown in the zero-cost demo wall, in order. */
  demoPresetIds?: string[];
  /**
   * i18n namespace for page-specific copy (hero, howTo, faq, ...).
   * Each sibling page passes its own so the cluster avoids duplicate content.
   * The whole namespace is cloned from `aiPetDance`, so tool chrome stays in sync.
   */
  namespace?: string;
  /** Number of FAQ entries authored under `<namespace>.faq.items`. */
  faqCount?: number;
  /** Internal-link matrix to sibling pages — rendered above the CTA when present. */
  related?: RelatedSection;
}

type AspectRatio = '9:16' | '16:9';

const R2_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-pet-dance';
const SAMPLE_BEFORE_IMAGE = `${R2_BASE}/feature/sample-pet.jpg`;
const SAMPLE_AFTER_VIDEO = `${R2_BASE}/feature/sample-dance.mp4`;
const demoVideoSrc = (presetId: string) => `${R2_BASE}/demo/${presetId}.mp4`;

/** Step 1 — reuses the generic /api/generate-image endpoint (5 credits). */
const STILL_CREDITS = 5;
/** Step 2 — reuses /api/video/generate → Seedance (100 credits). */
const VIDEO_CREDITS = 100;

const CUSTOM_TEXT_MAX_LENGTH = 300;
const STILL_POLL_INTERVAL_MS = 5000;
const STILL_POLL_MAX_ATTEMPTS = 30;
const VIDEO_POLL_INTERVAL_MS = 5000;
const VIDEO_POLL_MAX_ATTEMPTS = 48;

type Stage = 'idle' | 'still' | 'video';

export default function AiPetDanceExperience({
  presets,
  demoPresetIds = [],
  namespace = 'aiPetDance',
  faqCount = 10,
  related,
}: AiPetDanceExperienceProps) {
  const t = useTranslations(namespace);
  const { user, profile, refreshProfile } = useAuth();

  const [petFile, setPetFile] = useState<File | null>(null);
  const [petPreview, setPetPreview] = useState<string | null>(null);
  const [petUploadedUrl, setPetUploadedUrl] = useState<string | null>(null);
  const [petFileName, setPetFileName] = useState<string | null>(null);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [customText, setCustomText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<AiPetDancePreset | null>(presets[0] ?? null);

  const [stage, setStage] = useState<Stage>('idle');
  const [stillImageUrl, setStillImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const demoPresets = demoPresetIds
    .map((id) => presets.find((p) => p.id === id))
    .filter((p): p is AiPetDancePreset => Boolean(p));

  const isBusy = stage !== 'idle';

  const resetOutputs = () => {
    setStillImageUrl(null);
    setGeneratedVideoUrl(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPetFile(file);
      setPetPreview(e.target?.result as string);
      setPetFileName(file.name);
      setPetUploadedUrl(null);
    };
    reader.readAsDataURL(file);
    resetOutputs();
    setError(null);
  };

  const clearPet = () => {
    setPetFile(null);
    setPetPreview(null);
    setPetUploadedUrl(null);
    setPetFileName(null);
    resetOutputs();
  };

  const uploadIfNeeded = async (): Promise<string> => {
    if (petUploadedUrl) return petUploadedUrl;
    if (!petFile) throw new Error('no file');

    const formData = new FormData();
    formData.append('file', petFile);
    const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(json.error || 'upload failed');
    }
    const json = await response.json();
    if (!json.imageUrl) throw new Error('upload returned no url');
    setPetUploadedUrl(json.imageUrl as string);
    return json.imageUrl as string;
  };

  /** Shared guard for both steps. Returns an access token, or null if blocked. */
  const requireSession = async (creditsNeeded: number): Promise<string | null> => {
    if (!petPreview) {
      setError(t('error.upload'));
      return null;
    }
    if (!selectedPreset) {
      setError(t('error.preset'));
      return null;
    }
    if (!user) {
      setShowLoginModal(true);
      return null;
    }
    if (!profile || (profile.credits || 0) + (creditsNeeded === VIDEO_CREDITS ? availableTrialCredits(profile.videoTrial) : 0) < creditsNeeded) {
      setError(t('error.credits', { required: creditsNeeded }));
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      setShowLoginModal(true);
      return null;
    }
    return accessToken;
  };

  /** Step 1 — dance-pose still via the generic image endpoint. */
  const handleGenerateStill = async () => {
    setError(null);
    const accessToken = await requireSession(STILL_CREDITS);
    if (!accessToken || !selectedPreset) return;

    setStage('still');
    resetOutputs();

    try {
      let petUrl: string;
      try {
        petUrl = await uploadIfNeeded();
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : 'unknown';
        setError(t('error.uploadFailed', { msg }));
        return;
      }

      const extra = customText.trim();
      const finalPrompt = extra
        ? `${selectedPreset.stillPrompt} Additional user details: ${extra}`
        : selectedPreset.stillPrompt;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrls: [petUrl],
          aspectRatio,
          metadata: { petDanceStyle: selectedPreset.name },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) setShowLoginModal(true);
        else if (response.status === 402) setError(t('error.credits', { required: data.required ?? STILL_CREDITS }));
        else setError(data.message || data.error || t('error.generic'));
        return;
      }

      const taskId: string | undefined = data.taskId;
      if (!taskId) {
        setError(t('error.generic'));
        return;
      }

      for (let attempt = 1; attempt <= STILL_POLL_MAX_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, STILL_POLL_INTERVAL_MS));
        const statusResponse = await fetch(`/api/kie/task-status?taskId=${encodeURIComponent(taskId)}`, {
          cache: 'no-store',
        });
        if (!statusResponse.ok) continue;
        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          const url: string | undefined = statusData.resultUrls?.[0];
          if (!url) {
            setError(t('error.generic'));
            return;
          }
          setStillImageUrl(url);
          await refreshProfile();
          return;
        }
        if (statusData.status === 'failed') {
          setError(statusData.error || t('error.generic'));
          return;
        }
      }

      setError(t('error.timeout'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(t('error.network', { msg }));
    } finally {
      setStage('idle');
    }
  };

  /** Step 2 — animate via the existing Seedance video pipeline. */
  const handleGenerateVideo = async () => {
    setError(null);
    const accessToken = await requireSession(VIDEO_CREDITS);
    if (!accessToken || !selectedPreset) return;

    setStage('video');
    setGeneratedVideoUrl(null);

    try {
      // The dance-pose still makes a far better first frame than a raw snapshot,
      // but it is optional — a plain pet photo works too.
      let sourceUrl: string;
      if (stillImageUrl) {
        sourceUrl = stillImageUrl;
      } else {
        try {
          sourceUrl = await uploadIfNeeded();
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'unknown';
          setError(t('error.uploadFailed', { msg }));
          return;
        }
      }

      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          effectType: 'ai-pet-dance',
          presetId: selectedPreset.id,
          sourceImageUrl: sourceUrl,
          referenceImageUrls: [sourceUrl],
          aspectRatio,
          customText: customText.trim() || undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        if (response.status === 401) setShowLoginModal(true);
        else if (response.status === 402) setError(t('error.credits', { required: json.required ?? VIDEO_CREDITS }));
        else setError(json.error || t('error.generic'));
        return;
      }

      const taskId: string | undefined = json.data?.taskId;
      if (!taskId) {
        setError(t('error.generic'));
        return;
      }

      for (let attempt = 1; attempt <= VIDEO_POLL_MAX_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, VIDEO_POLL_INTERVAL_MS));
        const statusResponse = await fetch(
          `/api/video/task-status?taskId=${encodeURIComponent(taskId)}`,
          { cache: 'no-store', headers: { Authorization: `Bearer ${accessToken}` } }
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
      setStage('idle');
    }
  };

  const showingSample = !petPreview && !stillImageUrl && !generatedVideoUrl && !isBusy;
  const posterImage = stillImageUrl || petPreview || SAMPLE_BEFORE_IMAGE;
  const displayVideoUrl = generatedVideoUrl ?? (showingSample ? SAMPLE_AFTER_VIDEO : null);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-[#FFFBEA] to-white text-slate-900 pb-16">
        {/* ===== Tool ===== */}
        <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            {/* Left — controls */}
            <div className="rounded-[32px] border border-[#FFE58F] bg-white/90 shadow-[0_40px_120px_rgba(247,201,72,0.25)] p-6 sm:p-10 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFD84D] text-lg shadow-lg">🐕</div>
                {t('hero.badge')}
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                  {t('hero.title')}
                </h1>
                <p className="text-base text-slate-600">{t('hero.subtitle')}</p>
              </div>

              {/* Pet photo */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{t('input.upload.label')}</p>
                  {petPreview && (
                    <button type="button" onClick={clearPet} className="text-xs text-[#C69312] hover:underline">
                      {t('input.upload.clear')}
                    </button>
                  )}
                </div>

                {petPreview ? (
                  <label
                    htmlFor="pet-dance-upload"
                    className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed border-[#F5C04B]"
                  >
                    <Image src={petPreview} alt={petFileName ?? 'pet'} fill sizes="480px" className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-xs font-semibold text-white opacity-0 transition group-hover:bg-slate-900/30 group-hover:opacity-100">
                      {t('input.upload.replace')}
                    </div>
                  </label>
                ) : (
                  <label
                    htmlFor="pet-dance-upload"
                    className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#F5C04B] bg-[#FFFBF0] transition hover:bg-[#FFF4CC]"
                  >
                    <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-[#FFD84D] text-slate-900 shadow">+</div>
                    <p className="text-sm font-semibold text-slate-700">{t('input.upload.button')}</p>
                    <p className="mt-1 px-6 text-center text-[11px] text-slate-500">{t('input.upload.hint')}</p>
                  </label>
                )}

                <input type="file" accept="image/*" id="pet-dance-upload" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Aspect ratio */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">{t('input.aspect.label')}</p>
                <div className="inline-flex rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-1 shadow-inner">
                  {(['9:16', '16:9'] as const).map((ratio) => {
                    const active = aspectRatio === ratio;
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          active ? 'bg-[#FFD84D] text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {ratio === '9:16' ? `📱 ${t('input.aspect.portrait')}` : `🖥 ${t('input.aspect.landscape')}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dance style */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>{t('input.preset.label')}</span>
                  <span className="hidden text-xs text-[#C69312] sm:block">{t('input.preset.swipe')}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:hidden">
                  {presets.map((preset) => {
                    const isSelected = selectedPreset?.id === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset)}
                        className={`flex flex-col items-center rounded-2xl border-2 px-2 pb-2 pt-2 transition ${
                          isSelected
                            ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                            : 'border-transparent bg-white text-slate-500'
                        }`}
                      >
                        <div className={`relative h-14 w-full overflow-hidden rounded-xl border ${isSelected ? 'border-[#F0A202]' : 'border-gray-100'}`}>
                          <Image src={preset.displaySrc} alt={preset.name} fill sizes="80px" className="object-cover" />
                        </div>
                        <div className={`mt-2 line-clamp-2 text-center text-[10px] font-semibold leading-tight ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                          {preset.name}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] sm:block">
                  <div className="inline-flex gap-3 pr-6">
                    {presets.map((preset) => {
                      const isSelected = selectedPreset?.id === preset.id;
                      return (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => setSelectedPreset(preset)}
                          className={`flex w-[110px] flex-shrink-0 flex-col items-center rounded-2xl border-2 px-2 pb-2 pt-2 transition ${
                            isSelected
                              ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                              : 'border-transparent bg-white text-slate-500'
                          }`}
                        >
                          <div className={`relative h-20 w-full overflow-hidden rounded-xl border ${isSelected ? 'border-[#F0A202]' : 'border-gray-100'}`}>
                            <Image src={preset.displaySrc} alt={preset.name} fill sizes="110px" className="object-cover" />
                          </div>
                          <div className={`mt-2 text-center text-[11px] font-semibold leading-tight ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                            {preset.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 text-xs text-slate-700">
                  <p className="mb-1 font-semibold text-slate-900">{t('input.preset.summary.title')}</p>
                  <p>
                    {selectedPreset
                      ? t('input.preset.summary.selected', { name: selectedPreset.name, desc: selectedPreset.description })
                      : t('input.preset.summary.none')}
                  </p>
                </div>
              </div>

              {/* Optional details */}
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

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              {/* Two-step actions */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-[#FFD84D] text-xs font-bold text-slate-900">1</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('input.steps.still.title')}</p>
                      <p className="text-xs text-slate-600">{t('input.steps.still.desc')}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerateStill}
                    loading={stage === 'still'}
                    disabled={isBusy}
                    className="w-full rounded-2xl bg-[#FFD84D] px-6 py-3 text-base font-semibold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                  >
                    {stage === 'still' ? t('input.button.stillGenerating') : t('input.button.still')}
                  </Button>
                  <p className="mt-2 text-center text-xs text-slate-500">
                    {t('input.button.credits', { count: STILL_CREDITS })}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 transition ${stillImageUrl ? 'border-[#F0A202] bg-[#FFF4CC]' : 'border-[#FFE7A1] bg-[#FFFBF0]'}`}>
                  <div className="mb-3 flex items-start gap-3">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('input.steps.video.title')}</p>
                      <p className="text-xs text-slate-600">{t('input.steps.video.desc')}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerateVideo}
                    loading={stage === 'video'}
                    disabled={isBusy}
                    className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    {stage === 'video' ? t('input.button.videoGenerating') : t('input.button.video')}
                  </Button>
                  <p className="mt-2 text-center text-xs text-slate-500">
                    {t('input.button.credits', { count: VIDEO_CREDITS })}
                  </p>
                </div>
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

            {/* Right — preview */}
            <div className="relative lg:sticky lg:top-24">
              <div className="rounded-[36px] border border-[#FFE7A1] bg-white p-4 shadow-[0_40px_140px_rgba(196,147,18,0.25)]">
                <div className={`relative w-full overflow-hidden rounded-[28px] bg-gray-200 ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}>
                  {displayVideoUrl ? (
                    <video
                      key={displayVideoUrl}
                      src={displayVideoUrl}
                      poster={posterImage}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full bg-black object-contain"
                    />
                  ) : (
                    <Image
                      src={posterImage}
                      alt={t('preview.placeholderAlt')}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain"
                      priority
                    />
                  )}

                  {isBusy && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                      <div className="relative">
                        <div className="h-20 w-20 animate-spin rounded-full border-4 border-[#FFE7A1]/30 border-t-[#FFD84D]" />
                        <div className="absolute inset-0 h-20 w-20 rounded-full bg-[#FFD84D]/20 blur-xl" />
                      </div>
                      <div className="mt-6 space-y-2 text-center">
                        <p className="text-lg font-semibold text-white">
                          {stage === 'still' ? t('preview.loading.still') : t('preview.loading.video')}
                        </p>
                        <p className="text-sm text-[#FFE7A1]">{t('preview.loading.subtitle')}</p>
                      </div>
                    </div>
                  )}

                  {showingSample && (
                    <span className="absolute left-6 top-6 rounded-full bg-[#FFD84D] px-3 py-1 text-xs font-semibold text-slate-900 shadow">
                      {t('preview.sampleHint')}
                    </span>
                  )}
                  {!isBusy && stillImageUrl && !generatedVideoUrl && (
                    <span className="absolute left-6 top-6 rounded-full bg-[#F0A202] px-3 py-1 text-xs font-semibold text-white shadow">
                      {t('preview.labels.still')}
                    </span>
                  )}
                  {generatedVideoUrl && (
                    <span className="absolute left-6 top-6 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                      {t('preview.labels.result')}
                    </span>
                  )}
                </div>
              </div>

              {stillImageUrl && !generatedVideoUrl && !isBusy && (
                <div className="mt-6 rounded-[28px] border border-[#F0A202] bg-[#FFF4CC] p-5 text-center">
                  <p className="text-sm font-semibold text-slate-900">{t('preview.stillReady.title')}</p>
                  <p className="mt-1 text-xs text-slate-600">{t('preview.stillReady.subtitle')}</p>
                </div>
              )}

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
                        download={`ai-pet-dance-${selectedPreset?.id ?? 'video'}.mp4`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FFD84D] px-4 py-3 text-sm font-semibold text-slate-900 shadow transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                      >
                        ⬇ {t('preview.saved.download')}
                      </a>
                      <a
                        href={generatedVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#FFE7A1] bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#FFF3B2]"
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

        <PetDanceDemoWall presets={demoPresets} demoVideoSrc={demoVideoSrc} namespace={namespace} />

        {/* ===== How to ===== */}
        <section className="bg-[#FFF7DA] text-slate-900">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-16 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('howTo.badge')}</p>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('howTo.title')}</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="flex flex-col overflow-hidden rounded-[28px] border border-[#FFE7A1] bg-white shadow-[0_30px_90px_rgba(255,216,77,0.35)] transition hover:-translate-y-1"
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

        {/* ===== Use cases ===== */}
        <section className="bg-white text-slate-900">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-16 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('useCases.badge')}</p>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('useCases.title')}</h2>
            <p className="mx-auto max-w-3xl text-slate-600">{t('useCases.subtitle')}</p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
            {(['tiktok', 'birthday', 'memorial', 'gift', 'reels', 'petAccount', 'invite', 'holiday'] as const).map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-[0_15px_40px_rgba(247,201,72,0.15)] transition hover:-translate-y-1"
              >
                <div className="mb-3 text-3xl">{t(`useCases.items.${key}.icon`)}</div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">{t(`useCases.items.${key}.title`)}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{t(`useCases.items.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Features ===== */}
        <section className="bg-gradient-to-b from-[#FFF7DA] to-white text-slate-900">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-16 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('features.badge')}</p>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('features.title')}</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-3">
            {(['identity', 'styles', 'twoStep', 'audio', 'fast', 'privacy'] as const).map((key) => (
              <div key={key} className="rounded-[24px] border border-[#FFE7A1] bg-white p-6 shadow-[0_20px_60px_rgba(247,201,72,0.18)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFD84D] text-xl text-slate-900 shadow">
                  {t(`features.items.${key}.icon`)}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{t(`features.items.${key}.title`)}</h3>
                <p className="text-sm text-slate-600">{t(`features.items.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {related && <PetDanceRelatedLinks section={related} />}

        {/* ===== CTA ===== */}
        <section className="bg-white text-slate-900">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="space-y-5 rounded-[36px] border border-[#FFE7A1] bg-gradient-to-br from-[#FFD84D] via-[#FFE062] to-[#FFF3B2] p-10 text-center shadow-[0_40px_120px_rgba(247,201,72,0.45)]">
              <div className="text-4xl">🕺</div>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t('cta.title')}</h2>
              <p className="mx-auto max-w-2xl text-slate-700">{t('cta.subtitle')}</p>
              <a
                href="#pet-dance-upload"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5"
              >
                {t('cta.button')} <span>→</span>
              </a>
            </div>
          </div>
        </section>

        <PetDanceFaq namespace={namespace} count={faqCount} />
      </main>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
