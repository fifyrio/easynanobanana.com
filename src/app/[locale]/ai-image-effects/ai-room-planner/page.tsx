import AiRoomPlannerExperience, { StylePresetAsset } from '@/components/AiRoomPlannerExperience';
import presetsData from '@/data/ai-room-planner-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiRoomPlanner.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-room-planner`;

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
          url: `https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-room-planner/feature/after.png`,
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
      images: [`https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-room-planner/feature/after.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-room-planner`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-room-planner`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-room-planner`,
        'de': `${baseUrl}/de/ai-image-effects/ai-room-planner`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-room-planner`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-room-planner`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-room-planner`,
        'es': `${baseUrl}/es/ai-image-effects/ai-room-planner`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-room-planner`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-room-planner`,
        'it': `${baseUrl}/it/ai-image-effects/ai-room-planner`,
        'th': `${baseUrl}/th/ai-image-effects/ai-room-planner`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-room-planner`,
        'id': `${baseUrl}/id/ai-image-effects/ai-room-planner`
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

type StylePresets = { styles: StylePresetAsset[] };
const localPresets = presetsData as StylePresets;

export default async function AiRoomPlannerPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const presets = (await fetchKvJson<StylePresets>('ai-room-planner-presets')) ?? localPresets;

  const tSeo = await getTranslations({ locale, namespace: 'aiRoomPlanner.seo' });
  const tFaq = await getTranslations({ locale, namespace: 'aiRoomPlanner.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-room-planner`;

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
      <AiRoomPlannerExperience stylePresets={presets.styles} />
    </>
  );
}
