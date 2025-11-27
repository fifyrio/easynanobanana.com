import Header from '@/components/common/Header';
import BackgroundRemover from '@/components/BackgroundRemover';
import RemoveBackgroundFaq from '@/components/RemoveBackgroundFaq';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'backgroundRemover.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function RemoveBackgroundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BackgroundRemover />
      <RemoveBackgroundFaq />
    </div>
  );
}