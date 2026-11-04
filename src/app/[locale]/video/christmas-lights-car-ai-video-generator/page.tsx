import type { Metadata } from 'next';
import MemeEffectPage from '@/components/video/MemeEffectPage';
import { MEME_EFFECTS, buildMemeMetadata } from '@/components/video/memeEffectConfig';

const cfg = MEME_EFFECTS['christmas-car'];

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  return buildMemeMetadata(cfg, locale);
}

export default async function ChristmasCarPage({ params: { locale } }: { params: { locale: string } }) {
  return MemeEffectPage({ cfg, locale });
}
