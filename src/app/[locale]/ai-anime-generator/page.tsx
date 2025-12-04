import fs from 'fs';
import path from 'path';
import AiAnimeGeneratorExperience, { PresetAsset } from '@/components/AiAnimeGeneratorExperience';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiAnimeGenerator.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  // English locale uses root path without /en prefix
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-anime-generator`;

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
          url: `${baseUrl}/images/showcases/ai-anime-generator/feature/showcase-1.jpg`,
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
      images: [`${baseUrl}/images/showcases/ai-anime-generator/feature/showcase-1.jpg`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-anime-generator`,
        'zh': `${baseUrl}/zh/ai-anime-generator`,
        'zh-TW': `${baseUrl}/zh-TW/ai-anime-generator`,
        'de': `${baseUrl}/de/ai-anime-generator`,
        'fr': `${baseUrl}/fr/ai-anime-generator`,
        'ja': `${baseUrl}/ja/ai-anime-generator`,
        'ko': `${baseUrl}/ko/ai-anime-generator`,
        'es': `${baseUrl}/es/ai-anime-generator`,
        'pt': `${baseUrl}/pt/ai-anime-generator`,
        'ru': `${baseUrl}/ru/ai-anime-generator`,
        'it': `${baseUrl}/it/ai-anime-generator`,
        'th': `${baseUrl}/th/ai-anime-generator`,
        'vi': `${baseUrl}/vi/ai-anime-generator`,
        'id': `${baseUrl}/id/ai-anime-generator`
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

const presetBasePath = path.join(process.cwd(), 'public/images/showcases/ai-anime-generator/preset');
const presetCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-anime-generator/preset';

const formatName = (file: string) => file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

function getPresetImages(): PresetAsset[] {
  let entries: string[] = [];

  try {
    entries = fs.readdirSync(presetBasePath);
  } catch (error) {
    console.error(`Failed to read preset images from ${presetBasePath}`, error);
    return [];
  }

  return entries
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .map((file) => {
      const displaySrc = `/images/showcases/ai-anime-generator/preset/${file}`;
      const referenceSrc = `${presetCdnPrefix}/${file}`;

      return {
        displaySrc,
        referenceSrc,
        fileName: file,
        name: formatName(file),
      } satisfies PresetAsset;
    });
}

export default function AiAnimeGeneratorPage() {
  const presets = getPresetImages();

  return <AiAnimeGeneratorExperience presets={presets} />;
}
