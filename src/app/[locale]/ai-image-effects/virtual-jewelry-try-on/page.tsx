import VirtualJewelryTryOnExperience from '@/components/VirtualJewelryTryOnExperience';
import jewelryData from '@/data/virtual-jewelry-try-on.json';
import type { JewelryStyle } from '@/data/jewelry/jewelry';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'virtualJewelryTryOn.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  // English locale uses root path without /en prefix
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/virtual-jewelry-try-on`;

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
      siteName: 'Easy Nano Banana',
      images: [
        {
          url: `${baseUrl}/images/showcases/virtual-jewelry-try-on/feature/og-image.jpg`,
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
      images: [`${baseUrl}/images/showcases/virtual-jewelry-try-on/feature/og-image.jpg`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/virtual-jewelry-try-on`,
        'zh': `${baseUrl}/zh/ai-image-effects/virtual-jewelry-try-on`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/virtual-jewelry-try-on`,
        'de': `${baseUrl}/de/ai-image-effects/virtual-jewelry-try-on`,
        'fr': `${baseUrl}/fr/ai-image-effects/virtual-jewelry-try-on`,
        'ja': `${baseUrl}/ja/ai-image-effects/virtual-jewelry-try-on`,
        'ko': `${baseUrl}/ko/ai-image-effects/virtual-jewelry-try-on`,
        'es': `${baseUrl}/es/ai-image-effects/virtual-jewelry-try-on`,
        'pt': `${baseUrl}/pt/ai-image-effects/virtual-jewelry-try-on`,
        'ru': `${baseUrl}/ru/ai-image-effects/virtual-jewelry-try-on`,
        'it': `${baseUrl}/it/ai-image-effects/virtual-jewelry-try-on`,
        'th': `${baseUrl}/th/ai-image-effects/virtual-jewelry-try-on`,
        'vi': `${baseUrl}/vi/ai-image-effects/virtual-jewelry-try-on`,
        'id': `${baseUrl}/id/ai-image-effects/virtual-jewelry-try-on`
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

const localJewelryItems = jewelryData as JewelryStyle[];

export default async function VirtualJewelryTryOnPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const jewelryItems =
    (await fetchKvJson<JewelryStyle[]>('virtual-jewelry-try-on')) ?? localJewelryItems;

  const tSeo = await getTranslations({ locale, namespace: 'virtualJewelryTryOn.seo' });
  const tFaq = await getTranslations({ locale, namespace: 'virtualJewelryTryOn.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/virtual-jewelry-try-on`;

  const faqItems = [1, 2, 3, 4].map(i => ({
    question: tFaq(`items.${i}.question`),
    answer: tFaq(`items.${i}.answer`),
  }));

  return (
    <>
      <SoftwareAppSchema
        name={tSeo('ogTitle')}
        description={tSeo('description')}
        url={canonicalUrl}
        applicationCategory="Photo & Video"
      />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: baseUrl },
        { name: 'AI Image Effects', url: `${baseUrl}${pathSegment}/ai-image-effects` },
        { name: tSeo('ogTitle'), url: canonicalUrl },
      ]} />
      <VirtualJewelryTryOnExperience jewelryItems={jewelryItems} />
    </>
  );
}
