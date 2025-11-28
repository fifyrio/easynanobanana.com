'use client';

import { ChangeEvent, useRef, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import ImagePreviewModal from './ui/ImagePreviewModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

export interface PresetAsset {
  displaySrc: string;
  referenceSrc: string;
  fileName: string;
  name: string;
}

interface AiAnimeGeneratorExperienceProps {
  stylePresets: PresetAsset[];
  effectPresets: PresetAsset[];
}

const beforeImage = '/images/showcases/ai-anime-generator/feature/before.webp';
const afterImage = '/images/showcases/ai-anime-generator/feature/after.webp';

export default function AiAnimeGeneratorExperience({ stylePresets, effectPresets }: AiAnimeGeneratorExperienceProps) {
  const t = useTranslations('aiAnimeGenerator');
  const { user, profile, refreshProfile } = useAuth();
  
  const promptSuggestions = [1, 2, 3, 4].map(i => t(`input.custom.suggestions.${i}`));

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(promptSuggestions[0]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [selectedStyle, setSelectedStyle] = useState<PresetAsset | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<PresetAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [styleShowcaseId, setStyleShowcaseId] = useState('anime');
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const creditsRequired = 5;

  const styleShowcaseOptions = [
    { id: 'anime', image: '/images/showcases/ai-anime-generator/feature/after.webp' },
    { id: 'ghibli', image: '/images/showcases/ai-anime-generator/feature/ghibli.jpg' },
    { id: 'pixel', image: '/images/showcases/ai-anime-generator/feature/pixel.jpg' },
    { id: 'watercolor', image: '/images/showcases/ai-anime-generator/feature/watercolor.jpg' },
    { id: 'webtoon', image: '/images/showcases/ai-anime-generator/feature/webtoon.jpg' },
  ];

  const testimonialQuotes = [1, 2, 3].map(i => ({
    id: i,
    name: t(`testimonials.items.${i}.name`),
    role: t(`testimonials.items.${i}.role`),
    avatar: i === 1 ? '/images/showcases/ai-anime-generator/feature/after.webp' : i === 2 ? '/images/showcases/ai-anime-generator/feature/ghibli.jpg' : '/images/showcases/ai-anime-generator/feature/webtoon.jpg',
    content: t(`testimonials.items.${i}.content`),
  }));

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadedFileName(null);
      setUploadedImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setUploadedFileName(file.name);
  };

  const handlePromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const cycleTestimonial = (direction: 'prev' | 'next') => {
    setTestimonialIndex((prev) => {
      if (testimonialQuotes.length === 0) return 0;
      if (direction === 'prev') {
        return (prev - 1 + testimonialQuotes.length) % testimonialQuotes.length;
      }
      return (prev + 1) % testimonialQuotes.length;
    });
  };

  const buildPrompt = () => {
    if (activeTab === 'preset') {
      const styleText = selectedStyle
        ? `Convert the subject into ${selectedStyle.name} anime style`
        : 'Convert the subject into stylized anime art';
      const effectText = selectedEffect ? ` with ${selectedEffect.name} finish` : '';
      return `${styleText}${effectText}. Keep their face, skin texture, and pose identical.`;
    }
    return `Transform this portrait into anime art: ${prompt}. Keep their face, expression, and lighting consistent.`;
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError(t('error.upload'));
      return;
    }

    if (!user) {
      setError(t('error.signIn'));
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(t('error.credits', { required: creditsRequired }));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const presetDetails =
        activeTab === 'preset'
          ? {
              style: selectedStyle ? selectedStyle.name : 'default anime style',
              effect: selectedEffect ? selectedEffect.name : 'clean finish',
            }
          : null;

      const promptText = buildPrompt();
      const detailHint =
        activeTab === 'preset'
          ? `Match the vibe of "${presetDetails?.style}" and keep the "${presetDetails?.effect}" treatment consistent.`
          : '';
      const finalPrompt = `${promptText} ${detailHint} Deliver a high-fidelity anime illustration inspired by Nano Banana. Preserve the subject's identity, proportions, and clothing while enhancing only the artistic style.`;

      const imageUrls = [uploadedImage];

      console.log('Sending request to generate image...');
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: 'gemini-2.0-flash',
          imageUrls,
          metadata: presetDetails || undefined,
        }),
      });

      console.log('Response received, status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        if (response.status === 401) {
          setError(t('error.signIn'));
        } else if (response.status === 402) {
          setError(t('error.credits', { required: data.required }));
        } else if (response.status === 503) {
          setError(data.message || 'Service temporarily unavailable. Please try again in a moment.');
        } else {
          setError(data.error || 'Failed to generate anime artwork.');
        }
        return;
      }

      if (!data.imageUrl) {
        console.error('No imageUrl in response:', data);
        setError('Image generation completed but no image URL received. Please try again.');
        return;
      }

      console.log('Setting generated image:', data.imageUrl);
      setGeneratedImage(data.imageUrl);
      setDescription(data.description);
      setSliderPosition(50);
      await refreshProfile();
    } catch (err: any) {
      console.error('Error generating anime art:', err);

      // Provide more specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. The server may be busy, please try again.');
      } else {
        setError('Failed to generate anime artwork. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSliderPosition = (clientX: number) => {
    const container = comparisonRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    updateSliderPosition(clientX);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    updateSliderPosition(clientX);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const beforeDisplayImage = uploadedImage || beforeImage;
  const afterDisplayImage = generatedImage || afterImage;
  const beforeTag = uploadedImage ? t('preview.labels.original') : t('preview.labels.before');
  const afterTag = generatedImage ? t('preview.labels.result') : t('preview.labels.after');
  const activeStyleShowcase = styleShowcaseOptions.find((style) => style.id === styleShowcaseId) || styleShowcaseOptions[0];
  const activeTestimonial = testimonialQuotes[testimonialIndex % testimonialQuotes.length];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-[#FFFBEA] to-white text-slate-900 pb-16">
        <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            {/* Left column */}
            <div className="rounded-[32px] border border-[#FFE58F] bg-white/90 shadow-[0_40px_120px_rgba(247,201,72,0.25)] p-6 sm:p-10 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFD84D] text-lg shadow-lg">
                  🎨
                </div>
                {t('hero.badge')}
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                  {t('hero.title')}
                </h1>
                <p className="text-base text-slate-600">
                  {t('hero.subtitle')}
                </p>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-inner">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('input.upload.label')}</p>
                      <p className="text-xs text-slate-500">
                        {t('input.upload.format')}
                      </p>
                    </div>
                    <label
                      htmlFor="anime-upload"
                      className="cursor-pointer rounded-full bg-[#FFD84D] px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition"
                    >
                      {t('input.upload.button')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      id="anime-upload"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  {uploadedFileName ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#F5C04B] bg-white/80 px-3 py-2 text-sm font-medium text-slate-700">
                      {uploadedFileName}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#F5C04B]/70 px-3 py-2 text-sm text-slate-500">
                      {t('input.upload.placeholder')}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-4 inline-flex rounded-full border border-[#FFE7A1] bg-[#FFF9E6] p-1 text-sm font-semibold text-slate-900">
                    {(['preset', 'custom'] as const).map((tabKey) => (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => setActiveTab(tabKey)}
                        className={`px-5 py-1.5 rounded-full transition ${
                          activeTab === tabKey ? 'bg-[#FFD84D] text-slate-900 shadow' : 'text-slate-500'
                        }`}
                      >
                        {t(`input.tabs.${tabKey}`)}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'custom' ? (
                    <>
                      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                        <span>{t('input.custom.label')}</span>
                        <span className="text-[#C69312]">{t('input.custom.inspo')}</span>
                      </div>
                      <textarea
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-[#FFE7A1] bg-white/90 p-4 text-sm text-slate-700 placeholder-slate-400 focus:border-[#F0BF43] focus:ring-2 focus:ring-[#FFE58F]/80"
                        placeholder={t('input.custom.placeholder')}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {promptSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handlePromptSuggestion(suggestion)}
                            className="rounded-full border border-[#FFE7A1] bg-white px-4 py-1 text-xs font-semibold text-slate-700 hover:bg-[#FFF3B2]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span>{t('input.preset.style.label')}</span>
                          <span className="text-xs text-[#C69312]">{t('input.preset.style.swipe')}</span>
                        </div>
                        <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                          <div className="grid grid-rows-2 auto-cols-[90px] grid-flow-col gap-3 pr-6">
                            <button
                              type="button"
                              onClick={() => setSelectedStyle(null)}
                              className={`flex w-[90px] flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
                                selectedStyle === null
                                  ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                  : 'border-transparent bg-white'
                              }`}
                            >
                              <div className="flex h-16 w-full items-center justify-center rounded-xl bg-[#FFF3B2] text-xs font-semibold text-[#C69312]">
                                {t('input.preset.style.none')}
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                {t('input.preset.style.keep')}
                              </div>
                            </button>
                            {stylePresets.map((preset) => {
                              const isSelected = selectedStyle?.referenceSrc === preset.referenceSrc;
                              return (
                                <button
                                  type="button"
                                  key={preset.referenceSrc}
                                  onClick={() => setSelectedStyle(preset)}
                                  className={`flex w-[90px] flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
                                    isSelected
                                      ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                      : 'border-transparent bg-white text-slate-500'
                                  }`}
                                >
                                  <div
                                    className={`relative h-16 w-full overflow-hidden rounded-xl border ${
                                      isSelected ? 'border-[#F0A202]' : 'border-gray-100'
                                    }`}
                                  >
                                    <Image
                                      src={preset.displaySrc}
                                      alt={preset.name}
                                      fill
                                      sizes="90px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div
                                    className={`mt-2 text-[10px] font-semibold text-center leading-tight ${
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
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span>{t('input.preset.effect.label')}</span>
                          <span className="text-xs text-[#C69312]">{t('input.preset.effect.swipe')}</span>
                        </div>
                        <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                          <div className="flex gap-3 pr-6">
                            <button
                              type="button"
                              onClick={() => setSelectedEffect(null)}
                              className={`flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 transition ${
                                selectedEffect === null
                                  ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                  : 'border-transparent bg-white'
                              }`}
                            >
                              <div className="flex h-14 w-full items-center justify-center rounded-xl bg-[#FFF3B2] text-xs font-semibold text-[#C69312]">
                                {t('input.preset.effect.none')}
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                {t('input.preset.effect.original')}
                              </div>
                            </button>
                            {effectPresets.map((preset) => {
                              const isSelected = selectedEffect?.referenceSrc === preset.referenceSrc;
                              return (
                                <button
                                  type="button"
                                  key={preset.referenceSrc}
                                  onClick={() => setSelectedEffect(preset)}
                                  className={`relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                                    isSelected
                                      ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <Image
                                    src={preset.displaySrc}
                                    alt={preset.name}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                  <div
                                    className={`absolute inset-x-2 bottom-2 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-center ${
                                      isSelected ? 'bg-white text-slate-900' : 'bg-white/85 text-slate-600'
                                    }`}
                                  >
                                    {preset.name}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900 mb-1">{t('input.preset.summary.title')}</p>
                        <p>{selectedStyle ? t('input.preset.summary.style', { name: selectedStyle.name }) : t('input.preset.summary.style', { name: t('input.preset.summary.none') })}</p>
                        <p>{selectedEffect ? t('input.preset.summary.effect', { name: selectedEffect.name }) : t('input.preset.summary.effect', { name: t('input.preset.summary.none') })}</p>
                      </div>
                    </div>
                  )}
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
                  {t('input.button.credits', { count: creditsRequired })}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.styles.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.styles.label')}</div>
                </div>
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.time.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.time.label')}</div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="relative">
              <div className="rounded-[36px] border border-[#FFE7A1] bg-white shadow-[0_40px_140px_rgba(196,147,18,0.25)] p-4">
                <div
                  ref={comparisonRef}
                  className="relative aspect-square w-full overflow-hidden rounded-[28px] bg-gray-200 select-none"
                  onMouseDown={(event) => handleDragStart(event.clientX)}
                  onMouseMove={(event) => handleDragMove(event.clientX)}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
                  onTouchMove={(event) => handleDragMove(event.touches[0].clientX)}
                  onTouchEnd={handleDragEnd}
                  role="presentation"
                >
                  <Image
                    src={afterDisplayImage}
                    alt="AI generated anime preview"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain"
                    priority
                  />
                  <div
                    className="absolute inset-0 left-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={beforeDisplayImage}
                        alt="Original photo"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>

                  {/* Loading overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <div className="relative">
                        {/* Spinning circle */}
                        <div className="w-20 h-20 rounded-full border-4 border-[#FFE7A1]/30 border-t-[#FFD84D] animate-spin"></div>
                        {/* Inner glow */}
                        <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#FFD84D]/20 blur-xl"></div>
                      </div>
                      <div className="mt-6 text-center space-y-2">
                        <p className="text-white font-semibold text-lg">{t('preview.loading.title')}</p>
                        <p className="text-[#FFE7A1] text-sm">{t('preview.loading.subtitle')}</p>
                      </div>
                      {/* Animated dots */}
                      <div className="flex gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  )}

                  <div
                    className="absolute inset-y-6 w-px bg-white"
                    style={{
                      left: `calc(${sliderPosition}% - 0.5px)`,
                      boxShadow: '0 0 25px rgba(255,255,255,0.8)',
                    }}
                  />
                  <div
                    className="absolute top-1/2 -mt-6 h-12 w-12 -translate-x-1/2 rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-2xl flex items-center justify-center cursor-[ew-resize]"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    ⇆
                  </div>
                  <span className="absolute left-8 top-8 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600">
                    {beforeTag}
                  </span>
                  <span className="absolute right-8 top-8 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                    {afterTag}
                  </span>

                  {/* Magnifying glass button - only show when there's a generated image */}
                  {generatedImage && (
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="absolute bottom-6 right-6 flex items-center justify-center w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#FFE7A1] text-slate-700 hover:bg-[#FFD84D] hover:text-slate-900 hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-xl group"
                      aria-label={t('preview.viewFull')}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                        />
                      </svg>
                      <span className="absolute -top-8 right-0 bg-slate-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {t('preview.viewFull')}
                      </span>
                    </button>
                  )}
                </div>
              </div>
              {generatedImage && (
                <div className="mt-6 rounded-[28px] border border-[#FFE7A1] bg-white/90 p-5 shadow-[0_20px_60px_rgba(247,201,72,0.2)]">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('preview.saved.title')}</p>
                      <p className="text-xs text-slate-500">{t('preview.saved.subtitle')}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <FreeOriginalDownloadButton
                        imageUrl={generatedImage}
                        filename="ai-anime.png"
                        className="flex-1 justify-center bg-[#FFD84D] text-slate-900 hover:bg-[#ffe062]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-[#FFE7A1] text-slate-900 hover:bg-[#FFF3B2]"
                        onClick={() => setShowShareModal(true)}
                      >
                        {t('preview.saved.share')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="bg-white text-slate-900 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('features.badge')}</p>
              <h2 className="text-3xl sm:text-4xl font-semibold">{t('features.title')}</h2>
              <p className="text-slate-600">
                {t('features.subtitle')}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: '🧑‍🎨', key: '1' },
                { icon: '💾', key: '2' },
                { icon: '📚', key: '3' },
                { icon: '⚡', key: '4' },
              ].map((card) => (
                <div
                  key={card.key}
                  className="rounded-3xl border border-[#FFE7A1] bg-white/80 p-6 shadow-[0_20px_60px_rgba(255,216,77,0.25)]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center text-xl text-[#C69312]">
                    {card.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{t(`features.cards.${card.key}.title`)}</h3>
                  <p className="mt-2 text-sm text-slate-600">{t(`features.cards.${card.key}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#FFF9E6] text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
            <div className="text-center space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('styleShowcase.badge')}</p>
              <h2 className="text-3xl font-semibold">{t('styleShowcase.title')}</h2>
              <p className="text-slate-600">{t('styleShowcase.subtitle')}</p>
            </div>
            <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
              <div className="space-y-3">
                {styleShowcaseOptions.map((style) => {
                  const isActive = style.id === styleShowcaseId;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setStyleShowcaseId(style.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        isActive ? 'border-[#FFD84D] bg-white shadow-[0_15px_45px_rgba(255,216,77,0.3)]' : 'border-transparent bg-white/70'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{t(`styleShowcase.options.${style.id}.name`)}</p>
                      <p className="text-xs text-slate-600 mt-1">{t(`styleShowcase.options.${style.id}.desc`)}</p>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-[32px] border border-[#FFE7A1] bg-white/90 shadow-[0_30px_90px_rgba(247,201,72,0.25)] p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] border border-[#FFE7A1]">
                    <Image
                      src={beforeImage}
                      alt="Original portrait"
                      fill
                      sizes="(min-width: 768px) 40vw, 100vw"
                      className="object-cover"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                      {t('preview.labels.original')}
                    </span>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] border border-[#FFE7A1] bg-slate-100">
                    <Image
                      src={activeStyleShowcase?.image || afterImage}
                      alt={t(`styleShowcase.options.${activeStyleShowcase.id}.name`)}
                      fill
                      sizes="(min-width: 768px) 40vw, 100vw"
                      className="object-cover"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-[#FFD84D] px-3 py-1 text-xs font-semibold text-slate-900">
                      {t(`styleShowcase.options.${activeStyleShowcase.id}.name`)}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    className="rounded-full bg-[#FFD84D] text-slate-900 px-6 py-2 font-semibold hover:bg-[#ffe062]"
                    onClick={() => {
                      setActiveTab('preset');
                      if (stylePresets.length) {
                        // Simple logic to find matching preset, might need refinement if names vary greatly
                        const match = stylePresets.find((preset) =>
                          preset.name.toLowerCase().includes((t(`styleShowcase.options.${activeStyleShowcase.id}.name`)).split(' ')[0].toLowerCase())
                        );
                        setSelectedStyle(match || null);
                      }
                    }}
                  >
                    {t('styleShowcase.cta')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('howTo.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('howTo.title')}</h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {[
              {
                step: 1,
                image: '/images/showcases/ai-anime-generator/feature/step-1.jpg',
              },
              {
                step: 2,
                image: '/images/showcases/ai-anime-generator/feature/step-2.jpg',
              },
              {
                step: 3,
                image: '/images/showcases/ai-anime-generator/feature/step-3.jpg',
              },
            ].map((card) => (
              <div
                key={card.step}
                className="rounded-[28px] bg-white border border-[#FFE7A1] shadow-[0_30px_90px_rgba(255,216,77,0.35)] overflow-hidden flex flex-col hover:-translate-y-1 transition"
              >
                <div className="bg-[#FFF3B2]/40">
                  <div className="relative aspect-[4/3] rounded-[24px] m-4 overflow-hidden border border-[#FFE7A1]">
                    <Image
                      src={card.image}
                      alt={t(`howTo.steps.${card.step}.title`)}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-[#FFD84D] text-slate-900 font-semibold flex items-center justify-center shadow-md mb-4">
                    {card.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">{t(`howTo.steps.${card.step}.title`)}</h3>
                  <p className="text-sm text-slate-600">{t(`howTo.steps.${card.step}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-b from-[#FFF7DA] via-white to-[#FFF7DA] text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('benefits.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('benefits.title')}</h2>
            <p className="text-slate-600 max-w-3xl">
              {t('benefits.subtitle')}
            </p>
            <button className="text-slate-900 font-semibold inline-flex items-center gap-2 border border-[#FFE7A1] bg-white rounded-full px-5 py-3 shadow-[0_15px_40px_rgba(255,216,77,0.3)] hover:-translate-y-0.5 transition">
              {t('benefits.cta')}
              <span>→</span>
            </button>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
            {[
              {
                key: 1,
                image: '/images/showcases/ai-anime-generator/feature/showcase-1.jpg',
                icon: '🌟',
              },
              {
                key: 2,
                image: '/images/showcases/ai-anime-generator/feature/ghibli.jpg',
                icon: '🎨',
              },
              {
                key: 3,
                image: '/images/showcases/ai-anime-generator/feature/pixel.jpg',
                icon: '🕹️',
              },
            ].map((card, index) => (
              <div
                key={card.key}
                className={`grid gap-6 rounded-[32px] bg-white border border-[#FFE7A1] shadow-[0_35px_120px_rgba(250,212,87,0.35)] p-6 md:p-10 items-center ${
                  index === 0 ? 'md:grid-cols-[1.1fr_0.9fr]' : 'md:grid-cols-2'
                }`}
              >
                {(index === 0 || index === 2) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1]">
                    <Image
                      src={card.image}
                      alt={t(`benefits.cards.${card.key}.title`)}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center text-xl text-[#C69312]">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">{t(`benefits.cards.${card.key}.title`)}</h3>
                  <p className="text-slate-600 text-sm">{t(`benefits.cards.${card.key}.desc`)}</p>
                  <button className="inline-flex items-center gap-2 bg-[#FFD84D] text-slate-900 px-4 py-2 rounded-xl font-semibold shadow hover:-translate-y-0.5 transition">
                    {t(`benefits.cards.${card.key}.cta`)}
                    <span>→</span>
                  </button>
                </div>
                {(index === 1) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-white p-4">
                    <Image
                      src={card.image}
                      alt={t(`benefits.cards.${card.key}.title`)}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover rounded-[24px]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('testimonials.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('testimonials.title')}</h2>
            <p className="text-slate-600">
              {t('testimonials.subtitle')}
            </p>
          </div>
          <div className="max-w-3xl mx-auto px-4 pb-16">
            <div className="rounded-[32px] border border-[#FFE7A1] bg-white p-8 shadow-[0_30px_90px_rgba(247,201,72,0.25)] text-center space-y-6">
              <p className="text-xl text-slate-700 leading-relaxed">“{activeTestimonial.content}”</p>
              <div className="flex items-center justify-center gap-4">
                <Image
                  src={activeTestimonial.avatar}
                  alt={activeTestimonial.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover border border-[#FFE7A1]"
                />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">{activeTestimonial.name}</p>
                  <p className="text-sm text-slate-600">{activeTestimonial.role}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#FFE7A1] text-slate-900 hover:bg-[#FFF3B2]"
                  onClick={() => cycleTestimonial('prev')}
                >
                  ← Prev
                </Button>
                <div className="flex gap-2">
                  {testimonialQuotes.map((quote, index) => (
                    <button
                      key={quote.id}
                      type="button"
                      onClick={() => setTestimonialIndex(index)}
                      className={`h-2 rounded-full transition-all ${index === testimonialIndex ? 'w-8 bg-[#FFD84D]' : 'w-2 bg-[#FFE7A1]'}`}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#FFE7A1] text-slate-900 hover:bg-[#FFF3B2]"
                  onClick={() => cycleTestimonial('next')}
                >
                  Next →
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white text-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('faq.badge')}</p>
            <h2 className="text-3xl font-semibold">{t('faq.title')}</h2>
            <p className="text-slate-600">
              {t('faq.subtitle')}
            </p>
          </div>
          <div className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((index) => {
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
                    <div className="px-6 pb-6 text-sm text-slate-600">
                      {t(`faq.items.${index}.answer`, { credits: creditsRequired })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      {generatedImage && (
        <>
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            imageUrl={generatedImage}
            description={description || 'AI anime portrait by Nano Banana'}
          />
          <ImagePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            imageUrl={generatedImage}
            title="AI Anime Preview"
          />
        </>
      )}
    </>
  );
}