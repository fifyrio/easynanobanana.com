import AiClothesChanger from '@/components/AiClothesChanger';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiClothesChanger.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
    keywords: 'ai clothes changer, ai outfit swap, virtual try on, change clothes in photo, ai fashion editor',
  };
}

export default function AiClothesChangerPage() {
  return <AiClothesChanger />;
}
