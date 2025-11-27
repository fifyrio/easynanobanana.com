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

const promptSuggestions = [
  'Transform me into a heroic shounen anime character with cinematic lighting',
  'Create a cozy Studio Ghibli inspired portrait with warm colors',
  'Convert this photo into neon cyberpunk anime art with glowing effects',
  'Make an adorable chibi character with oversized sparkling eyes',
];

const highlightStats = [
  { label: 'Anime styles', value: '18' },
  { label: 'Avg render time', value: '15s' },
];

const animeFeatureCards = [
  {
    icon: '🧑‍🎨',
    title: 'Personalized Anime Avatar',
    description: 'Transform photos into scroll-stopping anime profile pics across shounen, shoujo, chibi, and watercolor styles.',
  },
  {
    icon: '💾',
    title: 'Pixel Art Conversion',
    description: 'Generate nostalgic 8-bit portraits for gamers, stream overlays, and indie game concepts in seconds.',
  },
  {
    icon: '📚',
    title: 'Webtoon Panel Ready',
    description: 'Output crisp comic ink lines perfect for webtoon leads or K-drama inspired storyboards.',
  },
  {
    icon: '⚡',
    title: 'One-Click Variations',
    description: 'Swap between Ghibli, cyberpunk, watercolor, or custom prompts without re-uploading your photo.',
  },
];

const styleShowcaseOptions = [
  {
    id: 'anime',
    name: 'Japanese Anime',
    description: 'Refined lines, bold colors, and expressive eyes that feel straight out of a shounen episode.',
    image: '/images/showcases/ai-anime-generator/feature/after.jpg',
  },
  {
    id: 'ghibli',
    name: 'Ghibli Style',
    description: 'Cozy, painterly hues with soft lighting inspired by Studio Ghibli backgrounds.',
    image: '/images/showcases/ai-anime-generator/feature/ghibli.jpg',
  },
  {
    id: 'pixel',
    name: 'Pixel Art',
    description: 'Retro 8-bit sprites with crisp dithering—ideal for Twitch and RPG avatars.',
    image: '/images/showcases/ai-anime-generator/feature/pixel.jpg',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Hand-painted textures with flowing brush strokes and pastel palettes.',
    image: '/images/showcases/ai-anime-generator/feature/watercolor.jpg',
  },
  {
    id: 'webtoon',
    name: 'Webtoon Comic',
    description: 'Clean ink outlines and modern gradients for K-drama-ready characters.',
    image: '/images/showcases/ai-anime-generator/feature/webtoon.jpg',
  },
];

const testimonialQuotes = [
  {
    name: 'Sarah Mitchell',
    role: 'Content Creator',
    avatar: '/images/showcases/ai-anime-generator/feature/after.jpg',
    content:
      'This tool is amazing! I created anime avatars for every platform, and engagement shot up overnight. The presets nail the authentic vibe.',
  },
  {
    name: 'James Chen',
    role: 'Illustrator',
    avatar: '/images/showcases/ai-anime-generator/feature/ghibli.jpg',
    content:
      'The Ghibli and watercolor filters help me explore new palettes fast. I still sketch, but Nano Banana sparks each concept.',
  },
  {
    name: 'Emily Park',
    role: 'College Student',
    avatar: '/images/showcases/ai-anime-generator/feature/webtoon.jpg',
    content:
      'My friends and I turn selfies into anime characters for fun. No sign-up, instant downloads, and insanely cute results.',
  },
];

const beforeImage = '/images/showcases/ai-anime-generator/feature/before.jpg';
const afterImage = '/images/showcases/ai-anime-generator/feature/after.jpg';

export default function AiAnimeGeneratorExperience({ stylePresets, effectPresets }: AiAnimeGeneratorExperienceProps) {
  const { user, profile, refreshProfile } = useAuth();
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
  const [styleShowcaseId, setStyleShowcaseId] = useState(styleShowcaseOptions[0]?.id || 'anime');
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const creditsRequired = 5;

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
      setError('Please upload a portrait to transform into anime art.');
      return;
    }

    if (!user) {
      setError('Please sign in to generate anime art.');
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(`Insufficient credits. You need ${creditsRequired} credits to generate anime art.`);
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
          setError('Please sign in to generate anime art.');
        } else if (response.status === 402) {
          setError(`Insufficient credits. You need ${data.required} credits but only have ${data.available}.`);
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
  const beforeTag = uploadedImage ? 'Original' : 'Before';
  const afterTag = generatedImage ? 'Result' : 'After';
  const activeStyleShowcase =
    styleShowcaseOptions.find((style) => style.id === styleShowcaseId) || styleShowcaseOptions[0];
  const activeTestimonial =
    testimonialQuotes.length > 0
      ? testimonialQuotes[testimonialIndex % testimonialQuotes.length]
      : {
          name: 'Nano Banana',
          role: 'AI Anime Generator',
          avatar: afterImage,
          content: 'Instantly convert portraits to anime art.',
        };

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
                AI Anime Studio
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                  AI Anime Generator – Turn Photos Into Anime Art Free
                </h1>
                <p className="text-base text-slate-600">
                  Upload a selfie, pick a preset, or type your own prompt to instantly convert portraits into
                  shounen heroes, Ghibli dreamers, or neon cyberpunk avatars—no art skills or downloads required.
                </p>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-inner">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Upload image</p>
                      <p className="text-xs text-slate-500">
                        .png, .jpeg, .webp up to 12MB
                      </p>
                    </div>
                    <label
                      htmlFor="anime-upload"
                      className="cursor-pointer rounded-full bg-[#FFD84D] px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition"
                    >
                      Upload
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
                      Drop your portrait or drag from desktop to begin the anime glow-up
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
                        {tabKey === 'preset' ? 'Preset' : 'Custom'}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'custom' ? (
                    <>
                      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                        <span>Describe the anime vibe</span>
                        <span className="text-[#C69312]">Need inspo?</span>
                      </div>
                      <textarea
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-[#FFE7A1] bg-white/90 p-4 text-sm text-slate-700 placeholder-slate-400 focus:border-[#F0BF43] focus:ring-2 focus:ring-[#FFE58F]/80"
                        placeholder="Describe the anime style..."
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
                          <span>Pick an anime style preset</span>
                          <span className="text-xs text-[#C69312]">Swipe for more</span>
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
                                None
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                Keep Original
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
                          <span>Choose an art effect</span>
                          <span className="text-xs text-[#C69312]">Swipe</span>
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
                                None
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                Original photo
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
                        <p className="font-semibold text-slate-900 mb-1">Preset summary</p>
                        <p>{selectedStyle ? `Style: ${selectedStyle.name}` : 'Style: None'}</p>
                        <p>{selectedEffect ? `Effect: ${selectedEffect.name}` : 'Effect: None'}</p>
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
                  {isGenerating ? 'Generating anime art...' : 'Generate Anime Artwork'}
                </Button>
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  {creditsRequired} credits per render · Works right in your browser
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                {highlightStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                    <div className="text-lg font-semibold text-slate-900">{item.value}</div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</div>
                  </div>
                ))}
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
                        <p className="text-white font-semibold text-lg">Creating your new look...</p>
                        <p className="text-[#FFE7A1] text-sm">This may take 10-20 seconds</p>
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
                      aria-label="View full size preview"
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
                        View full size
                      </span>
                    </button>
                  )}
                </div>
              </div>
              {generatedImage && (
                <div className="mt-6 rounded-[28px] border border-[#FFE7A1] bg-white/90 p-5 shadow-[0_20px_60px_rgba(247,201,72,0.2)]">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Preview saved</p>
                      <p className="text-xs text-slate-500">Download or share your new anime artwork instantly.</p>
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
                        Share artwork
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
              <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">All-in-one anime toolkit</p>
              <h2 className="text-3xl sm:text-4xl font-semibold">Everything you need to anime-fy any photo</h2>
              <p className="text-slate-600">
                Inspired by the original ai-anime-generator landing page: rapid uploads, multiple presets, and instant downloads inside one playful studio.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {animeFeatureCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-[#FFE7A1] bg-white/80 p-6 shadow-[0_20px_60px_rgba(255,216,77,0.25)]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center text-xl text-[#C69312]">
                    {card.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#FFF9E6] text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
            <div className="text-center space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">Style inspiration</p>
              <h2 className="text-3xl font-semibold">Choose from the fan-favorite anime aesthetics</h2>
              <p className="text-slate-600">Borrowed directly from the ai-anime-generator hero gallery so users immediately recognize the vibe.</p>
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
                      <p className="text-sm font-semibold text-slate-900">{style.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{style.description}</p>
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
                      Original
                    </span>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] border border-[#FFE7A1] bg-slate-100">
                    <Image
                      src={activeStyleShowcase?.image || afterImage}
                      alt={activeStyleShowcase?.name || 'Anime style preview'}
                      fill
                      sizes="(min-width: 768px) 40vw, 100vw"
                      className="object-cover"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-[#FFD84D] px-3 py-1 text-xs font-semibold text-slate-900">
                      {activeStyleShowcase?.name}
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
                        const match = stylePresets.find((preset) =>
                          preset.name.toLowerCase().includes((activeStyleShowcase?.name || '').split(' ')[0].toLowerCase())
                        );
                        setSelectedStyle(match || null);
                      }
                    }}
                  >
                    Try this style
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">How to create anime portraits with AI</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">Turn Any Photo into Anime in 3 Easy Steps</h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {[
              {
                step: 1,
                title: 'Upload a clear photo',
                description:
                  'Drop a selfie or portrait (JPG, PNG, WebP up to 12MB). Front-facing photos with good lighting give the best anime glow-ups.',
                image: '/images/showcases/ai-anime-generator/feature/step-1.jpg',
              },
              {
                step: 2,
                title: 'Choose style or describe it',
                description:
                  'Pick from presets like Studio Ghibli, cyberpunk, watercolor, or type your own prompt for total creative control.',
                image: '/images/showcases/ai-anime-generator/feature/step-2.jpg',
              },
              {
                step: 3,
                title: 'Download in seconds',
                description:
                  'Nano Banana’s AI renders HD anime art in ~15 seconds. Download, share, or regenerate with another vibe instantly.',
                image: '/images/showcases/ai-anime-generator/feature/step-3.jpg',
              },
            ].map((card) => (
              <div
                key={card.step}
                className="rounded-[28px] bg-white border border-[#FFE7A1] shadow-[0_30px_90px_rgba(255,216,77,0.35)] overflow-hidden flex flex-col hover:-translate-y-1 transition"
              >
                <div className="bg-[#FFF3B2]/40">
                  <div className="relative aspect-[4/3] rounded-[24px] m-4 overflow-hidden border border-[#FFE7A1]">
                    {card.video ? (
                      <video
                        src={card.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <Image
                        src={card.image || '/images/showcases/ai-anime-generator/feature/showcase-1.jpg'}
                        alt={card.title}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-[#FFD84D] text-slate-900 font-semibold flex items-center justify-center shadow-md mb-4">
                    {card.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">{card.title}</h3>
                  <p className="text-sm text-slate-600">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-b from-[#FFF7DA] via-white to-[#FFF7DA] text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">Why creators love our AI anime generator</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">Bring Any Anime Aesthetic to Life</h2>
            <p className="text-slate-600 max-w-3xl">
              Social creators, illustrators, VTubers, and gamers rely on Nano Banana to visualize unique anime avatars, pixel art,
              and cinematic scenes without opening Photoshop.
            </p>
            <button className="text-slate-900 font-semibold inline-flex items-center gap-2 border border-[#FFE7A1] bg-white rounded-full px-5 py-3 shadow-[0_15px_40px_rgba(255,216,77,0.3)] hover:-translate-y-0.5 transition">
              Explore anime presets
              <span>→</span>
            </button>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
            {[
              {
                title: 'Personalized Anime Avatars',
                description:
                  'Generate signature anime profile images across shounen, shoujo, chibi, and watercolor looks. Perfect for socials and messaging apps.',
                image: '/images/showcases/ai-anime-generator/feature/showcase-1.jpg',
                icon: '🌟',
                cta: 'Create my avatar',
              },
              {
                title: 'Studio Ghibli to Cyberpunk',
                description:
                  'Jump between cozy, hand-painted vibes and neon sci-fi renders with one click. Our presets mirror popular requests from the anime community.',
                image: '/images/showcases/ai-anime-generator/feature/ghibli.jpg',
                icon: '🎨',
                cta: 'Browse style gallery',
              },
              {
                title: 'Ready for Creators & Gamers',
                description:
                  'Pixel art, webtoon, and comic filters help streamers or devs pitch new characters, overlays, or cover art in minutes.',
                image: '/images/showcases/ai-anime-generator/feature/pixel.jpg',
                icon: '🕹️',
                cta: 'Generate art now',
              },
            ].map((card, index) => (
              <div
                key={card.title}
                className={`grid gap-6 rounded-[32px] bg-white border border-[#FFE7A1] shadow-[0_35px_120px_rgba(250,212,87,0.35)] p-6 md:p-10 items-center ${
                  index === 0 ? 'md:grid-cols-[1.1fr_0.9fr]' : 'md:grid-cols-2'
                }`}
              >
                {(index === 0 || index === 2) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1]">
                    {card.video ? (
                      <video
                        src={card.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : card.image ? (
                      <Image
                        src={card.image}
                        alt={card.title}
                        width={800}
                        height={600}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center text-xl text-[#C69312]">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="text-slate-600 text-sm">{card.description}</p>
                  <button className="inline-flex items-center gap-2 bg-[#FFD84D] text-slate-900 px-4 py-2 rounded-xl font-semibold shadow hover:-translate-y-0.5 transition">
                    {card.cta}
                    <span>→</span>
                  </button>
                </div>
                {(index === 1) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-white p-4">
                    {card.video ? (
                      <video
                        src={card.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-[24px]"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : card.image ? (
                      <Image
                        src={card.image}
                        alt={card.title}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover rounded-[24px]"
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">Loved by the anime community</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">Real results shared from the original landing page</h2>
            <p className="text-slate-600">
              We ported the best testimonial quotes so your visitors instantly trust this new /ai-anime-generator experience.
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
                      key={quote.name}
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
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">All your questions answered</p>
            <h2 className="text-3xl font-semibold">AI Anime Generator FAQ</h2>
            <p className="text-slate-600">
              Everything you need to know about converting photos into anime art securely and in high quality.
            </p>
          </div>
          <div className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
            {[
              {
                question: 'Is this tool free to use?',
                answer:
                  'Yes, the core anime conversion experience is free. Upgrade only if you need ultra HD downloads or batch processing.',
              },
              {
                question: 'What image formats are supported?',
                answer:
                  'Upload JPG, PNG, or WebP files up to 12MB. Clear, front-facing portraits with simple backgrounds generate the best anime detail.',
              },
              {
                question: 'How long does each conversion take?',
                answer:
                  'Most renders finish in 10–20 seconds thanks to edge caching. Timing may vary slightly with server load, but the queue stays fast.',
              },
              {
                question: 'Is my photo safe?',
                answer:
                  'Absolutely. Images are only used for the current render and are automatically purged afterwards. We never reuse, store, or sell your photos.',
              },
              {
                question: 'Can I use the results commercially?',
                answer:
                  'Personal social posts are fine. Contact us for a lightweight commercial license if you plan to print merch, ads, or album covers.',
              },
              {
                question: 'How many credits does each render cost?',
                answer:
                  `Each anime portrait uses ${creditsRequired} credits. Earn daily rewards or invite friends to top up for free.`,
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.question}
                  className="rounded-3xl border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-slate-900">{faq.question}</span>
                    <span className="text-[#C69312] text-2xl">{isOpen ? '–' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-600">
                      {faq.answer}
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
