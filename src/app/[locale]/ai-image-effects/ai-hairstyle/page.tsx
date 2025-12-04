import fs from 'fs';
import path from 'path';
import AiHairstyleExperience, { PresetAsset } from '@/components/AiHairstyleExperience';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiHairstyle.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  // English locale uses root path without /en prefix
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-hairstyle`;

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
          url: `${baseUrl}/images/showcases/ai-hairstyle-changer/feature/showcase-1.jpg`,
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
      images: [`${baseUrl}/images/showcases/ai-hairstyle-changer/feature/showcase-1.jpg`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-hairstyle`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-hairstyle`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-hairstyle`,
        'de': `${baseUrl}/de/ai-image-effects/ai-hairstyle`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-hairstyle`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-hairstyle`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-hairstyle`,
        'es': `${baseUrl}/es/ai-image-effects/ai-hairstyle`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-hairstyle`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-hairstyle`,
        'it': `${baseUrl}/it/ai-image-effects/ai-hairstyle`,
        'th': `${baseUrl}/th/ai-image-effects/ai-hairstyle`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-hairstyle`,
        'id': `${baseUrl}/id/ai-image-effects/ai-hairstyle`
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

const presetBasePath = path.join(process.cwd(), 'public/images/showcases/ai-hairstyle-changer/preset');
const styleCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-hairstyle-changer/preset/style';
const colorCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-hairstyle-changer/preset/color';

const formatName = (file: string) => file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

function getPresetImages(subfolder: 'style' | 'color'): PresetAsset[] {
  const dir = path.join(presetBasePath, subfolder);
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch (error) {
    console.error(`Failed to read preset images from ${dir}`, error);
    return [];
  }

  return entries
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .map((file) => {
      const displaySrc = `/images/showcases/ai-hairstyle-changer/preset/${subfolder}/${file}`;
      const referenceSrc =
        subfolder === 'style'
          ? `${styleCdnPrefix}/${file}`
          : `${colorCdnPrefix}/${file}`;
      return {
        displaySrc,
        referenceSrc,
        fileName: file,
        name: formatName(file),
      };
    });
}

export default function AiHairstylePage() {
  const stylePresets = getPresetImages('style');
  const colorPresets = getPresetImages('color');

  return <AiHairstyleExperience stylePresets={stylePresets} colorPresets={colorPresets} />;
}
