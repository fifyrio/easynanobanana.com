'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import ImagePreviewModal from './ui/ImagePreviewModal';
import LoginModal from './ui/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

export interface TattooStylePresetAsset {
  displaySrc: string;
  referenceSrc: string;
  fileName: string;
  name: string;
}

interface AiTattooGeneratorExperienceProps {
  tattooStylePresets: TattooStylePresetAsset[];
}

const R2_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases';

const beforeImage = `${R2_BASE}/ai-tattoo-generator/feature/before.png`;
const afterImage = `${R2_BASE}/ai-tattoo-generator/feature/after.png`;

export default function AiTattooGeneratorExperience({ tattooStylePresets }: AiTattooGeneratorExperienceProps) {
  const t = useTranslations('aiTattooGenerator');
  const { user, profile, refreshProfile } = useAuth();

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [selectedTattooStyle, setSelectedTattooStyle] = useState<TattooStylePresetAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const creditsRequired = 5;

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSelectedFile = (file?: File) => {
    if (!file) {
      setUploadedFileName(null);
      setUploadedImage(null);
      setUploadedFile(null);
      setUploadedImageUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploadedFile(file);
    setUploadedFileName(file.name);
    setUploadedImageUrl(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleSelectedFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  };

  const buildPrompt = () => {
    if (!selectedTattooStyle) {
      return 'Generate a creative tattoo design on this photo, applying an artistic tattoo style to the subject.';
    }
    const stylePrompts: Record<string, string> = {
      'Minimalist': 'Generate a minimalist tattoo design on this photo. Create clean, simple line work with minimal shading. The design should feature delicate, understated elements with fine lines and subtle details. Focus on elegant simplicity with small, meaningful symbols or shapes.',
      'Traditional': 'Generate a traditional (old school) tattoo design on this photo. Create bold outlines, vivid colors, and classic motifs like anchors, roses, eagles, skulls, or banners. The design should feature strong black outlines, limited but saturated color palette, and iconic American traditional tattoo aesthetics.',
      'Realism': 'Generate a realistic tattoo design on this photo. Create a photorealistic tattoo with incredible detail, smooth shading gradients, and lifelike depth. The design should look like a high-quality photograph rendered as a tattoo, with precise light and shadow work that creates a three-dimensional appearance.',
      'Blackwork': 'Generate a blackwork tattoo design on this photo. Create bold, solid black ink work with geometric patterns, tribal influences, or ornamental designs. The tattoo should use only black ink with strong contrast, featuring dense fills, dotwork elements, and striking negative space composition.',
      'Watercolor': 'Generate a watercolor tattoo design on this photo. Create a vibrant, painterly tattoo that mimics watercolor painting techniques with splashes, drips, and color bleeds. The design should feature soft color transitions, abstract paint splatters, and a fluid, artistic quality without heavy outlines.',
      'Japanese': 'Generate a Japanese (Irezumi) tattoo design on this photo. Create a traditional Japanese tattoo with iconic elements like koi fish, dragons, cherry blossoms, waves, or oni masks. The design should feature bold outlines, rich colors, flowing composition, and respect traditional Japanese tattooing aesthetics with wind bars and background elements.',
      'Geometric': 'Generate a geometric tattoo design on this photo. Create precise, mathematically-inspired patterns with clean lines, sacred geometry, mandalas, or abstract geometric shapes. The design should feature perfect symmetry, intricate patterns, and a modern aesthetic combining circles, triangles, hexagons, and other geometric forms.',
      'Fine Line': 'Generate a fine line tattoo design on this photo. Create an ultra-delicate tattoo with extremely thin, precise lines and minimal shading. The design should feature intricate details rendered with single-needle precision, botanical illustrations, small portraits, or detailed micro-art with a contemporary, refined aesthetic.',
    };
    return stylePrompts[selectedTattooStyle.name] || `Generate a ${selectedTattooStyle.name} tattoo design on this photo.`;
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
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

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      let imageUrl = uploadedImageUrl;
      if (!imageUrl) {
        if (!uploadedFile) {
          setError('No file selected');
          return;
        }

        const formData = new FormData();
        formData.append('file', uploadedFile);

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          setError('Failed to upload image: ' + (uploadError.error || 'Unknown error'));
          return;
        }

        const { imageUrl: newImageUrl } = await uploadResponse.json();
        if (!newImageUrl) {
          setError('Failed to upload image: Missing image URL');
          return;
        }
        imageUrl = newImageUrl;
        setUploadedImageUrl(newImageUrl);
      }

      const promptText = buildPrompt();
      const finalPrompt = `${promptText} The requested tattoo style is "${selectedTattooStyle?.name}". Create a creative tattoo design powered by Nano Banana. Maintain the subject's recognizable features. The output must clearly show the tattoo design with realistic skin integration.`;

      if (!imageUrl) {
        setError('Failed to upload image: Missing image URL');
        return;
      }

      const imageUrls = [imageUrl];

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrls,
          metadata: selectedTattooStyle ? { tattooStyle: selectedTattooStyle.name } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setShowLoginModal(true);
        } else if (response.status === 402) {
          setError(t('error.credits', { required: data.required }));
        } else if (response.status === 503) {
          setError(data.message || 'Service temporarily unavailable. Please try again in a moment.');
        } else {
          setError(data.error || 'Failed to generate tattoo design. Please try again.');
        }
        return;
      }

      const taskId = data.taskId;
      if (!taskId) {
        setError('No task ID received. Please try again.');
        return;
      }

      const maxAttempts = 30;
      const pollInterval = 5000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(`/api/kie/task-status?taskId=${taskId}`, { cache: 'no-store' });
        if (!statusResponse.ok) {
          continue;
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          if (statusData.resultUrls && statusData.resultUrls.length > 0) {
            setGeneratedImage(statusData.resultUrls[0]);
            setDescription('Tattoo design generated successfully');
            await refreshProfile();
            return;
          } else {
            setError('Image generation completed but no result URL found.');
            return;
          }
        }

        if (statusData.status === 'failed') {
          setError(statusData.error || 'Failed to generate tattoo design. Please try again.');
          return;
        }
      }

      setError('Image generation is taking longer than expected. Please check back later.');
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('timeout')) {
        setError('Request timed out. The server may be busy, please try again.');
      } else {
        setError('Failed to generate tattoo design. Please try again.');
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
                <div
                  className={`rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-inner transition ${
                    isDragActive ? 'ring-2 ring-[#F0A202] bg-[#FFF4CC]' : ''
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('input.upload.label')}</p>
                      <p className="text-xs text-slate-500">
                        {t('input.upload.format')}
                      </p>
                    </div>
                    <label
                      htmlFor="tattoo-upload"
                      className="cursor-pointer rounded-full bg-[#FFD84D] px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition"
                    >
                      {t('input.upload.button')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      id="tattoo-upload"
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

                {/* Tattoo style preset selector */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>{t('input.preset.label')}</span>
                    <span className="hidden sm:block text-xs text-[#C69312]">{t('input.preset.swipe')}</span>
                  </div>
                  {/* Mobile: grid */}
                  <div className="grid grid-cols-4 gap-2 sm:hidden">
                    {tattooStylePresets.map((preset) => {
                      const isSelected = selectedTattooStyle?.referenceSrc === preset.referenceSrc;
                      return (
                        <button
                          type="button"
                          key={preset.referenceSrc}
                          onClick={() => setSelectedTattooStyle(isSelected ? null : preset)}
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
                  {/* Desktop: horizontal scroll */}
                  <div className="hidden sm:block overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                    <div className="inline-flex gap-3 pr-6">
                      {tattooStylePresets.map((preset) => {
                        const isSelected = selectedTattooStyle?.referenceSrc === preset.referenceSrc;
                        return (
                          <button
                            type="button"
                            key={preset.referenceSrc}
                            onClick={() => setSelectedTattooStyle(isSelected ? null : preset)}
                            className={`flex w-[100px] flex-shrink-0 flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
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
                                sizes="100px"
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

                  {/* Selection summary */}
                  <div className="mt-3 rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">{t('input.preset.summary.title')}</p>
                    <p>
                      {selectedTattooStyle
                        ? t('input.preset.summary.selected', { name: selectedTattooStyle.name })
                        : t('input.preset.summary.none')}
                    </p>
                  </div>
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
                    alt="AI generated tattoo design"
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

                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-[#FFE7A1]/30 border-t-[#FFD84D] animate-spin"></div>
                        <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#FFD84D]/20 blur-xl"></div>
                      </div>
                      <div className="mt-6 text-center space-y-2">
                        <p className="text-white font-semibold text-lg">{t('preview.loading.title')}</p>
                        <p className="text-[#FFE7A1] text-sm">{t('preview.loading.subtitle')}</p>
                      </div>
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
                        filename="ai-tattoo-generator.png"
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
              { key: 1, icon: '🎨', before: `${R2_BASE}/ai-tattoo-generator/cases/case-1-before.png`, after: `${R2_BASE}/ai-tattoo-generator/cases/case-1-after.png` },
              { key: 2, icon: '✨', before: `${R2_BASE}/ai-tattoo-generator/cases/case-2-before.png`, after: `${R2_BASE}/ai-tattoo-generator/cases/case-2-after.png` },
              { key: 3, icon: '⚡', before: `${R2_BASE}/ai-tattoo-generator/cases/case-3-before.png`, after: `${R2_BASE}/ai-tattoo-generator/cases/case-3-after.png` },
            ].map((card, index) => (
              <div
                key={card.key}
                className="grid gap-6 rounded-[32px] bg-white border border-[#FFE7A1] shadow-[0_35px_120px_rgba(250,212,87,0.35)] p-6 md:p-10 items-center md:grid-cols-2"
              >
                {(index === 0 || index === 2) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-[#FFF3B2]/40 aspect-[4/3] flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 p-3 w-full h-full">
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={card.before} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">Before</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={card.after} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">After</span>
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
                  <button className="inline-flex items-center gap-2 bg-[#FFD84D] text-slate-900 px-4 py-2 rounded-xl font-semibold shadow hover:-translate-y-0.5 transition">
                    {t(`benefits.cards.${card.key}.cta`)}
                    <span>→</span>
                  </button>
                </div>
                {index === 1 && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-[#FFF3B2]/40 aspect-[4/3] flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 p-3 w-full h-full">
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={card.before} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">Before</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={card.after} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">After</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
                    <div className="px-6 pb-6 text-sm text-slate-600">
                      {t(`faq.items.${index}.answer`)}
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
            description={description || 'AI Tattoo Generator by Nano Banana'}
          />
          <ImagePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            imageUrl={generatedImage}
            title="AI Tattoo Generator Preview"
          />
        </>
      )}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
