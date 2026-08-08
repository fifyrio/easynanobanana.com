import seasonsJa from '@/data/personal-color/seasons.ja.json';

export interface Swatch {
  name: string;
  hex: string;
  note: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface SeasonSeo {
  title: string;
  description: string;
  keywords: string;
}

export interface Season {
  roman: string;
  name: string;
  kana: string;
  vol: number;
  h1: string;
  lead: string;
  features: string[];
  palette: Swatch[];
  avoid: Swatch[];
  hair: Swatch[];
  faq: Faq[];
  seo: SeasonSeo;
}

const SEASONS = seasonsJa as Record<string, Season>;

/** Ordered season slugs used for cards, nav, and static params. */
export const SEASON_SLUGS = ['iebe-haru', 'iebe-aki', 'burube-natsu', 'burube-fuyu'] as const;

export function getSeason(slug: string): Season | null {
  return SEASONS[slug] ?? null;
}

export function getAllSeasons(): Season[] {
  return SEASON_SLUGS.map((slug) => SEASONS[slug]).filter(Boolean);
}

/** The personal-color content hub is a JA-only track for now. */
export const PERSONAL_COLOR_LOCALE = 'ja';
