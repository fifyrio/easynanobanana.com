import { getTranslations } from 'next-intl/server';
import PetEffectGallery, { type GalleryClip } from '@/components/pet-dance/PetEffectGallery';
import { FAQSchema, BreadcrumbSchema, HowToSchema, VideoObjectSchema, ItemListSchema } from '@/components/seo';
import {
  BASE_URL,
  R2_TALK_BASE,
  OG_IMAGE_TALK,
  localePrefix,
  pageUrl,
  buildRelatedSection,
  PET_VIDEO_PAGES,
  type PetVideoPageKey,
} from '@/lib/pet-video/page-helpers';
import talkPresetsData from '@/data/ai-pet-talk-presets.json';

interface TalkPreset extends GalleryClip {
  thumbnailScene: string;
  stillPrompt: string;
  prompt: string;
}

const { presets } = talkPresetsData as { presets: TalkPreset[] };

interface PetEffectGalleryPageProps {
  locale: string;
  namespace: string;
  pageKey: PetVideoPageKey;
  /** Talk-preset ids shown in this gallery, in order (first is the hero feature). */
  clipIds: string[];
  /** Cluster pages to cross-link in the internal-link matrix. */
  relatedKeys: readonly PetVideoPageKey[];
  /** Cluster page the CTA funnels to (the matching generator). */
  generatorKey: PetVideoPageKey;
  ideasCount: number;
  faqCount: number;
}

/**
 * Shared server shell for the informational-intent effect galleries. Emits
 * VideoObject / HowTo / FAQ / ItemList / Breadcrumb structured data and renders
 * the reusable gallery with a curated clip subset.
 */
export default async function PetEffectGalleryPage({
  locale,
  namespace,
  pageKey,
  clipIds,
  relatedKeys,
  generatorKey,
  ideasCount,
  faqCount,
}: PetEffectGalleryPageProps) {
  const path = PET_VIDEO_PAGES[pageKey];
  const canonicalUrl = pageUrl(locale, path);
  const prefix = localePrefix(locale);

  const tSeo = await getTranslations({ locale, namespace: `${namespace}.seo` });
  const tFaq = await getTranslations({ locale, namespace: `${namespace}.faq` });
  const tHowTo = await getTranslations({ locale, namespace: `${namespace}.howTo` });
  const tLinks = await getTranslations({ locale, namespace: 'aiPetVideoLinks' });

  const clips: GalleryClip[] = clipIds
    .map((id) => presets.find((p) => p.id === id))
    .filter((p): p is TalkPreset => Boolean(p))
    .map(({ id, name, description, displaySrc }) => ({ id, name, description, displaySrc }));

  const featured = clips[0];

  const faqItems = Array.from({ length: faqCount }, (_, i) => i + 1).map((i) => ({
    question: tFaq(`items.${i}.question`),
    answer: tFaq(`items.${i}.answer`),
  }));

  const howToSteps = [1, 2, 3].map((i) => ({
    name: tHowTo(`steps.${i}.title`),
    text: tHowTo(`steps.${i}.description`),
  }));

  const related = await buildRelatedSection(locale, relatedKeys);
  const generatorHref = `${prefix}${PET_VIDEO_PAGES[generatorKey]}`;

  return (
    <>
      {featured && (
        <VideoObjectSchema
          name={tSeo('ogTitle')}
          description={tSeo('ogDescription')}
          thumbnailUrl={featured.displaySrc}
          contentUrl={`${R2_TALK_BASE}/demo/${featured.id}.mp4`}
          uploadDate="2026-09-16"
          duration="PT4S"
        />
      )}
      <HowToSchema
        name={tHowTo('title')}
        description={tSeo('description')}
        steps={howToSteps}
        totalTime="PT2M"
        image={OG_IMAGE_TALK}
      />
      <ItemListSchema
        name={tSeo('ogTitle')}
        items={clips.map((clip) => ({ name: clip.name, description: clip.description, image: clip.displaySrc }))}
      />
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: BASE_URL },
        { name: tLinks('items.hub.title'), url: `${BASE_URL}${prefix}${PET_VIDEO_PAGES.hub}` },
        { name: tSeo('ogTitle'), url: canonicalUrl },
      ]} />
      <PetEffectGallery
        namespace={namespace}
        clips={clips}
        ideasCount={ideasCount}
        faqCount={faqCount}
        related={related}
        generatorHref={generatorHref}
      />
    </>
  );
}
