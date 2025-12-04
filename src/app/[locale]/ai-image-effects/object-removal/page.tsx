import AiObjectRemoval from '@/components/AiObjectRemoval';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiObjectRemoval.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  // English locale uses root path without /en prefix
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/object-removal`;

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
          url: `${baseUrl}/images/showcases/ai-object-removal/feature/showcase-1.jpg`,
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
      images: [`${baseUrl}/images/showcases/ai-object-removal/feature/showcase-1.jpg`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/object-removal`,
        'zh': `${baseUrl}/zh/ai-image-effects/object-removal`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/object-removal`,
        'de': `${baseUrl}/de/ai-image-effects/object-removal`,
        'fr': `${baseUrl}/fr/ai-image-effects/object-removal`,
        'ja': `${baseUrl}/ja/ai-image-effects/object-removal`,
        'ko': `${baseUrl}/ko/ai-image-effects/object-removal`,
        'es': `${baseUrl}/es/ai-image-effects/object-removal`,
        'pt': `${baseUrl}/pt/ai-image-effects/object-removal`,
        'ru': `${baseUrl}/ru/ai-image-effects/object-removal`,
        'it': `${baseUrl}/it/ai-image-effects/object-removal`,
        'th': `${baseUrl}/th/ai-image-effects/object-removal`,
        'vi': `${baseUrl}/vi/ai-image-effects/object-removal`,
        'id': `${baseUrl}/id/ai-image-effects/object-removal`
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

export default function AiObjectRemovalPage() {
  return <AiObjectRemoval />;
}
