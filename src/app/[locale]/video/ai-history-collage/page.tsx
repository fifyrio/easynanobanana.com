import AiHistoryCollageExperience, { type AiHistoryCollagePreset } from '@/components/AiHistoryCollageExperience';
import presetsData from '@/data/ai-history-collage-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiHistoryCollage.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/video/ai-history-collage`;

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
          url: `https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-history-collage/feature/og-image.png`,
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
      images: [`https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-history-collage/feature/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/video/ai-history-collage`,
        'zh': `${baseUrl}/zh/video/ai-history-collage`,
        'zh-TW': `${baseUrl}/zh-TW/video/ai-history-collage`,
        'de': `${baseUrl}/de/video/ai-history-collage`,
        'fr': `${baseUrl}/fr/video/ai-history-collage`,
        'ja': `${baseUrl}/ja/video/ai-history-collage`,
        'ko': `${baseUrl}/ko/video/ai-history-collage`,
        'es': `${baseUrl}/es/video/ai-history-collage`,
        'pt': `${baseUrl}/pt/video/ai-history-collage`,
        'ru': `${baseUrl}/ru/video/ai-history-collage`,
        'it': `${baseUrl}/it/video/ai-history-collage`,
        'th': `${baseUrl}/th/video/ai-history-collage`,
        'vi': `${baseUrl}/vi/video/ai-history-collage`,
        'id': `${baseUrl}/id/video/ai-history-collage`
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

type AiHistoryCollagePresets = { presets: AiHistoryCollagePreset[] };
const localPresets = presetsData as AiHistoryCollagePresets;

export default async function AiHistoryCollagePage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const presets =
    (await fetchKvJson<AiHistoryCollagePresets>('ai-history-collage-presets')) ?? localPresets;

  const tSeo = await getTranslations({ locale, namespace: 'aiHistoryCollage.seo' });
  const tFaq = await getTranslations({ locale, namespace: 'aiHistoryCollage.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/video/ai-history-collage`;

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
        { name: 'AI Video', url: `${baseUrl}${pathSegment}/video` },
        { name: tSeo('ogTitle'), url: canonicalUrl },
      ]} />
      <AiHistoryCollageExperience presets={presets.presets} />
    </>
  );
}
