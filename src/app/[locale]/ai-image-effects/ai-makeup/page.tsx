import AiMakeupExperience, { MakeupPresetAsset } from '@/components/AiMakeupExperience';
import presetsData from '@/data/ai-makeup-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiMakeup.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-makeup`;

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
          url: `${baseUrl}/images/showcases/ai-makeup/feature/og-image.png`,
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
      images: [`${baseUrl}/images/showcases/ai-makeup/feature/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-makeup`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-makeup`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-makeup`,
        'de': `${baseUrl}/de/ai-image-effects/ai-makeup`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-makeup`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-makeup`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-makeup`,
        'es': `${baseUrl}/es/ai-image-effects/ai-makeup`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-makeup`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-makeup`,
        'it': `${baseUrl}/it/ai-image-effects/ai-makeup`,
        'th': `${baseUrl}/th/ai-image-effects/ai-makeup`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-makeup`,
        'id': `${baseUrl}/id/ai-image-effects/ai-makeup`
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

type MakeupPresets = { makeup: MakeupPresetAsset[] };
const localPresets = presetsData as MakeupPresets;

export default async function AiMakeupPage() {
  const presets = (await fetchKvJson<MakeupPresets>('ai-makeup-presets')) ?? localPresets;
  return <AiMakeupExperience makeupPresets={presets.makeup} />;
}
