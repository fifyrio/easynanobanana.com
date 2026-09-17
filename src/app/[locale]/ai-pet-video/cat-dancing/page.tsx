import { Metadata } from 'next';
import PetVideoPage from '@/components/pet-dance/PetVideoPage';
import { buildPetVideoMetadata, PET_VIDEO_PAGES } from '@/lib/pet-video/page-helpers';

const NAMESPACE = 'aiCatDancing';
const PAGE_KEY = 'catDancing' as const;
const DEMO_PRESET_IDS = ['hip-hop', 'kpop', 'breakdance', 'samba'];
const FAQ_COUNT = 8;

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return buildPetVideoMetadata(locale, NAMESPACE, PET_VIDEO_PAGES[PAGE_KEY]);
}

export default async function Page({
  params: { locale }
}: {
  params: { locale: string }
}) {
  // PetVideoPage is an async server component; call it as a function so it is
  // not nested as JSX (avoids the async-component-in-JSX type error).
  return PetVideoPage({
    locale,
    namespace: NAMESPACE,
    pageKey: PAGE_KEY,
    demoPresetIds: DEMO_PRESET_IDS,
    faqCount: FAQ_COUNT,
  });
}
