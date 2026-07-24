import AiCigarScannerExperience from '@/components/AiCigarScannerExperience';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiCigarScanner.seo' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/cigar-scanner`;

  const getOGLocale = (locale: string): string => {
    const localeMap: Record<string, string> = {
      'en': 'en_US', 'zh': 'zh_CN', 'zh-TW': 'zh_TW', 'ja': 'ja_JP', 'ko': 'ko_KR',
      'id': 'id_ID', 'de': 'de_DE', 'fr': 'fr_FR', 'es': 'es_ES', 'pt': 'pt_BR',
      'ru': 'ru_RU', 'th': 'th_TH', 'vi': 'vi_VN', 'it': 'it_IT'
    };
    return localeMap[locale] || 'en_US';
  };

  const ogImage = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/cigar-scanner/feature/og-image.png';

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
      siteName: 'Easy Nano Banana',
      images: [{ url: ogImage, width: 1200, height: 630, alt: t('ogTitle') }],
      locale: getOGLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/ai-image-effects/cigar-scanner`,
        'zh': `${baseUrl}/zh/ai-image-effects/cigar-scanner`,
        'zh-TW': `${baseUrl}/zh-TW/ai-image-effects/cigar-scanner`,
        'de': `${baseUrl}/de/ai-image-effects/cigar-scanner`,
        'fr': `${baseUrl}/fr/ai-image-effects/cigar-scanner`,
        'ja': `${baseUrl}/ja/ai-image-effects/cigar-scanner`,
        'ko': `${baseUrl}/ko/ai-image-effects/cigar-scanner`,
        'es': `${baseUrl}/es/ai-image-effects/cigar-scanner`,
        'pt': `${baseUrl}/pt/ai-image-effects/cigar-scanner`,
        'ru': `${baseUrl}/ru/ai-image-effects/cigar-scanner`,
        'it': `${baseUrl}/it/ai-image-effects/cigar-scanner`,
        'th': `${baseUrl}/th/ai-image-effects/cigar-scanner`,
        'vi': `${baseUrl}/vi/ai-image-effects/cigar-scanner`,
        'id': `${baseUrl}/id/ai-image-effects/cigar-scanner`
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

export default async function CigarScannerPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const tSeo = await getTranslations({ locale, namespace: 'aiCigarScanner.seo' });
  const tFaq = await getTranslations({ locale, namespace: 'aiCigarScanner.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/cigar-scanner`;

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
        applicationCategory="Lifestyle"
      />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: baseUrl },
        { name: 'AI Image Effects', url: `${baseUrl}${pathSegment}/ai-image-effects` },
        { name: tSeo('ogTitle'), url: canonicalUrl },
      ]} />
      <AiCigarScannerExperience />
    </>
  );
}
