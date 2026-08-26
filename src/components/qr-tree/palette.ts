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
  /**
   * Flat-QR mosaic colours for dark modules — the tree's colour DNA becomes
   * the code. Mostly deep tones (keeps luminance contrast for scanning) with
   * a few brighter accents mixed in sparsely.
   */
  qrDark: string[];
  /** Sparse accent tones (~12% of dark modules) — olive/tan in the reference. */
  qrDarkAccent: string[];
  /** Flat-QR light-module creams (slight per-tile variation). */
  qrLight: string[];
}

export const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    background: '#f3ece1',
    tileDark: '#ddd5c4',
    tileLight: '#efeade',
    foliage: ['#f7b7d2', '#f9c9dd', '#e79ac0', '#c7e39a'],
    trunk: '#7c5a43',
    grass: '#8fca5c',
    accent: '#ff7eb0',
    qrDark: ['#2f7d2a', '#3a8a30', '#48923a', '#276f24', '#357c2c'],
    qrDarkAccent: ['#9c4f7d', '#6e6a2f'],
    qrLight: ['#f4eee0', '#efe8d7', '#f7f2e6'],
  },
  summer: {
    background: '#f1ede2',
    tileDark: '#dcd4c3',
    tileLight: '#eee9dd',
    foliage: ['#6db84e', '#7ec95b', '#5aa53f', '#8ed468'],
    trunk: '#6f4f3a',
    grass: '#63b23f',
    accent: '#3fb0d8',
    qrDark: ['#2d7a1f', '#38872a', '#468c30', '#256b1c', '#31752a'],
    qrDarkAccent: ['#6e6a2f', '#77733a'],
    qrLight: ['#f4eee0', '#efe8d7', '#f7f2e6'],
  },
  autumn: {
    background: '#f4ebdd',
    tileDark: '#ded2bd',
    tileLight: '#efe8d6',
    foliage: ['#e8913b', '#d96f2e', '#f0b24a', '#c9552b'],
    trunk: '#5f4433',
    grass: '#c79a4a',
    accent: '#e05a2b',
    qrDark: ['#9c4a1a', '#8a3d16', '#a85420', '#7a3512', '#b05e22'],
    qrDarkAccent: ['#6e5a2f', '#7a6a35'],
    qrLight: ['#f6efdf', '#f1e9d5', '#f8f3e7'],
  },
};
