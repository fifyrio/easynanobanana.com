import Header from '@/components/common/Header';
import PromptAssistant from '@/components/PromptAssistant';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiPromptAssistant.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function AIPromptAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PromptAssistant />
    </div>
  );
}