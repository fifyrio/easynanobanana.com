'use client';

import { ChangeEvent, useRef, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface PresetAsset {
  displaySrc: string;
  referenceSrc: string;
  fileName: string;
  name: string;
}

interface AiHairstyleExperienceProps {
  stylePresets: PresetAsset[];
  colorPresets: PresetAsset[];
}

const promptSuggestions = [
  'Change the hairstyle to a bright pink mohawk',
  'Give me a sleek bob with airy curtain bangs',
  'Add a long layered cut with honey balayage',
  'Try a pixie crop with banana-yellow accents',
];

const highlightStats = [
  { label: 'Color recipes', value: '65' },
  { label: 'Average preview time', value: '12s' },
];

const beforeImage = '/images/showcases/ai-hairstyle-changer/feature/before.png';
const afterImage = '/images/showcases/ai-hairstyle-changer/feature/after.png';

export default function AiHairstyleExperience({ stylePresets, colorPresets }: AiHairstyleExperienceProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(promptSuggestions[0]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [selectedStyle, setSelectedStyle] = useState<PresetAsset | null>(null);
  const [selectedColor, setSelectedColor] = useState<PresetAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
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

  const buildPrompt = () => {
    if (activeTab === 'preset') {
      const styleText = selectedStyle
        ? `Give the subject a ${selectedStyle.name} haircut`
        : 'Refresh the subject’s existing haircut without changing their overall length';
      const colorText = selectedColor ? ` with ${selectedColor.name} color accents` : '';
      return `${styleText}${colorText}. Keep their face, skin texture, and pose identical.`;
    }
    return `Update the subject’s hairstyle: ${prompt}. Keep their face, expression, and lighting consistent.`;
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload a portrait to restyle.');
      return;
    }

    if (!user) {
      setError('Please sign in to generate hairstyles.');
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(`Insufficient credits. You need ${creditsRequired} credits to generate a hairstyle.`);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const presetDetails =
        activeTab === 'preset'
          ? {
              style: selectedStyle ? selectedStyle.name : 'original haircut',
              color: selectedColor ? selectedColor.name : 'natural color',
            }
          : null;

      const promptText = buildPrompt();
      const detailHint =
        activeTab === 'preset'
          ? `The requested haircut should resemble "${presetDetails?.style}" and the hue should echo "${presetDetails?.color}".`
          : '';
      const finalPrompt = `${promptText} ${detailHint} Deliver a salon-grade, photo-realistic hairstyle swap inspired by Nano Banana. Preserve the subject's identity, earrings, and accessories. Avoid changing clothing or background.`;

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
          setError('Please sign in to generate hairstyles.');
        } else if (response.status === 402) {
          setError(`Insufficient credits. You need ${data.required} credits but only have ${data.available}.`);
        } else if (response.status === 503) {
          setError(data.message || 'Service temporarily unavailable. Please try again in a moment.');
        } else {
          setError(data.error || 'Failed to generate hairstyle preview.');
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
      console.error('Error generating hairstyle:', err);

      // Provide more specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. The server may be busy, please try again.');
      } else {
        setError('Failed to generate hairstyle preview. Please try again.');
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
                  ✂️
                </div>
                AI Hairstyle Studio
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                  AI Hairstyle Changer – Try Haircuts &amp; Hair Colors Online Free
                </h1>
                <p className="text-base text-slate-600">
                  Upload a selfie, describe the look, and preview playful banana-yellow highlights or bold chops
                  in seconds. Perfect for testing out bangs, bob cuts, or color pops without commitment.
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
                      htmlFor="hairstyle-upload"
                      className="cursor-pointer rounded-full bg-[#FFD84D] px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition"
                    >
                      Upload
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      id="hairstyle-upload"
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
                      Drop your portrait or drag from desktop to start
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
                        <span>Describe the hairstyle</span>
                        <span className="text-[#C69312]">Need inspo?</span>
                      </div>
                      <textarea
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-[#FFE7A1] bg-white/90 p-4 text-sm text-slate-700 placeholder-slate-400 focus:border-[#F0BF43] focus:ring-2 focus:ring-[#FFE58F]/80"
                        placeholder="Change the hairstyle..."
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
                          <span>Pick a hairstyle preset</span>
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
                          <span>Choose a color accent</span>
                          <span className="text-xs text-[#C69312]">Swipe</span>
                        </div>
                        <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                          <div className="flex gap-3 pr-6">
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
                                None
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                Natural
                              </div>
                            </button>
                            {colorPresets.map((preset) => {
                              const isSelected = selectedColor?.referenceSrc === preset.referenceSrc;
                              return (
                                <button
                                  type="button"
                                  key={preset.referenceSrc}
                                  onClick={() => setSelectedColor(preset)}
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
                        <p>{selectedColor ? `Color: ${selectedColor.name}` : 'Color: None'}</p>
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
                  {isGenerating ? 'Generating hairstyle...' : 'Generate Hairstyle Preview'}
                </Button>
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  {creditsRequired} credits per look · No salon visit needed
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
                    alt="AI generated hairstyle preview"
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
                        alt="Original hairstyle"
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
                </div>
              </div>
              {generatedImage && (
                <div className="mt-6 rounded-[28px] border border-[#FFE7A1] bg-white/90 p-5 shadow-[0_20px_60px_rgba(247,201,72,0.2)]">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Preview saved</p>
                      <p className="text-xs text-slate-500">Download or share your new hairstyle instantly.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <FreeOriginalDownloadButton
                        imageUrl={generatedImage}
                        fileName="ai-hairstyle.png"
                        className="flex-1 justify-center bg-[#FFD84D] text-slate-900 hover:bg-[#ffe062]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-[#FFE7A1] text-slate-900 hover:bg-[#FFF3B2]"
                        onClick={() => setShowShareModal(true)}
                      >
                        Share look
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
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">How to try new hairstyles with AI</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">See Yourself with Any Hairstyle in 3 Easy Steps</h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {[
              {
                step: 1,
                title: 'Upload a clear photo of yourself',
                description:
                  'Take or upload a well-lit selfie facing the camera. The clearer your photo, the better your results. Works with phone pictures, too.',
                image: '/images/showcases/ai-hairstyle-changer/steps/upload.jpg',
              },
              {
                step: 2,
                title: 'Describe the hairstyle you want to try',
                description:
                  'Tell our AI what you want: “shoulder-length bob with side bangs,” “short pixie crop,” or “banana-yellow accents.” Be as specific as you like.',
                image: '/images/showcases/ai-hairstyle-changer/steps/describe.jpg',
              },
              {
                step: 3,
                title: 'See your transformation instantly',
                description:
                  'Watch your before/after preview update in seconds. Download it, share with friends, or try another look instantly.',
                image: '/images/showcases/ai-hairstyle-changer/steps/preview.jpg',
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
                      alt={card.title}
                      fill
                      sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover"
                    />
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
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">Why People Love Our AI Hairstyle Changer</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">Why People Love Our AI Hairstyle Changer</h2>
            <p className="text-slate-600 max-w-3xl">
              Join millions who discover their perfect hairstyle before committing to the cut. See exactly how any look will feel on
              you with realistic, personalized results.
            </p>
            <button className="text-slate-900 font-semibold inline-flex items-center gap-2 border border-[#FFE7A1] bg-white rounded-full px-5 py-3 shadow-[0_15px_40px_rgba(255,216,77,0.3)] hover:-translate-y-0.5 transition">
              Explore all hairstyle tools
              <span>→</span>
            </button>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
            {[
              {
                title: 'Earn Free Credits Daily',
                description:
                  'Sign in and get 5 free credits every day with our daily check-in reward. Experiment with different looks and find your perfect style without breaking the bank.',
                image: '/images/showcases/ai-hairstyle-changer/love/1.jpg',
                icon: '💎',
                cta: 'Explore other Nano tools',
              },
              {
                title: 'Realistic Results That Actually Look Like You',
                description:
                  'Our AI understands your face shape, skin tone, and features to show how hairstyles really look on you—never a generic render.',
                image: '/images/showcases/ai-hairstyle-changer/love/2.jpg',
                icon: '✨',
                cta: 'Explore other Nano tools',
              },
              {
                title: 'Perfect for Pre-Salon Confidence',
                description:
                  'Skip salon regret. Preview curtain bangs, face-framing layers, or bold colors before you commit.',
                image: '/images/showcases/ai-hairstyle-changer/love/3.jpg',
                icon: '⚡',
                cta: 'Explore other Nano tools',
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
                    <Image
                      src={card.image}
                      alt={card.title}
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
                  <h3 className="text-2xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="text-slate-600 text-sm">{card.description}</p>
                  <button className="inline-flex items-center gap-2 bg-[#FFD84D] text-slate-900 px-4 py-2 rounded-xl font-semibold shadow hover:-translate-y-0.5 transition">
                    {card.cta}
                    <span>→</span>
                  </button>
                </div>
                {(index === 1) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-white p-4">
                    <Image
                      src={card.image}
                      alt={card.title}
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

        <section className="bg-white text-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">All your questions answered</p>
            <h2 className="text-3xl font-semibold">AI Hairstyle FAQ</h2>
            <p className="text-slate-600">
              Everything you need to know before trying a new cut, color, or texture with Nano Banana’s AI stylist.
            </p>
          </div>
          <div className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
            {[
              {
                question: 'Do I need a professional photo?',
                answer:
                  'No—simple selfies work great. Just make sure your face is visible, hair isn’t cropped out, and lighting is decent. Phone photos are perfect.',
              },
              {
                question: 'Will the AI keep my face and features?',
                answer:
                  'Yes. The generator locks onto your face and skin tone, altering only the hair. It won’t change your makeup, piercings, or background unless you ask.',
              },
              {
                question: 'Can I try multiple hairstyles or colors?',
                answer:
                  'Absolutely. Mix and match presets, describe your own look, or generate unlimited variations until you find the perfect match.',
              },
              {
                question: 'Does it cost credits to generate every time?',
                answer:
                  `Each hairstyle preview uses ${creditsRequired} credits. You can top up anytime or invite friends for bonus credits.`,
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
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageUrl={generatedImage}
          description={description || 'AI Hairstyle makeover by Nano Banana'}
        />
      )}
    </>
  );
}
