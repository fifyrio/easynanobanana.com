import { getTranslations } from 'next-intl/server';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';
import Header from '@/components/common/Header';
import InfographicHeroSection from '@/components/infographic/HeroSection';
import InfographicFeaturesSection from '@/components/infographic/FeaturesSection';
import InfographicShowcaseSection from '@/components/infographic/ShowcaseSection';
import InfographicHowItWorksSection from '@/components/infographic/HowItWorksSection';
import InfographicToolsSection from '@/components/infographic/ToolsSection';
import InfographicReviewsSection from '@/components/infographic/ReviewsSection';
import InfographicFAQSection from '@/components/infographic/FAQSection';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiInfographicGenerator.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
    keywords: [
      'ai infographic generator',
      'infographic maker',
      'data visualization',
      'chart generator',
      'visual content creator',
    ],
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      url: 'https://www.easynanobanana.com/ai-infographic-generator',
      siteName: 'EasyNanoBanana',
      images: [
        {
          url: 'https://www.easynanobanana.com/images/ai-infographic-generator-og.jpg',
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('subtitle'),
      images: ['https://www.easynanobanana.com/images/ai-infographic-generator-og.jpg'],
    },
    alternates: {
      canonical: 'https://www.easynanobanana.com/ai-infographic-generator',
    },
  };
}

export default async function AiInfographicGeneratorPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const tHero = await getTranslations({ locale, namespace: 'aiInfographicGenerator.hero' });
  const tFaq = await getTranslations({ locale, namespace: 'aiInfographicGenerator.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-infographic-generator`;

  const faqKeys = ['howItWorks', 'noDesignExperience', 'exportFormats', 'freeVersion', 'customizable', 'typesOfInfographics', 'uploadData', 'dataSecure'];
  const faqItems = faqKeys.map(key => ({
    question: tFaq(`${key}.question`),
    answer: tFaq(`${key}.answer`),
  }));

  return (
    <>
      <SoftwareAppSchema
        name={tHero('title')}
        description={tHero('subtitle')}
        url={canonicalUrl}
        applicationCategory="Photo & Video"
      />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: baseUrl },
        { name: tHero('title'), url: canonicalUrl },
      ]} />
      <div className="min-h-screen bg-white">
        <Header />
        <InfographicHeroSection />
        <InfographicFeaturesSection />
        <InfographicShowcaseSection />
        <InfographicHowItWorksSection />
        <InfographicToolsSection />
        <InfographicReviewsSection />
        <InfographicFAQSection />
      </div>
    </>
  );
}
