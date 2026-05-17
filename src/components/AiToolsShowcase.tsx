'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface AiTool {
  id: string;
  icon: string;
  href: string;
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
];

const ITEMS_PER_PAGE_LG = 3;
const ITEMS_PER_PAGE_MD = 2;
const ITEMS_PER_PAGE_SM = 1;
const AUTO_ADVANCE_MS = 5000;
const MAX_DOTS = 10;

function ToolCard({ tool }: { tool: AiTool }) {
  const t = useTranslations('toolsShowcase');
  const tNav = useTranslations('common.navigation');

  const toolName = tNav(`dropdown.${tool.id}` as Parameters<typeof tNav>[0]);

  return (
    <article className="bg-white rounded-2xl border border-[#FFE7A1] shadow-sm hover:shadow-md transition-shadow duration-200 p-6 flex flex-col h-full">
      {/* Icon */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FFF8E1] mb-4 shrink-0">
        <span className="text-2xl" role="img" aria-label={toolName}>
          {tool.icon}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">
        {toolName}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4 leading-relaxed flex-grow">
        {t(`tools.${tool.id}.desc` as Parameters<typeof t>[0])}
      </p>

      {/* Feature bullets */}
      <ul className="space-y-1.5 mb-5">
        {(['f1', 'f2', 'f3'] as const).map((fKey) => (
          <li key={fKey} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="text-[#f5b200] font-bold mt-0.5 shrink-0">✓</span>
            <span>{t(`tools.${tool.id}.${fKey}` as Parameters<typeof t>[0])}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link href={tool.href as Parameters<typeof Link>[0]['href']} prefetch={false}>
        <span className="block w-full text-center bg-[#FFD84D] hover:bg-[#ffe062] text-slate-900 font-semibold rounded-full py-2.5 text-sm transition-colors duration-150 cursor-pointer">
          {t('cta', { tool: toolName })}
        </span>
      </Link>
    </article>
  );
}

export default function AiToolsShowcase() {
  const t = useTranslations('toolsShowcase');

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_LG);
  const [isPaused, setIsPaused] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPages = Math.ceil(AI_TOOLS.length / itemsPerPage);

  // Responsive items per page
  useEffect(() => {
    function updateItemsPerPage() {
      const w = window.innerWidth;
      const next =
        w >= 1024 ? ITEMS_PER_PAGE_LG :
        w >= 768  ? ITEMS_PER_PAGE_MD :
                    ITEMS_PER_PAGE_SM;
      setItemsPerPage((prev) => {
        if (prev !== next) setCurrentPage(0);
        return next;
      });
    }

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage((page + totalPages) % totalPages);
  }, [totalPages]);

  const advance = useCallback(() => {
    setCurrentPage((p) => (p + 1) % totalPages);
  }, [totalPages]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    autoAdvanceRef.current = setInterval(advance, AUTO_ADVANCE_MS);
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [isPaused, advance]);

  const visibleTools = AI_TOOLS.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage,
  );

  // Dot pagination: show max MAX_DOTS dots with ellipsis logic
  const dots = buildDots(currentPage, totalPages);

  return (
    <section
      className="bg-white py-16 md:py-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label={t('title')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            🍌 AI Tools
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            {t('title')}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </header>

        {/* Carousel wrapper */}
        <div className="relative">
          {/* Prev arrow */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous tools"
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:border-[#FFD84D] hover:shadow-md transition-all duration-150"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Cards */}
          <div className="overflow-hidden">
            <div
              className="grid gap-6 transition-all duration-300"
              style={{
                gridTemplateColumns: `repeat(${itemsPerPage}, minmax(0, 1fr))`,
              }}
            >
              {visibleTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next tools"
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:border-[#FFD84D] hover:shadow-md transition-all duration-150"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dot pagination */}
        <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Carousel pagination">
          {dots.map((dot, i) =>
            dot === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="text-gray-400 text-xs select-none px-0.5">
                …
              </span>
            ) : (
              <button
                key={dot}
                onClick={() => goToPage(dot as number)}
                aria-label={`Go to page ${(dot as number) + 1}`}
                aria-current={dot === currentPage ? 'true' : undefined}
                className={`rounded-full transition-all duration-150 ${
                  dot === currentPage
                    ? 'bg-[#FFD84D] w-5 h-2.5'
                    : 'bg-gray-300 hover:bg-gray-400 w-2.5 h-2.5'
                }`}
              />
            )
          )}
        </nav>

        {/* Mobile swipe hint */}
        <p className="text-center text-xs text-slate-400 mt-3 md:hidden">
          {currentPage + 1} / {totalPages}
        </p>
      </div>
    </section>
  );
}

type Dot = number | 'ellipsis';

function buildDots(current: number, total: number): Dot[] {
  if (total <= MAX_DOTS) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const dots: Dot[] = [];
  const wing = 2; // pages shown around current

  dots.push(0);

  const start = Math.max(1, current - wing);
  const end = Math.min(total - 2, current + wing);

  if (start > 1) dots.push('ellipsis');
  for (let i = start; i <= end; i++) dots.push(i);
  if (end < total - 2) dots.push('ellipsis');

  dots.push(total - 1);

  return dots;
}
