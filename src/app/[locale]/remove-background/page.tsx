import Header from '@/components/common/Header';
import BackgroundRemover from '@/components/BackgroundRemover';
import RemoveBackgroundFaq from '@/components/RemoveBackgroundFaq';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'backgroundRemover.seo' });

  // Locale mapping for Open Graph
  const localeMap: Record<string, string> = {
    'en': 'en_US',
    'zh': 'zh_CN',
    'zh-TW': 'zh_TW',
    'id': 'id_ID',
    'ja': 'ja_JP',
    'ko': 'ko_KR',
    'vi': 'vi_VN',
    'th': 'th_TH',
    'es': 'es_ES',
    'fr': 'fr_FR',
    'de': 'de_DE',
    'it': 'it_IT',
    'pt': 'pt_PT',
    'ru': 'ru_RU',
  };

  const ogLocale = localeMap[locale] || 'en_US';
  const baseUrl = 'https://www.easynanobanana.com';
  const pageUrl = `${baseUrl}/${locale}/remove-background`;

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: pageUrl,
      siteName: 'Nano Banana',
      images: [
        {
          url: `${baseUrl}/images/og/remove-background.png`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: ogLocale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [`${baseUrl}/images/og/remove-background.png`],
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        'en': `${baseUrl}/en/remove-background`,
        'zh': `${baseUrl}/zh/remove-background`,
        'id': `${baseUrl}/id/remove-background`,
        'ja': `${baseUrl}/ja/remove-background`,
        'ko': `${baseUrl}/ko/remove-background`,
        'vi': `${baseUrl}/vi/remove-background`,
        'th': `${baseUrl}/th/remove-background`,
        'es': `${baseUrl}/es/remove-background`,
        'fr': `${baseUrl}/fr/remove-background`,
        'de': `${baseUrl}/de/remove-background`,
        'it': `${baseUrl}/it/remove-background`,
        'pt': `${baseUrl}/pt/remove-background`,
        'ru': `${baseUrl}/ru/remove-background`,
        'zh-TW': `${baseUrl}/zh-TW/remove-background`,
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

export default function RemoveBackgroundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BackgroundRemover />
      <RemoveBackgroundFaq />
    </div>
  );
}