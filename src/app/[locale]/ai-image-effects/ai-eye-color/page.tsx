import AiEyeColorExperience, { EyeColorPresetAsset } from '@/components/AiEyeColorExperience';
import presetsData from '@/data/ai-eye-color-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiEyeColor.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-eye-color`;

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
          url: `https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-eye-color/feature/og-image.png`,
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
      images: [`https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-eye-color/feature/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-eye-color`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-eye-color`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-eye-color`,
        'de': `${baseUrl}/de/ai-image-effects/ai-eye-color`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-eye-color`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-eye-color`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-eye-color`,
        'es': `${baseUrl}/es/ai-image-effects/ai-eye-color`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-eye-color`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-eye-color`,
        'it': `${baseUrl}/it/ai-image-effects/ai-eye-color`,
        'th': `${baseUrl}/th/ai-image-effects/ai-eye-color`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-eye-color`,
        'id': `${baseUrl}/id/ai-image-effects/ai-eye-color`
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

type EyeColorPresets = { eyeColors: EyeColorPresetAsset[] };
const localPresets = presetsData as EyeColorPresets;

export default async function AiEyeColorPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const presets = (await fetchKvJson<EyeColorPresets>('ai-eye-color-presets')) ?? localPresets;

  const tSeo = await getTranslations({ locale, namespace: 'aiEyeColor.seo' });
  const tFaq = await getTranslations({ locale, namespace: 'aiEyeColor.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-eye-color`;

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
      <AiEyeColorExperience eyeColorPresets={presets.eyeColors} />
    </>
  );
}
