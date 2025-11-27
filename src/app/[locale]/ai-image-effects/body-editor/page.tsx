import AiBodyEditor from '@/components/AiBodyEditor';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiBodyEditor.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
    keywords: 'AI body editor, body reshaping, AI photo editing, body contouring, waist editor, body enhancement',
  };
}

export default function AiBodyEditorPage() {
  return <AiBodyEditor />;
}