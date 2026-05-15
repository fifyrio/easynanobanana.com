import AiComicFrameExperience, { ComicFrameStylePresetAsset } from '@/components/AiComicFrameExperience';
import presetsData from '@/data/ai-comic-frame-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiComicFrame.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-comic-frame`;

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
          url: `https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-comic-frame/feature/og-image.png`,
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
      images: [`https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-comic-frame/feature/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/ai-comic-frame`,
        'zh': `${baseUrl}/zh/ai-image-effects/ai-comic-frame`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-comic-frame`,
        'de': `${baseUrl}/de/ai-image-effects/ai-comic-frame`,
        'fr': `${baseUrl}/fr/ai-image-effects/ai-comic-frame`,
        'ja': `${baseUrl}/ja/ai-image-effects/ai-comic-frame`,
        'ko': `${baseUrl}/ko/ai-image-effects/ai-comic-frame`,
        'es': `${baseUrl}/es/ai-image-effects/ai-comic-frame`,
        'pt': `${baseUrl}/pt/ai-image-effects/ai-comic-frame`,
        'ru': `${baseUrl}/ru/ai-image-effects/ai-comic-frame`,
        'it': `${baseUrl}/it/ai-image-effects/ai-comic-frame`,
        'th': `${baseUrl}/th/ai-image-effects/ai-comic-frame`,
        'vi': `${baseUrl}/vi/ai-image-effects/ai-comic-frame`,
        'id': `${baseUrl}/id/ai-image-effects/ai-comic-frame`
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

type ComicFramePresets = { comicFrameStyles: ComicFrameStylePresetAsset[] };
const localPresets = presetsData as ComicFramePresets;

export default async function AiComicFramePage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const presets = (await fetchKvJson<ComicFramePresets>('ai-comic-frame-presets')) ?? localPresets;

  const tSeo = await getTranslations({ locale, namespace: 'aiComicFrame.seo' });
  const tFaq = await getTranslations({ locale, namespace: 'aiComicFrame.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-comic-frame`;

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
      <AiComicFrameExperience comicFramePresets={presets.comicFrameStyles} />
    </>
  );
}
