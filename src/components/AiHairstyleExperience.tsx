'use client';

import { ChangeEvent, useRef, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';

interface AiHairstyleExperienceProps {
  stylePresets: string[];
  colorPresets: string[];
}

const promptSuggestions = [
  'Change the hairstyle to a bright pink mohawk',
  'Give me a sleek bob with airy curtain bangs',
  'Add a long layered cut with honey balayage',
  'Try a pixie crop with banana-yellow accents',
];

const highlightStats = [
  { label: 'Haircuts previewed', value: '120K+' },
  { label: 'Color recipes', value: '65' },
  { label: 'Average preview time', value: '12s' },
];

const beforeImage = '/images/showcases/ai-hairstyle-changer/preset/10024.jpg';
const afterImage = '/images/showcases/ai-hairstyle-changer/feature/showcase.jpg';

const formatPresetName = (filePath: string) => {
  const fileName = filePath.split('/').pop() || '';
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
};

export default function AiHairstyleExperience({ stylePresets, colorPresets }: AiHairstyleExperienceProps) {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(promptSuggestions[0]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadedFileName(file ? file.name : null);
  };

  const handlePromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
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
                            {stylePresets.map((styleSrc) => {
                              const name = formatPresetName(styleSrc);
                              const isSelected = selectedStyle === styleSrc;
                              return (
                                <button
                                  type="button"
                                  key={styleSrc}
                                  onClick={() => setSelectedStyle(styleSrc)}
                                  className={`flex w-[90px] flex-col items-center rounded-2xl border-2 px-2 pb-2 pt-2 transition ${
                                    isSelected ? 'border-[#FFD84D] shadow-lg' : 'border-[#FFE7A1]'
                                  }`}
                                >
                                  <div className="relative h-16 w-full overflow-hidden rounded-xl">
                                    <Image
                                      src={styleSrc}
                                      alt={name}
                                      fill
                                      sizes="90px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="mt-2 text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                    {name}
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
                            {colorPresets.map((colorSrc) => {
                              const name = formatPresetName(colorSrc);
                              const isSelected = selectedColor === colorSrc;
                              return (
                                <button
                                  type="button"
                                  key={colorSrc}
                                  onClick={() => setSelectedColor(colorSrc)}
                                  className={`relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                                    isSelected ? 'border-[#FFD84D] shadow-lg' : 'border-[#FFE7A1]'
                                  }`}
                                >
                                  <Image
                                    src={colorSrc}
                                    alt={name}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-x-2 bottom-2 rounded-lg bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-700 text-center">
                                    {name}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      {(selectedStyle || selectedColor) && (
                        <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 text-xs text-slate-700">
                          <p className="font-semibold text-slate-900 mb-1">Preset summary</p>
                          <p>{selectedStyle ? `Style: ${formatPresetName(selectedStyle)}` : 'Style: Any'}</p>
                          <p>{selectedColor ? `Color: ${formatPresetName(selectedColor)}` : 'Color: Natural'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="w-full rounded-2xl bg-[#FFD84D] px-6 py-3 text-center text-base font-semibold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                >
                  Generate Hairstyle Preview
                </button>
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  No salon visit or credit card required
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
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-slate-900 select-none"
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
                    src={afterImage}
                    alt="AI generated hairstyle preview"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                  <div
                    className="absolute inset-0 left-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={beforeImage}
                        alt="Original hairstyle"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
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
                    Before
                  </span>
                  <span className="absolute right-8 top-8 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                    After
                  </span>
                  <div className="absolute bottom-6 left-6 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#C69312]">Banana Glow</p>
                    <p className="text-sm text-slate-700">
                      Soft lob with golden highlights &amp; glossy finish
                    </p>
                  </div>
                  <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-2xl bg-slate-900/80 px-4 py-2 text-white shadow-xl backdrop-blur">
                    <div className="flex -space-x-2">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-[#FFE58F] to-[#F7C948]"
                        />
                      ))}
                    </div>
                    <div className="text-xs font-semibold leading-tight">
                      Loved by <br />
                      42 stylists today
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 mt-16">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Upload',
                description: 'Use a selfie from any angle. Our tool keeps lighting natural and skin tones true.',
              },
              {
                title: 'Describe',
                description: 'Type a vibe—banana blonde, curtain bangs, pixie—and we style it in seconds.',
              },
              {
                title: 'Preview',
                description: 'Swipe through before/after shots to compare colors, cuts, and finishes instantly.',
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-3xl border border-[#FFE7A1] bg-white/90 p-6 shadow-[0_20px_60px_rgba(255,216,77,0.2)]"
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF3B2] text-sm font-semibold text-[#C69312]">
                  {step.title}
                </div>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
