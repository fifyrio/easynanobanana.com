import AiSpriteGeneratorExperience, {
  SpritePresetAsset,
} from '@/components/AiSpriteGeneratorExperience';
import presetsData from '@/data/ai-sprite-generator-presets.json';
import { fetchKvJson } from '@/lib/cloudflare-kv';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiSpriteGenerator.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-sprite-generator`;

  const getOGLocale = (locale: string): string => {
    const localeMap: Record<string, string> = {
      en: 'en_US',
      zh: 'zh_CN',
      'zh-TW': 'zh_TW',
      ja: 'ja_JP',
      ko: 'ko_KR',
      id: 'id_ID',
      de: 'de_DE',
      fr: 'fr_FR',
      es: 'es_ES',
      pt: 'pt_BR',
      ru: 'ru_RU',
      th: 'th_TH',
      vi: 'vi_VN',
      it: 'it_IT',
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
          url: 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/feature/after.png',
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
      images: [
        'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/feature/after.png',
      ],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${baseUrl}/ai-image-effects/ai-sprite-generator`,
        zh: `${baseUrl}/zh/ai-image-effects/ai-sprite-generator`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/ai-sprite-generator`,
        de: `${baseUrl}/de/ai-image-effects/ai-sprite-generator`,
        fr: `${baseUrl}/fr/ai-image-effects/ai-sprite-generator`,
        ja: `${baseUrl}/ja/ai-image-effects/ai-sprite-generator`,
        ko: `${baseUrl}/ko/ai-image-effects/ai-sprite-generator`,
        es: `${baseUrl}/es/ai-image-effects/ai-sprite-generator`,
        pt: `${baseUrl}/pt/ai-image-effects/ai-sprite-generator`,
        ru: `${baseUrl}/ru/ai-image-effects/ai-sprite-generator`,
        it: `${baseUrl}/it/ai-image-effects/ai-sprite-generator`,
        th: `${baseUrl}/th/ai-image-effects/ai-sprite-generator`,
        vi: `${baseUrl}/vi/ai-image-effects/ai-sprite-generator`,
        id: `${baseUrl}/id/ai-image-effects/ai-sprite-generator`,
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

type SpritePresets = { spriteStyles: SpritePresetAsset[] };
const localPresets = presetsData as SpritePresets;

export default async function AiSpriteGeneratorPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const presets =
    (await fetchKvJson<SpritePresets>('ai-sprite-generator-presets')) ?? localPresets;

  const tSeo = await getTranslations({ locale, namespace: 'aiSpriteGenerator.seo' });
  const tFaq = await getTranslations({ locale, namespace: 'aiSpriteGenerator.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/ai-sprite-generator`;

  const faqItems = [1, 2, 3, 4, 5, 6].map((i) => ({
    question: tFaq(`items.${i}.question`),
    answer: tFaq(`items.${i}.answer`),
  }));

  return (
    <>
      <SoftwareAppSchema
        name={tSeo('ogTitle')}
        description={tSeo('description')}
        url={canonicalUrl}
        applicationCategory="DesignApplication"
      />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'AI Image Effects', url: `${baseUrl}${pathSegment}/ai-image-effects` },
          { name: tSeo('ogTitle'), url: canonicalUrl },
        ]}
      />
      <AiSpriteGeneratorExperience spritePresets={presets.spriteStyles} />
    </>
  );
}
