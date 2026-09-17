import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { RelatedSection } from '@/components/pet-dance/PetDanceRelatedLinks';

export const BASE_URL = 'https://www.easynanobanana.com';
export const R2_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-pet-dance';
export const OG_IMAGE = `${R2_BASE}/feature/og-image.png`;

/** Talking/singing gallery assets live under a separate R2 prefix. */
export const R2_TALK_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-pet-talk';
export const OG_IMAGE_TALK = `${R2_TALK_BASE}/feature/og-image.png`;

export const LOCALES = [
  'en', 'zh', 'zh-TW', 'de', 'fr', 'ja', 'ko',
  'es', 'pt', 'ru', 'it', 'th', 'vi', 'id',
] as const;

/** Every page in the /ai-pet-video cluster, keyed for the internal-link mesh. */
export const PET_VIDEO_PAGES = {
  // Dance generators (transactional intent) — batches A/B.
  hub: '/ai-pet-video',
  dogDancing: '/ai-pet-video/ai-dog-dancing',
  dancingDog: '/ai-pet-video/ai-dancing-dog',
  catDancing: '/ai-pet-video/cat-dancing',
  // Effect galleries (informational intent) — batch C.
  talkingPet: '/ai-pet-video/talking-pet',
  singingCat: '/ai-pet-video/singing-cat-video',
  singingDog: '/ai-pet-video/singing-dog-video',
  talkingAnimal: '/ai-pet-video/talking-animal-video',
} as const;

/** The dance-generator subset — default related links for those pages. */
export const DANCE_PAGE_KEYS = ['hub', 'dogDancing', 'dancingDog', 'catDancing'] as const;

export type PetVideoPageKey = keyof typeof PET_VIDEO_PAGES;

const OG_LOCALE_MAP: Record<string, string> = {
  'en': 'en_US', 'zh': 'zh_CN', 'zh-TW': 'zh_TW', 'ja': 'ja_JP', 'ko': 'ko_KR',
  'id': 'id_ID', 'de': 'de_DE', 'fr': 'fr_FR', 'es': 'es_ES', 'pt': 'pt_BR',
  'ru': 'ru_RU', 'th': 'th_TH', 'vi': 'vi_VN', 'it': 'it_IT',
};

export const localePrefix = (locale: string): string => (locale === 'en' ? '' : `/${locale}`);

export const pageUrl = (locale: string, path: string): string =>
  `${BASE_URL}${localePrefix(locale)}${path}`;

/**
 * Shared metadata builder for every page in the cluster — English drops the
 * `/en` prefix, all 14 locales get hreflang alternates, OG + Twitter + robots
 * follow the project SEO convention.
 */
export async function buildPetVideoMetadata(
  locale: string,
  namespace: string,
  path: string,
  ogImage: string = OG_IMAGE,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `${namespace}.seo` });
  const canonicalUrl = pageUrl(locale, path);
  const languages = Object.fromEntries(LOCALES.map((value) => [value, pageUrl(value, path)]));

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
      siteName: 'Easy Nano Banana',
      // Generated OG assets are square 1024×1024 (nano-banana 1:1 output).
      images: [{ url: ogImage, width: 1024, height: 1024, alt: t('ogTitle') }],
      locale: OG_LOCALE_MAP[locale] || 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [ogImage],
    },
    alternates: { canonical: canonicalUrl, languages },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/** Builds an internal-link matrix for the given cluster page keys, in order. */
export async function buildRelatedSection(
  locale: string,
  keys: readonly PetVideoPageKey[],
): Promise<RelatedSection> {
  const t = await getTranslations({ locale, namespace: 'aiPetVideoLinks' });

  return {
    badge: t('badge'),
    title: t('title'),
    links: keys.map((key) => ({
      href: `${localePrefix(locale)}${PET_VIDEO_PAGES[key]}`,
      emoji: t(`items.${key}.emoji`),
      title: t(`items.${key}.title`),
      description: t(`items.${key}.description`),
    })),
  };
}
