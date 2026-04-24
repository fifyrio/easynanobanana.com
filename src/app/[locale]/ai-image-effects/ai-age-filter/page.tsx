import AiAgeFilterExperience, { AgePresetAsset } from '@/components/AiAgeFilterExperience';
import presetsData from '@/data/ai-age-filter-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiAgeFilter.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-age-filter`;

  const getOGLocale = (locale: string): string => {
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
      images: [
        {
          url: `${baseUrl}/images/showcases/ai-age-filter/feature/og-image.png`,
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
      images: [`${baseUrl}/images/showcases/ai-age-filter/feature/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-age-filter`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-age-filter`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-age-filter`,
        'de': `${baseUrl}/de/ai-image-effects/ai-age-filter`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-age-filter`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-age-filter`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-age-filter`,
        'es': `${baseUrl}/es/ai-image-effects/ai-age-filter`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-age-filter`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-age-filter`,
        'it': `${baseUrl}/it/ai-image-effects/ai-age-filter`,
        'th': `${baseUrl}/th/ai-image-effects/ai-age-filter`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-age-filter`,
        'id': `${baseUrl}/id/ai-image-effects/ai-age-filter`
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

type AgeFilterPresets = { age: AgePresetAsset[] };
const localPresets = presetsData as AgeFilterPresets;

export default async function AiAgeFilterPage() {
  const presets = (await fetchKvJson<AgeFilterPresets>('ai-age-filter-presets')) ?? localPresets;
  return <AiAgeFilterExperience agePresets={presets.age} />;
}
