import { getTranslations } from 'next-intl/server';
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

export default function AiInfographicGeneratorPage() {
  return (
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
  );
}
