export type Season = 'spring' | 'summer' | 'autumn';

export interface SeasonPalette {
  /** Background clear colour of the scene. */
  background: string;
  /** Raised (dark module) ground tile colour. */
  tileDark: string;
  /** Low (light module) ground tile colour. */
  tileLight: string;
  /** Foliage colours — clusters pick randomly among these. */
  foliage: string[];
  /** Trunk colour. */
  trunk: string;
  /** Grass blade colour. */
  grass: string;
  /** Petal / accent colour scattered in the scene. */
  accent: string;
}

export const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    background: '#f3ece1',
    tileDark: '#b9b2a4',
    tileLight: '#efeae0',
    foliage: ['#f7b7d2', '#f9c9dd', '#e79ac0', '#c7e39a'],
    trunk: '#7c5a43',
    grass: '#8fca5c',
    accent: '#ff7eb0',
  },
  summer: {
    background: '#f1ede2',
    tileDark: '#b3ada0',
    tileLight: '#eee9df',
    foliage: ['#5fa845', '#6cbb4e', '#4f9138', '#7cc85a'],
    trunk: '#6f4f3a',
    grass: '#63b23f',
    accent: '#3fb0d8',
  },
  autumn: {
    background: '#f4ebdd',
    tileDark: '#b6ac9a',
    tileLight: '#efe7d8',
    foliage: ['#e8913b', '#d96f2e', '#f0b24a', '#c9552b'],
    trunk: '#5f4433',
    grass: '#c79a4a',
    accent: '#e05a2b',
  },
};
