import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'pages.home.seo' });
  const tHero = await getTranslations({ locale, namespace: 'pages.home.hero' });

  // SEO Best Practice: Canonical URL should always point to the production domain
  // to prevent duplicate content issues across different environments (dev, staging, etc.)
  // English locale uses root path without /en prefix, other locales use /{locale} prefix
  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}`;

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
    keywords: [
      'AI image generator',
      'AI photo editor',
      'background remover',
      'anime converter',
      'AI hairstyle',
      'Nano Banana',
      'AI art generator'
    ],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
      siteName: 'Nano Banana',
      images: [
        {
          url: `${baseUrl}/images/logo.png`, // Using logo as default OG image for now
          width: 1200,
          height: 630,
          alt: tHero('title1') + ' ' + tHero('title2'),
        },
      ],
      locale: getOGLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [`${baseUrl}/images/logo.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}`,
        'zh': `${baseUrl}/zh`,
        'de': `${baseUrl}/de`,
        'fr': `${baseUrl}/fr`,
        'ja': `${baseUrl}/ja`,
        'ko': `${baseUrl}/ko`,
        'es': `${baseUrl}/es`,
        'pt': `${baseUrl}/pt`,
        'ru': `${baseUrl}/ru`,
        'it': `${baseUrl}/it`,
        'th': `${baseUrl}/th`,
        'vi': `${baseUrl}/vi`,
        'id': `${baseUrl}/id`,
        'zh-TW': `${baseUrl}/zh-TW`
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

export default function HomePage() {
  return <HomePageClient />;
}