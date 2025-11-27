import Header from '@/components/common/Header';
import FreeCredits from '@/components/FreeCredits';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'freeCredits.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function FreeCreditsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <FreeCredits />
    </div>
  );
}