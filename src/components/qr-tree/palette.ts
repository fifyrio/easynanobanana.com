export type Season = 'spring' | 'summer' | 'autumn';
export type Centerpiece = 'banana' | 'tree' | 'rocket';

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

/**
 * Rocket-launchpad theme palettes. Same structure so the ground/grass systems
 * are fully reused. Semantics for the rocket variant:
 * - foliage: rocket accent colours (nose cone, band, fins pick from these)
 * - trunk: pad/gantry metal colour
 * - grass: field grass around the pad
 * - accent: flame core colour
 * Theme slots map to Dawn (spring), Day (summer), Dusk (autumn).
 */
export const ROCKET_PALETTES: Record<Season, SeasonPalette> = {
  // Dawn launch: peach sky, rust/orange mosaic
  spring: {
    background: '#f7ead9',
    tileDark: '#ded2bd',
    tileLight: '#efe8d6',
    foliage: ['#e2574c', '#f0a03a', '#ffffff', '#3e4a5a'],
    trunk: '#8a8f98',
    grass: '#8fb45c',
    accent: '#ff9a3c',
    qrDark: ['#a34a20', '#8a3d16', '#b05622', '#7a3512', '#9c5a1e'],
    qrDarkAccent: ['#6e5a2f', '#845a35'],
    qrLight: ['#f6efdf', '#f1e9d5', '#f8f3e7'],
  },
  // Day launch: cream sky, deep navy/blue mosaic
  summer: {
    background: '#f1ede2',
    tileDark: '#dcd4c3',
    tileLight: '#eee9dd',
    foliage: ['#d94f3d', '#2e5f8a', '#ffffff', '#3e4a5a'],
    trunk: '#8a8f98',
    grass: '#63b23f',
    accent: '#ff8c2e',
    qrDark: ['#1f3f66', '#28527f', '#183454', '#2f5c8a', '#24486e'],
    qrDarkAccent: ['#4f5a2f', '#5a4a6e'],
    qrLight: ['#f4eee0', '#efe8d7', '#f7f2e6'],
  },
  // Dusk launch: lavender sky, deep purple/magenta mosaic
  autumn: {
    background: '#f2e8ea',
    tileDark: '#dcd0c8',
    tileLight: '#eee6df',
    foliage: ['#b04a7a', '#5a4a8a', '#ffffff', '#3e4a5a'],
    trunk: '#7c7f8a',
    grass: '#7aa04f',
    accent: '#ff7a4a',
    qrDark: ['#5a2f66', '#6e2f5a', '#4a2454', '#7a3a6e', '#54306e'],
    qrDarkAccent: ['#6e3a45', '#3e4a6e'],
    qrLight: ['#f6eee6', '#f1e8de', '#f8f2ea'],
  },
};

/**
 * Banana-palm theme palettes (Easy Nano Banana signature centerpiece).
 * Semantics for the banana variant:
 * - foliage: palm frond greens (leaflets pick from these)
 * - trunk: palm trunk colour
 * - grass: field grass
 * - accent: banana yellow (ripe)
 * Theme slots map to Sunrise (spring), Noon (summer), Sunset (autumn) — the
 * mosaic QR stays a warm banana-yellow/gold with brown speckle so it still
 * reads as "bananas became the code", while keeping luminance contrast.
 */
export const BANANA_PALETTES: Record<Season, SeasonPalette> = {
  // Sunrise: soft peach sky, golden mosaic
  spring: {
    background: '#fbf1dc',
    tileDark: '#e4d8bf',
    tileLight: '#f2ecd9',
    foliage: ['#4f9b3e', '#5fb04a', '#3f8a33', '#79c85f'],
    trunk: '#8a6a44',
    grass: '#8fca5c',
    accent: '#ffcf3f',
    qrDark: ['#6a4409', '#5c3a07', '#75500d', '#4e3305', '#634209'],
    qrDarkAccent: ['#6e4e12', '#5a3a16'],
    qrLight: ['#f6eecb', '#f1e6bf', '#f8f2d6'],
  },
  // Noon: bright cream sky, vivid yellow mosaic
  summer: {
    background: '#f7f1df',
    tileDark: '#e2d7bc',
    tileLight: '#f0ead4',
    foliage: ['#3f9a2f', '#54b03f', '#2f8524', '#6fc84f'],
    trunk: '#7c5f3c',
    grass: '#63b23f',
    accent: '#ffd21f',
    qrDark: ['#6e4e05', '#5e4204', '#7a5a08', '#523c03', '#664a06'],
    qrDarkAccent: ['#6e5410', '#5a460c'],
    qrLight: ['#f7f0cd', '#f2e9c2', '#faf4d8'],
  },
  // Sunset: warm rose sky, amber mosaic
  autumn: {
    background: '#f9ecdd',
    tileDark: '#e6d6be',
    tileLight: '#f2e8d5',
    foliage: ['#4a8f36', '#5aa544', '#3a7a2c', '#6fbf52'],
    trunk: '#6f5236',
    grass: '#c79a4a',
    accent: '#ffb52e',
    qrDark: ['#68400a', '#5a3707', '#734a0d', '#4e3006', '#623c0a'],
    qrDarkAccent: ['#6e4614', '#5a3616'],
    qrLight: ['#f7edcf', '#f2e4c3', '#faf1d9'],
  },
};
