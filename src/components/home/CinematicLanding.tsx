'use client';

import { useState } from 'react';
import { Link as I18nLink } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import FadingVideo from './FadingVideo';

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4';
const CAPABILITIES_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4';

const heading: React.CSSProperties = {
  fontFamily: 'var(--font-heading), Georgia, "Times New Roman", serif',
  fontStyle: 'italic',
};
const body: React.CSSProperties = {
  fontFamily: 'var(--font-body), system-ui, sans-serif',
};

interface NavDropdownItem {
  href: string;
  labelKey: string;
  icon: string;
}

interface NavLink {
  href: string;
  label: string;
  dropdown?: NavDropdownItem[];
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  {
    href: '/ai-image-effects/ai-figure-generator',
    label: 'Effects',
    dropdown: [
      { href: '/ai-image-effects/ai-figure-generator', labelKey: 'dropdown.aiFigureGenerator', icon: '🎨' },
      { href: '/ai-image-effects/ai-headshot-generator', labelKey: 'dropdown.aiHeadshotGenerator', icon: '📸' },
      { href: '/ai-image-effects/ai-face-swap', labelKey: 'dropdown.aiFaceSwap', icon: '🔀' },
      { href: '/ai-image-effects/ai-makeup', labelKey: 'dropdown.aiMakeup', icon: '💄' },
      { href: '/ai-image-effects/ai-hairstyle', labelKey: 'dropdown.aiHairstyleStudio', icon: '💇' },
      { href: '/ai-image-effects/ai-photo-to-cartoon', labelKey: 'dropdown.aiPhotoToCartoon', icon: '🎨' },
      { href: '/ai-image-effects/ai-baby-generator', labelKey: 'dropdown.aiBabyGenerator', icon: '👶' },
      { href: '/ai-image-effects/ai-pet-portrait', labelKey: 'dropdown.aiPetPortrait', icon: '🐾' },
    ],
  },
  {
    href: '/video/ai-kiss',
    label: 'Video',
    dropdown: [
      { href: '/video/ai-kiss', labelKey: 'dropdown.aiKiss', icon: '💋' },
      { href: '/video/ai-vox-history-collage', labelKey: 'dropdown.aiHistoryCollage', icon: '📜' },
    ],
  },
  { href: '/remove-background', label: 'Tools' },
  { href: '/pricing', label: 'Pricing' },
];

const CAPABILITY_CARDS = [
  {
    title: 'AI Scenery',
    icon: 'M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z',
    tags: ['Natural Context', 'Photo Realism', 'Infinite Settings', 'Any Style'],
    body:
      'AI analyzes your photo to generate indistinguishable natural environments — from Icelandic cliffs to misty forests, in a single click.',
  },
  {
    title: 'Batch Production',
    icon: 'M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z',
    tags: ['Scale Fast', 'Visual Consistency', 'Time Saver', 'Ready to Post'],
    body:
      'Style your entire library in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.',
  },
  {
    title: 'Smart Lighting',
    icon: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z',
    tags: ['Ray Tracing', 'Physical Shadows', 'Studio Quality', 'Sunlight Sync'],
    body:
      'Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and true-to-life sunlight.',
  },
];

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function BlurText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const words = text.split(' ');
  return (
    <span className={className} style={style}>
      {words.map((w, i) => (
        <span
          key={i}
          className="blur-in inline-block"
          style={{ animationDelay: `${0.1 * i}s`, marginRight: '0.28em' }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

export default function CinematicLanding() {
  const t = useTranslations('pages.home');
  const tNav = useTranslations('common.navigation');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative w-full min-h-screen bg-black overflow-hidden">
        <FadingVideo
          src={HERO_VIDEO}
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: '120%', height: '120%' }}
        />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Navbar */}
          <nav className="flex items-center justify-between px-6 lg:px-16 pt-4">
            <I18nLink
              href="/"
              className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-xl ring-1 ring-yellow-400/40"
              aria-label="Home"
            >
              🍌
            </I18nLink>

            <div className="hidden lg:flex liquid-glass rounded-full px-1.5 py-1.5 items-center gap-1">
              {NAV_LINKS.map((l) => (
                <div key={l.href} className="relative group">
                  <I18nLink
                    href={l.href}
                    prefetch={false}
                    className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors flex items-center gap-1"
                    style={body}
                  >
                    {l.label}
                    {l.dropdown && (
                      <svg
                        className="w-3.5 h-3.5 transition-transform group-hover:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </I18nLink>

                  {l.dropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-64 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                      <div className="rounded-2xl bg-black/85 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl py-2">
                        {l.dropdown.map((item) => (
                          <I18nLink
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                            style={body}
                          >
                            <span className="text-base">{item.icon}</span>
                            {tNav(item.labelKey)}
                          </I18nLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <I18nLink
                href="/image-editor"
                className="ml-1 inline-flex items-center gap-1 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors"
                style={body}
              >
                {t('hero.cta')}
                <ArrowUpRight className="w-4 h-4" />
              </I18nLink>
            </div>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-white"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
              </svg>
            </button>
          </nav>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="lg:hidden px-6 mt-3">
              <div className="liquid-glass rounded-3xl p-4 flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <I18nLink
                    key={l.href}
                    href={l.href}
                    prefetch={false}
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 text-base font-medium text-white/90"
                    style={body}
                  >
                    {l.label}
                  </I18nLink>
                ))}
                <I18nLink
                  href="/image-editor"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 inline-flex items-center justify-center gap-1 bg-white text-black rounded-full px-4 py-2.5 text-sm font-semibold"
                  style={body}
                >
                  {t('hero.cta')}
                  <ArrowUpRight className="w-4 h-4" />
                </I18nLink>
              </div>
            </div>
          )}

          {/* Hero content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center pt-24 px-4">
            <div className="blur-in liquid-glass rounded-full flex items-center gap-2 pr-3" style={{ animationDelay: '0.4s' }}>
              <span className="bg-yellow-400 text-black rounded-full px-3 py-1 text-xs font-semibold" style={body}>
                New
              </span>
              <span className="text-sm text-white/90" style={body}>
                {t('hero.poweredBy')}
              </span>
            </div>

            <h1
              className="mt-6 text-white text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.85] max-w-3xl tracking-[-3px]"
              style={heading}
            >
              <BlurText text={t('hero.title1')} />
              <BlurText text={t('hero.title2')} className="text-yellow-300" />
            </h1>

            <p
              className="blur-in mt-5 text-sm md:text-base text-white/90 max-w-2xl font-light leading-snug"
              style={{ ...body, animationDelay: '0.8s' }}
            >
              {t('hero.subtitle')}
            </p>

            <div className="blur-in flex items-center gap-6 mt-7" style={{ animationDelay: '1.1s' }}>
              <I18nLink
                href="/image-editor"
                className="bg-yellow-400 hover:bg-yellow-300 text-black rounded-full px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2 shadow-[0_8px_30px_rgba(250,204,21,0.35)] transition-colors"
                style={body}
              >
                {t('hero.cta')}
                <ArrowUpRight className="w-5 h-5" />
              </I18nLink>
              <I18nLink href="/ai-image-effects/ai-figure-generator" className="text-white text-sm font-medium inline-flex items-center gap-2" style={body}>
                {t('showcase.cta')}
                <PlayIcon className="w-4 h-4" />
              </I18nLink>
            </div>
          </div>

          {/* Footnote */}
          <div className="blur-in flex flex-col items-center gap-4 pb-10 px-4" style={{ animationDelay: '1.3s' }}>
            <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white" style={body}>
              Powered by Gemini
            </div>
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className="relative min-h-screen bg-black overflow-hidden">
        <FadingVideo src={CAPABILITIES_VIDEO} className="absolute inset-0 w-full h-full object-cover z-0" />

        <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen">
          <div className="mb-auto">
            <p className="text-sm text-yellow-300 mb-6" style={body}>
              {'// Capabilities'}
            </p>
            <h2 className="text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]" style={heading}>
              Production
              <br />
              evolved
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {CAPABILITY_CARDS.map((card) => (
              <div key={card.title} className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center ring-1 ring-yellow-400/30">
                    <svg className="w-6 h-6 text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d={card.icon} />
                    </svg>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                    {card.tags.map((tag) => (
                      <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap" style={body}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-1" />

                <div className="mt-6">
                  <h3 className="text-white text-3xl md:text-4xl tracking-[-1px] leading-none" style={heading}>
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/90 font-light leading-snug max-w-[32ch]" style={body}>
                    {card.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
