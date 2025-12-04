import AiClothesChanger from '@/components/AiClothesChanger';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiClothesChanger.seo' });
  const tHero = await getTranslations({ locale, namespace: 'aiClothesChanger.hero' });

  const baseUrl = 'https://www.easynanobanana.com';
  // English locale uses root path without /en prefix
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-clothes-changer`;

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
      'ar': 'ar_AR',
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
          url: `${baseUrl}/images/showcases/ai-clothes-changer/Features/1-after.webp`,
          width: 1200,
          height: 630,
          alt: tHero('title'),
        },
      ],
      locale: getOGLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [`${baseUrl}/images/showcases/ai-clothes-changer/Features/1-after.webp`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en/ai-image-effects/ai-clothes-changer`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-clothes-changer`,
        'de': `${baseUrl}/de/ai-image-effects/ai-clothes-changer`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-clothes-changer`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-clothes-changer`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-clothes-changer`,
        'es': `${baseUrl}/es/ai-image-effects/ai-clothes-changer`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-clothes-changer`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-clothes-changer`,
        'it': `${baseUrl}/it/ai-image-effects/ai-clothes-changer`,
        'th': `${baseUrl}/th/ai-image-effects/ai-clothes-changer`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-clothes-changer`,
        'id': `${baseUrl}/id/ai-image-effects/ai-clothes-changer`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-clothes-changer`
      },
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

export default function AiClothesChangerPage() {
  return <AiClothesChanger />;
}