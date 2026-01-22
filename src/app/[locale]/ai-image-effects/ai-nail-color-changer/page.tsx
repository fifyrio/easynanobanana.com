import AiNailColorChangerExperience, { PresetAsset } from '@/components/AiNailColorChangerExperience';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiNailColorChanger.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-nail-color-changer`;

  const getOGLocale = (localeValue: string): string => {
    const localeMap: Record<string, string> = {
      'en': 'en_US',
      'zh': 'zh_CN',
      'zh-TW': 'zh_TW',
      'ja': 'ja_JP',
      'ko': 'ko_KR',
      'id': 'id_ID',
      'de': 'de_DE',
      'fr': 'fr_FR',
      'es': 'es_ES',
      'pt': 'pt_BR',
      'ru': 'ru_RU',
      'th': 'th_TH',
      'vi': 'vi_VN',
      'it': 'it_IT'
    };
    return localeMap[localeValue] || 'en_US';
  };

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
      siteName: 'Nano Banana',
      images: [
        {
          url: `${baseUrl}/images/infographic/placeholder.webp`,
          width: 1200,
          height: 630,
          alt: t('ogTitle'),
        },
      ],
      locale: getOGLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [`${baseUrl}/images/infographic/placeholder.webp`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-nail-color-changer`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-nail-color-changer`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-nail-color-changer`,
        'de': `${baseUrl}/de/ai-image-effects/ai-nail-color-changer`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-nail-color-changer`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-nail-color-changer`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-nail-color-changer`,
        'es': `${baseUrl}/es/ai-image-effects/ai-nail-color-changer`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-nail-color-changer`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-nail-color-changer`,
        'it': `${baseUrl}/it/ai-image-effects/ai-nail-color-changer`,
        'th': `${baseUrl}/th/ai-image-effects/ai-nail-color-changer`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-nail-color-changer`,
        'id': `${baseUrl}/id/ai-image-effects/ai-nail-color-changer`
      }
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

const buildSvgDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const buildSwatchSvg = (color: string) => {
  return buildSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" rx="36" fill="${color}" />
      <rect x="12" y="12" width="176" height="176" rx="30" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="6" />
    </svg>
  `);
};

const buildLabelSvg = (label: string, accent: string) => {
  return buildSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" rx="36" fill="#FFFBEA" />
      <rect x="18" y="18" width="164" height="164" rx="32" fill="${accent}" />
      <text x="100" y="115" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#5C4500" font-weight="600">${label}</text>
    </svg>
  `);
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const makePreset = (name: string, displaySrc: string): PresetAsset => {
  const slug = slugify(name);
  return {
    name,
    displaySrc,
    referenceSrc: slug,
    fileName: `${slug}.svg`,
  };
};

const colorPresets: PresetAsset[] = [
  { name: 'Cherry Red', color: '#D64545' },
  { name: 'Milky Nude', color: '#E9D6C3' },
  { name: 'Banana Cream', color: '#FFE07A' },
  { name: 'French Tips', color: '#F5F0E6' },
  { name: 'Midnight Navy', color: '#1D2A57' },
  { name: 'Emerald Glaze', color: '#0B8F6A' },
].map((preset) => makePreset(preset.name, buildSwatchSvg(preset.color)));

const shapePresets: PresetAsset[] = [
  { name: 'Round', accent: '#FFE3B5' },
  { name: 'Square', accent: '#FFD6A1' },
  { name: 'Almond', accent: '#FFE7A1' },
  { name: 'Coffin', accent: '#FDD893' },
  { name: 'Stiletto', accent: '#FFE0A6' },
  { name: 'Squoval', accent: '#FFDFAF' },
].map((preset) => makePreset(preset.name, buildLabelSvg(preset.name, preset.accent)));

const stickerPresets: PresetAsset[] = [
  { name: 'Star', accent: '#FFF0C2' },
  { name: 'Heart', accent: '#FFE8D1' },
  { name: 'Floral', accent: '#FFE5B8' },
  { name: 'Chrome', accent: '#F8E4B2' },
  { name: 'Glitter', accent: '#FFE1B4' },
  { name: 'Marble', accent: '#F9E2C3' },
].map((preset) => makePreset(preset.name, buildLabelSvg(preset.name, preset.accent)));

export default function AiNailColorChangerPage() {
  return (
    <AiNailColorChangerExperience
      colorPresets={colorPresets}
      shapePresets={shapePresets}
      stickerPresets={stickerPresets}
    />
  );
}
