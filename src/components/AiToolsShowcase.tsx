'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface AiTool {
  id: string;
  icon: string;
  href: string;
}

const R2_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases';

// Map href slugs to R2 directory names where they differ
const SLUG_TO_R2_DIR: Record<string, string> = {
  'beard-filter': 'ai-beard-filter',
  'ai-hairstyle': 'ai-hairstyle-changer',
};

function getPreviewUrl(href: string): string {
  const slug = href.split('/').pop() || '';
  const dir = SLUG_TO_R2_DIR[slug] || slug;
  return `${R2_BASE}/${dir}/feature/after.png`;
}

const AI_TOOLS: AiTool[] = [
  { id: 'aiFigureGenerator', icon: '🎨', href: '/ai-image-effects/ai-figure-generator' },
  { id: 'aiClothesChanger', icon: '👗', href: '/ai-image-effects/ai-clothes-changer' },
  { id: 'aiHairstyleStudio', icon: '💇', href: '/ai-image-effects/ai-hairstyle' },
  { id: 'aiNailColorChanger', icon: '💅', href: '/ai-image-effects/ai-nail-color-changer' },
  { id: 'virtualJewelryTryOn', icon: '💎', href: '/ai-image-effects/virtual-jewelry-try-on' },
  { id: 'aiAnimeGenerator', icon: '🖌️', href: '/ai-anime-generator' },
  { id: 'objectRemoval', icon: '🎯', href: '/ai-image-effects/object-removal' },
  { id: 'bodyEditor', icon: '💪', href: '/ai-image-effects/body-editor' },
  { id: 'aiAgeFilter', icon: '🕐', href: '/ai-image-effects/ai-age-filter' },
  { id: 'aiBeardFilter', icon: '🧔', href: '/ai-image-effects/beard-filter' },
  { id: 'aiMakeup', icon: '💄', href: '/ai-image-effects/ai-makeup' },
  { id: 'aiFatFilter', icon: '⚖️', href: '/ai-image-effects/ai-fat-filter' },
  { id: 'aiHeadshotGenerator', icon: '📸', href: '/ai-image-effects/ai-headshot-generator' },
  { id: 'aiHug', icon: '🤗', href: '/ai-image-effects/ai-hug' },
  { id: 'aiSmileFilter', icon: '😊', href: '/ai-image-effects/ai-smile-filter' },
  { id: 'aiSkinColor', icon: '🎨', href: '/ai-image-effects/ai-skin-color' },
  { id: 'aiEyeColor', icon: '👁️', href: '/ai-image-effects/ai-eye-color' },
  { id: 'aiBabyGenerator', icon: '👶', href: '/ai-image-effects/ai-baby-generator' },
  { id: 'aiPhotoColorizer', icon: '🎨', href: '/ai-image-effects/ai-photo-colorizer' },
  { id: 'aiFaceShape', icon: '🔷', href: '/ai-image-effects/ai-face-shape' },
  { id: 'aiVintagePhotoBooth', icon: '📷', href: '/ai-image-effects/ai-vintage-photo-booth' },
  { id: 'aiPhotoToSketch', icon: '✏️', href: '/ai-image-effects/ai-photo-to-sketch' },
  { id: 'aiPhotoToCartoon', icon: '🎨', href: '/ai-image-effects/ai-photo-to-cartoon' },
  { id: 'aiAsciiArtGenerator', icon: '💻', href: '/ai-image-effects/ai-ascii-art-generator' },
  { id: 'aiMuscleGenerator', icon: '💪', href: '/ai-image-effects/ai-muscle-generator' },
  { id: 'aiOpenEyes', icon: '👁️', href: '/ai-image-effects/ai-open-eyes' },
  { id: 'aiPetPortrait', icon: '🐾', href: '/ai-image-effects/ai-pet-portrait' },
  { id: 'aiPersonalColor', icon: '🎨', href: '/ai-image-effects/ai-personal-color' },
  { id: 'aiPerlerBeadPattern', icon: '🔲', href: '/ai-image-effects/ai-perler-bead-pattern' },
  { id: 'aiPunchHoleEffect', icon: '🕳️', href: '/ai-image-effects/ai-punch-hole-effect' },
  { id: 'aiTattooGenerator', icon: '🖋️', href: '/ai-image-effects/ai-tattoo-generator' },
  { id: 'aiStickerGenerator', icon: '🏷️', href: '/ai-image-effects/ai-sticker-generator' },
  { id: 'aiLogoGenerator', icon: '✨', href: '/ai-image-effects/ai-logo-generator' },
  { id: 'aiMemeGenerator', icon: '😂', href: '/ai-image-effects/ai-meme-generator' },
  { id: 'aiFaceAnimator', icon: '🎭', href: '/ai-image-effects/ai-face-animator' },
  { id: 'aiGlowUpTest', icon: '✨', href: '/ai-image-effects/ai-glow-up-test' },
  { id: 'aiOutfitChange', icon: '👔', href: '/ai-image-effects/ai-outfit-change' },
  { id: 'aiAlterEgo', icon: '🎭', href: '/ai-image-effects/ai-alter-ego' },
  { id: 'aiViralityPredictor', icon: '📈', href: '/ai-image-effects/ai-virality-predictor' },
  { id: 'aiAttractivenessTest', icon: '💯', href: '/ai-image-effects/ai-attractiveness-test' },
  { id: 'aiComicFrame', icon: '🖼️', href: '/ai-image-effects/ai-comic-frame' },
  { id: 'aiBugIdentifier', icon: '🐛', href: '/ai-image-effects/ai-bug-identifier' },
  { id: 'aiFacePair', icon: '👥', href: '/ai-image-effects/ai-face-pair' },
  { id: 'aiSkinAnalyzer', icon: '🧴', href: '/ai-image-effects/ai-skin-analyzer' },
  { id: 'aiEyewearTryon', icon: '👓', href: '/ai-image-effects/ai-eyewear-tryon' },
  { id: 'aiAestheticSim', icon: '✨', href: '/ai-image-effects/ai-aesthetic-sim' },
  { id: 'aiTeethWhitening', icon: '🦷', href: '/ai-image-effects/ai-teeth-whitening' },
  { id: 'aiSkinSmoother', icon: '🧴', href: '/ai-image-effects/ai-skin-smoother' },
  { id: 'aiRoomRedesign', icon: '🏠', href: '/ai-image-effects/ai-room-redesign' },
  { id: 'aiDoubleChinRemover', icon: '👤', href: '/ai-image-effects/ai-double-chin-remover' },
  { id: 'aiHatTryon', icon: '🎩', href: '/ai-image-effects/ai-hat-tryon' },
  { id: 'aiModelSwap', icon: '👗', href: '/ai-image-effects/ai-model-swap' },
  { id: 'aiFaceSymmetry', icon: '⚖️', href: '/ai-image-effects/ai-face-symmetry' },
  { id: 'aiGenderSwap', icon: '🔄', href: '/ai-image-effects/ai-gender-swap' },
  { id: 'aiFaceAnonymizer', icon: '🎭', href: '/ai-image-effects/ai-face-anonymizer' },
  { id: 'aiSmartRecognition', icon: '🔍', href: '/ai-image-effects/ai-smart-recognition' },
  { id: 'aiImageTo3d', icon: '🧊', href: '/ai-image-effects/ai-image-to-3d' },
  { id: 'aiCoupleMatch', icon: '💑', href: '/ai-image-effects/ai-couple-match' },
  { id: 'aiTshirtDesigner', icon: '👕', href: '/ai-image-effects/ai-tshirt-designer' },
  { id: 'aiBookCoverDesigner', icon: '📚', href: '/ai-image-effects/ai-book-cover-designer' },
  { id: 'aiAdDesigner', icon: '📢', href: '/ai-image-effects/ai-ad-designer' },
];

const TOTAL = AI_TOOLS.length;
const AUTO_ADVANCE_MS = 2500;

function ToolCard({
  tool,
  isActive,
  distance,
  onClick,
}: {
  tool: AiTool;
  isActive: boolean;
  distance: number;
  onClick: () => void;
}) {
  const t = useTranslations('toolsShowcase');
  const tNav = useTranslations('common.navigation');
  const toolName = tNav(`dropdown.${tool.id}` as Parameters<typeof tNav>[0]);
  const [imgError, setImgError] = useState(false);

  const scale = isActive ? 1.05 : distance === 1 ? 0.92 : 0.85;
  const cardOpacity = isActive ? 1 : distance === 1 ? 0.45 : 0.25;
  const blur = isActive ? 0 : distance === 1 ? 1 : 2;

  const previewUrl = getPreviewUrl(tool.href);

  return (
    <article
      onClick={onClick}
      className="flex-shrink-0 flex flex-col h-full rounded-2xl border overflow-hidden cursor-pointer select-none"
      style={{
        width: 'var(--card-w)',
        opacity: cardOpacity,
        transform: `scale(${scale})`,
        filter: blur > 0 ? `blur(${blur}px)` : 'none',
        borderColor: isActive ? '#FFD84D' : '#FFE7A1',
        background: isActive ? '#FFFDF5' : '#ffffff',
        boxShadow: isActive
          ? '0 20px 50px rgba(255, 216, 77, 0.35), 0 0 0 2px #FFD84D'
          : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isActive ? 10 : 5 - distance,
      }}
    >
      {/* Preview image */}
      <div className="relative w-full overflow-hidden bg-[#FFF8E1]" style={{ aspectRatio: '4/3' }}>
        {!imgError ? (
          <img
            src={previewUrl}
            alt={toolName}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">{tool.icon}</span>
          </div>
        )}
        {/* Emoji badge */}
        <span
          className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-lg text-base shadow-sm"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
        >
          {tool.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-5">
        <h3 className="font-bold text-lg text-slate-900 mb-1.5 leading-tight">
          {toolName}
        </h3>

        <p className="text-sm text-slate-600 mb-3 leading-relaxed flex-grow line-clamp-2">
          {t(`tools.${tool.id}.desc` as Parameters<typeof t>[0])}
        </p>

        <ul className="space-y-1 mb-4">
          {(['f1', 'f2', 'f3'] as const).map((fKey) => (
            <li key={fKey} className="flex items-start gap-1.5 text-xs text-slate-500">
              <span className="text-[#f5b200] font-bold mt-0.5 shrink-0">&#10003;</span>
              <span className="line-clamp-1">{t(`tools.${tool.id}.${fKey}` as Parameters<typeof t>[0])}</span>
            </li>
          ))}
        </ul>

        <Link href={tool.href as Parameters<typeof Link>[0]['href']} prefetch={false}>
          <span
            className="block w-full text-center font-semibold rounded-full py-2 text-sm transition-all duration-300 cursor-pointer"
            style={{
              background: isActive ? '#FFD84D' : '#FFF3B2',
              color: '#1e293b',
              boxShadow: isActive ? '0 8px 20px rgba(255,216,77,0.3)' : 'none',
              transform: isActive ? 'translateY(-1px)' : 'none',
            }}
          >
            {t('cta', { tool: toolName })}
          </span>
        </Link>
      </div>
    </article>
  );
}

export default function AiToolsShowcase() {
  const t = useTranslations('toolsShowcase');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setActiveIndex((i) => (i + 1) % TOTAL);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(advance, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, advance]);

  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 5;
    return window.innerWidth >= 1024 ? 5 : 3;
  };

  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const wing = Math.floor(visibleCount / 2);

  const visibleIndices: number[] = [];
  for (let offset = -wing; offset <= wing; offset++) {
    visibleIndices.push(((activeIndex + offset) % TOTAL + TOTAL) % TOTAL);
  }

  const goTo = useCallback((idx: number) => {
    setActiveIndex(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setActiveIndex((i) => (i + 1) % TOTAL);
      }, AUTO_ADVANCE_MS);
    }
  }, [isPaused]);

  const progress = ((activeIndex + 1) / TOTAL) * 100;

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24 transition-colors duration-700"
      style={{
        background: 'linear-gradient(180deg, #FFFDF5 0%, #FFF8E1 50%, #FFFDF5 100%)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label={t('title')}
    >
      <div
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,216,77,0.15) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          transition: 'opacity 0.5s',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
            </span>
            AI Tools
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            {t('title')}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </header>

        <div className="relative">
          <button
            onClick={() => goTo(((activeIndex - 1) % TOTAL + TOTAL) % TOTAL)}
            aria-label="Previous tool"
            className="hidden md:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full border border-gray-200 bg-white/90 backdrop-blur shadow-md hover:border-[#FFD84D] hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            ref={trackRef}
            className="flex items-stretch justify-center gap-4 lg:gap-6 overflow-visible px-2"
            style={{
              '--card-w': visibleCount >= 5 ? '280px' : visibleCount >= 3 ? '260px' : '280px',
            } as React.CSSProperties}
          >
            {visibleIndices.map((toolIdx, i) => {
              const offset = i - wing;
              const distance = Math.abs(offset);
              return (
                <ToolCard
                  key={`${toolIdx}-${activeIndex}`}
                  tool={AI_TOOLS[toolIdx]}
                  isActive={distance === 0}
                  distance={distance}
                  onClick={() => goTo(toolIdx)}
                />
              );
            })}
          </div>

          <button
            onClick={() => goTo((activeIndex + 1) % TOTAL)}
            aria-label="Next tool"
            className="hidden md:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full border border-gray-200 bg-white/90 backdrop-blur shadow-md hover:border-[#FFD84D] hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="mt-10 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">{AI_TOOLS[activeIndex].icon} {activeIndex + 1} / {TOTAL}</span>
            <span className={`transition-opacity duration-300 ${isPaused ? 'opacity-100' : 'opacity-0'}`}>
              Paused
            </span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFD84D] to-[#f5b200] rounded-full"
              style={{
                width: `${progress}%`,
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>
        </div>

        <nav className="flex items-center justify-center gap-1 mt-4" aria-label="Tool navigation">
          {Array.from({ length: Math.min(TOTAL, 20) }, (_, i) => {
            const idx = Math.round((i / 19) * (TOTAL - 1));
            const isNear = Math.abs(activeIndex - idx) <= 2;
            const isExact = idx === activeIndex;
            return (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Go to tool ${idx + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: isExact ? 20 : isNear ? 8 : 6,
                  height: isExact ? 8 : isNear ? 6 : 4,
                  background: isExact ? '#FFD84D' : isNear ? '#fde68a' : '#d1d5db',
                  opacity: isExact ? 1 : isNear ? 0.8 : 0.5,
                }}
              />
            );
          })}
        </nav>
      </div>
    </section>
  );
}
