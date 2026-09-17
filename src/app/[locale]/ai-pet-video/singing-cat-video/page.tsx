import { Metadata } from 'next';
import PetEffectGalleryPage from '@/components/pet-dance/PetEffectGalleryPage';
import { buildPetVideoMetadata, OG_IMAGE_TALK, PET_VIDEO_PAGES, type PetVideoPageKey } from '@/lib/pet-video/page-helpers';

const NAMESPACE = 'aiSingingCat';
const PAGE_KEY: PetVideoPageKey = 'singingCat';
const CLIP_IDS = ['sing-cat', 'sing-cat-birthday', 'talk-cat', 'sing-dog'];
const RELATED_KEYS: PetVideoPageKey[] = ['singingDog', 'catDancing', 'hub'];
const GENERATOR_KEY: PetVideoPageKey = 'catDancing';
const IDEAS_COUNT = 6;
const FAQ_COUNT = 6;

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return buildPetVideoMetadata(locale, NAMESPACE, PET_VIDEO_PAGES[PAGE_KEY], OG_IMAGE_TALK);
}

export default async function Page({
  params: { locale }
}: {
  params: { locale: string }
}) {
  // PetEffectGalleryPage is an async server component; call it as a function
  // so it is not nested as JSX (avoids the async-component-in-JSX type error).
  return PetEffectGalleryPage({
    locale,
    namespace: NAMESPACE,
    pageKey: PAGE_KEY,
    clipIds: CLIP_IDS,
    relatedKeys: RELATED_KEYS,
    generatorKey: GENERATOR_KEY,
    ideasCount: IDEAS_COUNT,
    faqCount: FAQ_COUNT,
  });
}
