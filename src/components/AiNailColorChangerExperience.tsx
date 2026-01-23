'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import ImagePreviewModal from './ui/ImagePreviewModal';
import ImageCropModal from './ui/ImageCropModal';
import RecentTaskCard from './ui/RecentTaskCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

export interface PresetAsset {
  displaySrc: string;
  referenceSrc: string;
  fileName: string;
  name: string;
}

interface AiNailColorChangerExperienceProps {
  colorPresets: PresetAsset[];
  shapePresets: PresetAsset[];
  stickerPresets: PresetAsset[];
}

const buildPlaceholderSvg = (label: string, accent: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#FFFBEA"/>
        <stop offset="100%" stop-color="${accent}"/>
      </linearGradient>
    </defs>
    <rect width="900" height="900" rx="90" fill="url(#g)"/>
    <rect x="90" y="90" width="720" height="720" rx="70" fill="#ffffffcc" stroke="#FFE7A1" stroke-width="6"/>
    <text x="450" y="470" font-family="Arial, sans-serif" font-size="48" text-anchor="middle" fill="#8C6A00" font-weight="600">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const beforeImage = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-nail-color-changer/feature/before.webp';
const afterImage = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-nail-color-changer/feature/after.webp';

export default function AiNailColorChangerExperience({
  colorPresets,
  shapePresets,
  stickerPresets,
}: AiNailColorChangerExperienceProps) {
  const t = useTranslations('aiNailColorChanger');
  const { user, profile, refreshProfile } = useAuth();

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'color' | 'shape' | 'sticker'>('color');
  const [selectedColor, setSelectedColor] = useState<PresetAsset | null>(null);
  const [selectedShape, setSelectedShape] = useState<PresetAsset | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<PresetAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<Date | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const creditsRequired = 5;
  const [isDragActive, setIsDragActive] = useState(false);

  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorListRef = useRef<HTMLDivElement>(null);
  const colorItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
  const [tempFileNameForCrop, setTempFileNameForCrop] = useState<string | null>(null);

  const useCaseCards = [
    { id: 1, icon: '💒' },
    { id: 2, icon: '💼' },
    { id: 3, icon: '✨' },
    { id: 4, icon: '🎉' },
    { id: 5, icon: '🧳' },
    { id: 6, icon: '📸' },
  ];

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
      setTempImageForCrop(e.target?.result as string);
      setTempFileNameForCrop(file.name);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
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

  const handleCropComplete = (croppedBlob: Blob, croppedImageUrl: string) => {
    const croppedFile = new File([croppedBlob], tempFileNameForCrop || 'cropped-image.jpg', {
      type: 'image/jpeg',
    });

    setUploadedImage(croppedImageUrl);
    setUploadedFile(croppedFile);
    setUploadedFileName(tempFileNameForCrop);
    setUploadedImageUrl(null);
    setTempImageForCrop(null);
    setTempFileNameForCrop(null);
  };

  const handleCropModalClose = () => {
    setShowCropModal(false);
    setTempImageForCrop(null);
    setTempFileNameForCrop(null);
  };

  const buildPrompt = (hasReferenceImages: boolean) => {
    const colorText = selectedColor ? `${selectedColor.name} polish` : 'natural nail color';
    const shapeText = selectedShape ? `${selectedShape.name} shape` : 'original nail shape';
    const stickerText = selectedSticker
      ? `Add ${selectedSticker.name} nail art.`
      : 'Keep the nails clean without extra art.';
    const referenceNote = hasReferenceImages
      ? 'Use the provided nail reference images to guide the manicure style.'
      : 'Use the color description to guide the manicure style.';
    return `Apply ${colorText} with a ${shapeText}. ${stickerText} ${referenceNote} Keep hands, skin texture, jewelry, and background identical.`;
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
    setTaskStartTime(new Date());

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

      const presetDetails = {
        color: selectedColor ? selectedColor.name : 'natural',
        shape: selectedShape ? selectedShape.name : 'original',
        sticker: selectedSticker ? selectedSticker.name : 'none',
      };

      const referenceCandidates = [selectedColor, selectedShape, selectedSticker]
        .map((preset) => preset?.referenceSrc)
        .filter((src): src is string => typeof src === 'string' && src.startsWith('http'));
      const referenceImageUrls = Array.from(new Set(referenceCandidates));
      const hasReferenceImages = referenceImageUrls.length > 0;

      const promptText = buildPrompt(hasReferenceImages);
      const detailHint = `The manicure should reflect color "${presetDetails.color}", shape "${presetDetails.shape}", and art "${presetDetails.sticker}".`;
      const finalPrompt = `${promptText} ${detailHint} Deliver a salon-grade, photo-realistic manicure try-on inspired by Nano Banana. Preserve the subject's identity and accessories. Avoid changing clothing or background.`;
      setCurrentPrompt(finalPrompt);

      if (!imageUrl) {
        setError('Failed to upload image: Missing image URL');
        return;
      }

      const imageUrls = [imageUrl, ...referenceImageUrls];

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrls,
          metadata: presetDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError(t('error.signIn'));
        } else if (response.status === 402) {
          setError(t('error.credits', { required: data.required }));
        } else if (response.status === 503) {
          setError(data.message || 'Service temporarily unavailable. Please try again in a moment.');
        } else {
          setError(data.error || 'Failed to generate nail preview.');
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

        const statusResponse = await fetch(`/api/kie/task-status?taskId=${taskId}`);
        if (!statusResponse.ok) {
          continue;
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          if (statusData.resultUrls && statusData.resultUrls.length > 0) {
            setGeneratedImage(statusData.resultUrls[0]);
            setDescription('Nail try-on generated successfully');
            await refreshProfile();
            return;
          }
          setError('Nail preview completed but no result URL found.');
          return;
        }

        if (statusData.status === 'failed') {
          setError(statusData.error || 'Nail preview failed. Please try again.');
          return;
        }
      }

      setError('Nail preview is taking longer than expected. Please check back later.');
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. The server may be busy, please try again.');
      } else {
        setError('Failed to generate nail preview. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseCaseSelect = () => {
    if (colorPresets.length === 0) return;
    const randomPreset = colorPresets[Math.floor(Math.random() * colorPresets.length)];
    setSelectedColor(randomPreset);
    setActiveTab('color');
    colorPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const target = colorItemRefs.current[randomPreset.referenceSrc];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        colorListRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 0);
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
            <div className="rounded-[32px] border border-[#FFE58F] bg-white/90 shadow-[0_40px_120px_rgba(247,201,72,0.25)] p-6 sm:p-10 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFD84D] text-lg shadow-lg">
                  N
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
                      htmlFor="nail-upload"
                      className="cursor-pointer rounded-full bg-[#FFD84D] px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition"
                    >
                      {t('input.upload.button')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      id="nail-upload"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  {uploadedImage ? (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#F5C04B] bg-white/80 p-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#FFE7A1] flex-shrink-0">
                        <Image
                          src={uploadedImage}
                          alt="Uploaded photo"
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{uploadedFileName}</p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Ready
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImage(null);
                          setUploadedFile(null);
                          setUploadedFileName(null);
                          setUploadedImageUrl(null);
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#F5C04B]/70 px-3 py-2 text-sm text-slate-500">
                      {t('input.upload.placeholder')}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-4 inline-flex rounded-full border border-[#FFE7A1] bg-[#FFF9E6] p-1 text-sm font-semibold text-slate-900">
                    {(['color'] as const).map((tabKey) => (
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

                  <div className="space-y-5">
                    {activeTab === 'color' && (
                      <div ref={colorPickerRef}>
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span>{t('input.preset.color.label')}</span>
                          <span className="hidden sm:block text-xs text-[#C69312]">{t('input.preset.color.swipe')}</span>
                        </div>
                        {/* Mobile: 3-column wrap grid */}
                        <div className="grid grid-cols-3 gap-2 sm:hidden">
                          <button
                            type="button"
                            onClick={() => setSelectedColor(null)}
                            className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 transition ${
                              selectedColor === null
                                ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                : 'border-transparent bg-white'
                            }`}
                          >
                            <div className="flex h-12 w-full items-center justify-center rounded-xl bg-[#FFF3B2] text-xs font-semibold text-[#C69312]">
                              {t('input.preset.color.none')}
                            </div>
                            <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                              {t('input.preset.color.natural')}
                            </div>
                          </button>
                          {colorPresets.map((preset) => {
                            const isSelected = selectedColor?.referenceSrc === preset.referenceSrc;
                            return (
                              <button
                                type="button"
                                key={preset.referenceSrc}
                                onClick={() => setSelectedColor(preset)}
                                ref={(node) => {
                                  colorItemRefs.current[preset.referenceSrc] = node;
                                }}
                                className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition ${
                                  isSelected
                                    ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <Image
                                  src={preset.displaySrc}
                                  alt={preset.name}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                  unoptimized
                                />
                                <div
                                  className={`absolute inset-x-1 bottom-1 rounded-lg px-1 py-0.5 text-[9px] font-semibold text-center truncate ${
                                    isSelected ? 'bg-white text-slate-900' : 'bg-white/85 text-slate-600'
                                  }`}
                                >
                                  {preset.name}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {/* Desktop: horizontal scroll with 2 rows */}
                        <div className="hidden sm:block overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]" ref={colorListRef}>
                          <div className="inline-grid grid-rows-2 auto-cols-[96px] grid-flow-col gap-3 pr-6">
                            <button
                              type="button"
                              onClick={() => setSelectedColor(null)}
                              className={`flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 transition ${
                                selectedColor === null
                                  ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                  : 'border-transparent bg-white'
                              }`}
                            >
                              <div className="flex h-14 w-full items-center justify-center rounded-xl bg-[#FFF3B2] text-xs font-semibold text-[#C69312]">
                                {t('input.preset.color.none')}
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                {t('input.preset.color.natural')}
                              </div>
                            </button>
                            {colorPresets.map((preset) => {
                              const isSelected = selectedColor?.referenceSrc === preset.referenceSrc;
                              return (
                                <button
                                  type="button"
                                  key={preset.referenceSrc}
                                  onClick={() => setSelectedColor(preset)}
                                  ref={(node) => {
                                    colorItemRefs.current[preset.referenceSrc] = node;
                                  }}
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
                                    unoptimized
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
                    )}

                    {activeTab === 'shape' && (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span>{t('input.preset.shape.label')}</span>
                          <span className="text-xs text-[#C69312]">{t('input.preset.shape.swipe')}</span>
                        </div>
                        <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                          <div className="grid grid-rows-2 auto-cols-[90px] grid-flow-col gap-3 pr-6">
                            <button
                              type="button"
                              onClick={() => setSelectedShape(null)}
                              className={`flex w-[90px] flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
                                selectedShape === null
                                  ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                  : 'border-transparent bg-white'
                              }`}
                            >
                              <div className="flex h-16 w-full items-center justify-center rounded-xl bg-[#FFF3B2] text-xs font-semibold text-[#C69312]">
                                {t('input.preset.shape.none')}
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                {t('input.preset.shape.keep')}
                              </div>
                            </button>
                            {shapePresets.map((preset) => {
                              const isSelected = selectedShape?.referenceSrc === preset.referenceSrc;
                              return (
                                <button
                                  type="button"
                                  key={preset.referenceSrc}
                                  onClick={() => setSelectedShape(preset)}
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
                                      unoptimized
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
                    )}

                    {activeTab === 'sticker' && (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                          <span>{t('input.preset.sticker.label')}</span>
                          <span className="text-xs text-[#C69312]">{t('input.preset.sticker.swipe')}</span>
                        </div>
                        <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                          <div className="flex gap-3 pr-6">
                            <button
                              type="button"
                              onClick={() => setSelectedSticker(null)}
                              className={`flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 transition ${
                                selectedSticker === null
                                  ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                  : 'border-transparent bg-white'
                              }`}
                            >
                              <div className="flex h-14 w-full items-center justify-center rounded-xl bg-[#FFF3B2] text-xs font-semibold text-[#C69312]">
                                {t('input.preset.sticker.none')}
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                {t('input.preset.sticker.clean')}
                              </div>
                            </button>
                            {stickerPresets.map((preset) => {
                              const isSelected = selectedSticker?.referenceSrc === preset.referenceSrc;
                              return (
                                <button
                                  type="button"
                                  key={preset.referenceSrc}
                                  onClick={() => setSelectedSticker(preset)}
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
                                    unoptimized
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
                    )}

                    <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900 mb-1">{t('input.preset.summary.title')}</p>
                      <p>
                        {selectedColor
                          ? t('input.preset.summary.color', { name: selectedColor.name })
                          : t('input.preset.summary.color', { name: t('input.preset.summary.none') })}
                      </p>
                      <p>
                        {selectedShape
                          ? t('input.preset.summary.shape', { name: selectedShape.name })
                          : t('input.preset.summary.shape', { name: t('input.preset.summary.none') })}
                      </p>
                      <p>
                        {selectedSticker
                          ? t('input.preset.summary.sticker', { name: selectedSticker.name })
                          : t('input.preset.summary.sticker', { name: t('input.preset.summary.none') })}
                      </p>
                    </div>
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

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.recipes.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.recipes.label')}</div>
                </div>
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.time.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.time.label')}</div>
                </div>
              </div>
            </div>

            <div className="relative">
              {taskStartTime && (isGenerating || generatedImage) ? (
                <RecentTaskCard
                  timestamp={taskStartTime}
                  prompt={currentPrompt}
                  status={isGenerating ? 'generating' : 'completed'}
                  progress={0}
                  imageUrl={generatedImage || undefined}
                  downloadFilename="ai-nail-try-on.png"
                  onViewFull={generatedImage ? () => setShowPreviewModal(true) : undefined}
                />
              ) : (
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
                      alt="AI generated nail preview"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain"
                      unoptimized
                      priority
                    />
                    <div
                      className="absolute inset-0 left-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={beforeDisplayImage}
                          alt="Original nails"
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-contain"
                          unoptimized
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
              )}
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
                        filename="ai-nail-try-on.png"
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
                <div className="bg-[#FFF3B2]/40">
                  <div className="relative aspect-[4/3] rounded-[24px] m-4 overflow-hidden border border-[#FFE7A1] flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-[#FFD84D] text-slate-900 font-semibold flex items-center justify-center shadow-md">
                      Step {step}
                    </div>
                  </div>
                </div>
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
            {[1, 2, 3].map((key, index) => (
              <div
                key={key}
                className={`grid gap-6 rounded-[32px] bg-white border border-[#FFE7A1] shadow-[0_35px_120px_rgba(250,212,87,0.35)] p-6 md:p-10 items-center ${
                  index === 0 ? 'md:grid-cols-[1.1fr_0.9fr]' : 'md:grid-cols-2'
                }`}
              >
                {(index === 0 || index === 2) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-[#FFF3B2]/40">
                    {index === 0 ? (
                      <Image
                        src="https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-nail-color-changer/feature/showcase-1.webp"
                        alt="Get daily free credits manicure preview"
                        width={800}
                        height={600}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <video
                        src="https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-nail-color-changer/feature/showcase3.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center text-xl text-[#C69312]">
                    {`N${key}`}
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">{t(`benefits.cards.${key}.title`)}</h3>
                  <p className="text-slate-600 text-sm">{t(`benefits.cards.${key}.desc`)}</p>
                  <button className="inline-flex items-center gap-2 bg-[#FFD84D] text-slate-900 px-4 py-2 rounded-xl font-semibold shadow hover:-translate-y-0.5 transition">
                    {t(`benefits.cards.${key}.cta`)}
                    <span>→</span>
                  </button>
                </div>
                {(index === 1) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-white p-4">
                    <div className="aspect-square rounded-[24px] overflow-hidden">
                      <video
                        src="https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-nail-color-changer/feature/animation.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-b from-white via-[#FFF7DA] to-white text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('useCases.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('useCases.title')}</h2>
            <p className="text-slate-600 max-w-3xl">
              {t('useCases.subtitle')}
            </p>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {useCaseCards.map((card) => {
              const bullets = t.raw(`useCases.cards.${card.id}.bullets`);
              const bulletList = Array.isArray(bullets) ? bullets : [];
              return (
                <div
                  key={card.id}
                  className="rounded-[28px] border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)] overflow-hidden flex flex-col hover:-translate-y-1 transition"
                >
                  <div className="flex items-center gap-4 bg-[#FFF3B2]/40 px-5 py-4 border-b border-[#FFE7A1]">
                    <div className="h-12 w-12 rounded-2xl bg-[#FFD84D] text-slate-900 font-bold text-xl flex items-center justify-center shadow-md">
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{t(`useCases.cards.${card.id}.title`)}</h3>
                      <p className="text-sm font-semibold text-[#C69312]">{t(`useCases.cards.${card.id}.subtitle`)}</p>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <p className="text-sm text-slate-600 leading-relaxed">{t(`useCases.cards.${card.id}.description`)}</p>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {bulletList.map((bullet: string, index: number) => (
                        <li key={`${card.id}-${index}`} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#F0A202]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={handleUseCaseSelect}
                      className="mt-auto w-full rounded-2xl bg-[#FFD84D] px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(255,216,77,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                    >
                      {t('useCases.cta')}
                    </button>
                  </div>
                </div>
              );
            })}
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
            description={description || 'AI nail try-on by Nano Banana'}
          />
          <ImagePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            imageUrl={generatedImage}
            title="AI Nail Try-On Preview"
          />
        </>
      )}
      {showCropModal && tempImageForCrop && (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={handleCropModalClose}
          imageSrc={tempImageForCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
