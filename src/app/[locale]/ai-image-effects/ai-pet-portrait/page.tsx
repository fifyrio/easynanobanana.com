import AiPetPortraitExperience, { PetPortraitStylePresetAsset } from '@/components/AiPetPortraitExperience';
import presetsData from '@/data/ai-pet-portrait-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiPetPortrait.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-pet-portrait`;

  const getOGLocale = (locale: string): string => {
    const localeMap: Record<string, string> = {
      'en': 'en_US', 'zh': 'zh_CN', 'zh-TW': 'zh_TW', 'ja': 'ja_JP',
      'ko': 'ko_KR', 'id': 'id_ID', 'de': 'de_DE', 'fr': 'fr_FR',
      'es': 'es_ES', 'pt': 'pt_BR', 'ru': 'ru_RU', 'th': 'th_TH',
      'vi': 'vi_VN', 'it': 'it_IT'
    };
    return localeMap[locale] || 'en_US';
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
      images: [{
        url: 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-pet-portrait/feature/og-image.png',
        width: 1200, height: 630, alt: t('ogTitle'),
      }],
      locale: getOGLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: ['https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-pet-portrait/feature/og-image.png'],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-pet-portrait`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-pet-portrait`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-pet-portrait`,
        'de': `${baseUrl}/de/ai-image-effects/ai-pet-portrait`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-pet-portrait`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-pet-portrait`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-pet-portrait`,
        'es': `${baseUrl}/es/ai-image-effects/ai-pet-portrait`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-pet-portrait`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-pet-portrait`,
        'it': `${baseUrl}/it/ai-image-effects/ai-pet-portrait`,
        'th': `${baseUrl}/th/ai-image-effects/ai-pet-portrait`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-pet-portrait`,
        'id': `${baseUrl}/id/ai-image-effects/ai-pet-portrait`
      }
    },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

type PetPortraitStylePresets = { petPortraitStyles: PetPortraitStylePresetAsset[] };
const localPresets = presetsData as PetPortraitStylePresets;

export default async function AiPetPortraitPage() {
  const presets = (await fetchKvJson<PetPortraitStylePresets>('ai-pet-portrait-presets')) ?? localPresets;
  return <AiPetPortraitExperience petPortraitStylePresets={presets.petPortraitStyles} />;
}
