import Header from '@/components/common/Header';
import PricingSection from '@/components/PricingSection';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'pricing.hero' });

  return {
    title: t('title'),
  };
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PricingSection />
    </div>
  );
}
