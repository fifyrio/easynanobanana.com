import AiBodyEditor from '@/components/AiBodyEditor';
import { getTranslations } from 'next-intl/server';
import { SoftwareAppSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiBodyEditor.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
    keywords: 'AI body editor, body reshaping, AI photo editing, body contouring, waist editor, body enhancement',
  };
}

export default async function AiBodyEditorPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const tHero = await getTranslations({ locale, namespace: 'aiBodyEditor.hero' });
  const tFaq = await getTranslations({ locale, namespace: 'aiBodyEditor.faq' });

  const baseUrl = 'https://www.easynanobanana.com';
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/ai-image-effects/body-editor`;

  const faqItems = [1, 2, 3, 4].map(i => ({
    question: tFaq(`items.${i}.question`),
    answer: tFaq(`items.${i}.answer`),
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
        { name: 'AI Image Effects', url: `${baseUrl}${pathSegment}/ai-image-effects` },
        { name: tHero('title'), url: canonicalUrl },
      ]} />
      <AiBodyEditor />
    </>
  );
}