import { getTranslations } from 'next-intl/server';
import AiPetDanceExperience, { type AiPetDancePreset } from '@/components/AiPetDanceExperience';
import {
  SoftwareAppSchema,
  FAQSchema,
  BreadcrumbSchema,
  HowToSchema,
  VideoObjectSchema,
  ItemListSchema,
} from '@/components/seo';
import {
  BASE_URL,
  R2_BASE,
  OG_IMAGE,
  localePrefix,
  pageUrl,
  buildRelatedSection,
  PET_VIDEO_PAGES,
  DANCE_PAGE_KEYS,
  type PetVideoPageKey,
} from '@/lib/pet-video/page-helpers';
import presetsData from '@/data/ai-pet-dance-presets.json';

const { presets } = presetsData as { presets: AiPetDancePreset[] };

interface PetVideoPageProps {
  locale: string;
  /** i18n namespace for this page's copy (each cluster page differs). */
  namespace: string;
  pageKey: PetVideoPageKey;
  /** Preset ids for the zero-cost demo wall. */
  demoPresetIds: string[];
  /** FAQ entries authored under `<namespace>.faq.items`. */
  faqCount: number;
}

/**
 * Shared server shell for every /ai-pet-video cluster page: emits the seven
 * structured-data blocks (SoftwareApp, HowTo, VideoObject, ItemList, FAQ,
 * Breadcrumb) and renders the reusable tool with page-specific copy + links.
 */
export default async function PetVideoPage({
  locale,
  namespace,
  pageKey,
  demoPresetIds,
  faqCount,
}: PetVideoPageProps) {
  const path = PET_VIDEO_PAGES[pageKey];
  const canonicalUrl = pageUrl(locale, path);
  const prefix = localePrefix(locale);

  const tSeo = await getTranslations({ locale, namespace: `${namespace}.seo` });
  const tFaq = await getTranslations({ locale, namespace: `${namespace}.faq` });
  const tHowTo = await getTranslations({ locale, namespace: `${namespace}.howTo` });
  const tLinks = await getTranslations({ locale, namespace: 'aiPetVideoLinks' });

  const faqItems = Array.from({ length: faqCount }, (_, i) => i + 1).map((i) => ({
    question: tFaq(`items.${i}.question`),
    answer: tFaq(`items.${i}.answer`),
  }));

  const howToSteps = [1, 2, 3].map((i) => ({
    name: tHowTo(`steps.${i}.title`),
    text: tHowTo(`steps.${i}.description`),
  }));

  // Dance pages cross-link within the dance cluster (each other, minus self).
  const relatedKeys = DANCE_PAGE_KEYS.filter((k) => k !== pageKey);
  const related = await buildRelatedSection(locale, relatedKeys);

  const breadcrumb = [
    { name: 'Home', url: BASE_URL },
    { name: tLinks('items.hub.title'), url: `${BASE_URL}${prefix}${PET_VIDEO_PAGES.hub}` },
  ];
  if (pageKey !== 'hub') {
    breadcrumb.push({ name: tSeo('ogTitle'), url: canonicalUrl });
  }

  return (
    <>
      <SoftwareAppSchema
        name={tSeo('ogTitle')}
        description={tSeo('description')}
        url={canonicalUrl}
        applicationCategory="Photo & Video"
      />
      <HowToSchema
        name={tHowTo('title')}
        description={tSeo('description')}
        steps={howToSteps}
        totalTime="PT2M"
        image={OG_IMAGE}
      />
      <VideoObjectSchema
        name={tSeo('ogTitle')}
        description={tSeo('ogDescription')}
        thumbnailUrl={`${R2_BASE}/feature/sample-pet.jpg`}
        contentUrl={`${R2_BASE}/feature/sample-dance.mp4`}
        uploadDate="2026-09-16"
        duration="PT4S"
      />
      <ItemListSchema
        name={tSeo('ogTitle')}
        items={presets.map((preset) => ({
          name: preset.name,
          description: preset.description,
          image: preset.displaySrc,
        }))}
      />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema items={breadcrumb} />
      <AiPetDanceExperience
        presets={presets}
        demoPresetIds={demoPresetIds}
        namespace={namespace}
        faqCount={faqCount}
        related={related}
      />
    </>
  );
}
