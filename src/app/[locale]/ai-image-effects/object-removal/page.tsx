import AiObjectRemoval from '@/components/AiObjectRemoval';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiObjectRemoval.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
    keywords: 'AI object removal, photo object remover, unwanted object removal, AI photo editing, background removal',
  };
}

export default function AiObjectRemovalPage() {
  return <AiObjectRemoval />;
}