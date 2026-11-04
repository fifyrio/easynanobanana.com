import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales } from '@/i18n/config';
import gatsby from '@/data/ai-gatsby-cheers-presets.json';
import cardo from '@/data/ai-cardo-dinner-presets.json';
import car from '@/data/ai-christmas-car-presets.json';

export const BASE = 'https://www.easynanobanana.com';
const R2 = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases';
export const localPath = (locale: string, path: string) => `${locale === 'en' ? '' : `/${locale}`}${path}`;

export type MemeEffectKey = 'gatsby-cheers' | 'cardo-dinner' | 'christmas-car';

export interface MemeEffectConfig {
  effectType: 'ai-gatsby-cheers' | 'ai-cardo-dinner' | 'ai-christmas-car';
  namespace: 'aiGatsbyCheers' | 'aiCardoDinner' | 'aiChristmasCar';
  path: string;
  assets: string;
  uploadDate: string;
  preset: { id: string; name: string; prompt: string };
  related: string[];
}

export const MEME_EFFECTS: Record<MemeEffectKey, MemeEffectConfig> = {
  'gatsby-cheers': {
    effectType: 'ai-gatsby-cheers', namespace: 'aiGatsbyCheers',
    path: '/video/gatsby-cheers-ai-video-generator', assets: `${R2}/ai-gatsby-cheers`,
    uploadDate: '2026-11-04T00:00:00+08:00', preset: gatsby.presets[0],
    related: ['/video/drake-burning-bridges-ai-video-generator', '/video/cardo-dinner-ai-video-generator', '/video/crying-effect-video-generator'],
  },
  'cardo-dinner': {
    effectType: 'ai-cardo-dinner', namespace: 'aiCardoDinner',
    path: '/video/cardo-dinner-ai-video-generator', assets: `${R2}/ai-cardo-dinner`,
    uploadDate: '2026-11-04T00:00:00+08:00', preset: cardo.presets[0],
    related: ['/video/gatsby-cheers-ai-video-generator', '/ai-pet-video', '/video/seedance-2-5-ai-video-generator'],
  },
  'christmas-car': {
    effectType: 'ai-christmas-car', namespace: 'aiChristmasCar',
    path: '/video/christmas-lights-car-ai-video-generator', assets: `${R2}/ai-christmas-car`,
    uploadDate: '2026-11-04T00:00:00+08:00', preset: car.presets[0],
    related: ['/video/seedance-2-5-ai-video-generator', '/video/gatsby-cheers-ai-video-generator', '/ai-image-effects'],
  },
};

export async function buildMemeMetadata(cfg: MemeEffectConfig, locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `${cfg.namespace}.seo` });
  const url = `${BASE}${localPath(locale, cfg.path)}`;
  const og = `${cfg.assets}/feature/og-image.jpg`;
  return {
    title: t('title'), description: t('description'),
    alternates: { canonical: url, languages: Object.fromEntries(locales.map((l) => [l, `${BASE}${localPath(l, cfg.path)}`])) },
    openGraph: { title: t('ogTitle'), description: t('ogDescription'), url, siteName: 'Easy Nano Banana', type: 'website',
      images: [{ url: og, width: 1200, height: 630, alt: t('ogTitle') }] },
    twitter: { card: 'summary_large_image', title: t('ogTitle'), description: t('ogDescription'), images: [og] },
  };
}
