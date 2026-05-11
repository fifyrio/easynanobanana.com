import AiAsciiArtGeneratorExperience, { AsciiStylePresetAsset } from '@/components/AiAsciiArtGeneratorExperience';
import presetsData from '@/data/ai-ascii-art-generator-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiAsciiArtGenerator.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-ascii-art-generator`;

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
          url: `https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-ascii-art-generator/feature/og-image.png`,
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
      images: [`https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-ascii-art-generator/feature/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-ascii-art-generator`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-ascii-art-generator`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-ascii-art-generator`,
        'de': `${baseUrl}/de/ai-image-effects/ai-ascii-art-generator`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-ascii-art-generator`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-ascii-art-generator`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-ascii-art-generator`,
        'es': `${baseUrl}/es/ai-image-effects/ai-ascii-art-generator`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-ascii-art-generator`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-ascii-art-generator`,
        'it': `${baseUrl}/it/ai-image-effects/ai-ascii-art-generator`,
        'th': `${baseUrl}/th/ai-image-effects/ai-ascii-art-generator`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-ascii-art-generator`,
        'id': `${baseUrl}/id/ai-image-effects/ai-ascii-art-generator`
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

type AsciiStylePresets = { asciiStyles: AsciiStylePresetAsset[] };
const localPresets = presetsData as AsciiStylePresets;

export default async function AiAsciiArtGeneratorPage() {
  const presets = (await fetchKvJson<AsciiStylePresets>('ai-ascii-art-generator-presets')) ?? localPresets;
  return <AiAsciiArtGeneratorExperience asciiStylePresets={presets.asciiStyles} />;
}
