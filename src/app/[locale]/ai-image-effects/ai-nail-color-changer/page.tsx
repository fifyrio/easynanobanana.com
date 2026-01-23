import AiNailColorChangerExperience, { PresetAsset } from '@/components/AiNailColorChangerExperience';
import presetsData from '@/data/ai-nail-color-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
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

type NailPresets = {
  color: PresetAsset[];
  shape: PresetAsset[];
  sticker: PresetAsset[];
};
const localPresets = presetsData as NailPresets;

export default async function AiNailColorChangerPage() {
  const presets = (await fetchKvJson<NailPresets>('ai-nail-color-presets')) ?? localPresets;
  return (
    <AiNailColorChangerExperience
      colorPresets={presets.color}
      shapePresets={presets.shape}
      stickerPresets={presets.sticker}
    />
  );
}
