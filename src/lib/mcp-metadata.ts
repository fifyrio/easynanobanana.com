import type { Metadata } from 'next';

const BASE_URL = 'https://www.easynanobanana.com';

const LOCALES = [
  'en', 'zh', 'zh-TW', 'de', 'es', 'fr', 'id', 'it',
  'ja', 'ko', 'pt', 'ru', 'th', 'vi',
] as const;

const OG_LOCALE: Record<string, string> = {
  en: 'en_US', zh: 'zh_CN', 'zh-TW': 'zh_TW', de: 'de_DE', es: 'es_ES',
  fr: 'fr_FR', id: 'id_ID', it: 'it_IT', ja: 'ja_JP', ko: 'ko_KR',
  pt: 'pt_BR', ru: 'ru_RU', th: 'th_TH', vi: 'vi_VN',
};

interface McpMetaInput {
  locale: string;
  path: string; // e.g. '/mcp'
  title: string;
  description: string;
  keywords: string;
}

/**
 * Build i18n-aware SEO metadata for the MCP / CLI / Skills landing pages.
 * English uses the root path (no /en prefix); other locales use their prefix.
 */
export function buildMcpMetadata({ locale, path, title, description, keywords }: McpMetaInput): Metadata {
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${BASE_URL}${pathSegment}${path}`;

  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l] = l === 'en' ? `${BASE_URL}${path}` : `${BASE_URL}/${l}${path}`;
  }

  const ogImage = `${BASE_URL}/images/og-image.png`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Easy Nano Banana',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: OG_LOCALE[locale] ?? 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
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
