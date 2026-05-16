import AiEyewearTryonExperience, { EyewearStylePresetAsset } from '@/components/AiEyewearTryonExperience';
import presetsData from '@/data/ai-eyewear-tryon-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiEyewearTryon.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-eyewear-tryon`;

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
          url: `https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-eyewear-tryon/feature/og-image.png`,
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
      images: [`https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-eyewear-tryon/feature/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-eyewear-tryon`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-eyewear-tryon`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-eyewear-tryon`,
        'de': `${baseUrl}/de/ai-image-effects/ai-eyewear-tryon`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-eyewear-tryon`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-eyewear-tryon`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-eyewear-tryon`,
        'es': `${baseUrl}/es/ai-image-effects/ai-eyewear-tryon`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-eyewear-tryon`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-eyewear-tryon`,
        'it': `${baseUrl}/it/ai-image-effects/ai-eyewear-tryon`,
        'th': `${baseUrl}/th/ai-image-effects/ai-eyewear-tryon`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-eyewear-tryon`,
        'id': `${baseUrl}/id/ai-image-effects/ai-eyewear-tryon`
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

type EyewearPresets = { eyewearStyles: EyewearStylePresetAsset[] };
const localPresets = presetsData as EyewearPresets;

export default async function AiEyewearTryonPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const presets = (await fetchKvJson<EyewearPresets>('ai-eyewear-tryon-presets')) ?? localPresets;

  const tSeo = await getTranslations({ locale, namespace: 'aiEyewearTryon.seo' });
  const tFaq = await getTranslations({ locale, namespace: 'aiEyewearTryon.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-eyewear-tryon`;

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
      <AiEyewearTryonExperience eyewearStyles={presets.eyewearStyles} />
    </>
  );
}
