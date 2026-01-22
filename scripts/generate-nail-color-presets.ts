import fs from 'fs';
import path from 'path';

type PresetAsset = {
  displaySrc: string;
  referenceSrc: string;
  fileName: string;
  name: string;
};

const buildSvgDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const buildLabelSvg = (label: string, accent: string) => {
  return buildSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" rx="36" fill="#FFFBEA" />
      <rect x="18" y="18" width="164" height="164" rx="32" fill="${accent}" />
      <text x="100" y="115" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#5C4500" font-weight="600">${label}</text>
    </svg>
  `);
};

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const formatPresetName = (file: string) => {
  const raw = file.replace(/\.[^/.]+$/, '');
  const withoutPrefix = raw.replace(/^NailsColor/, '');
  const spaced = withoutPrefix
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ');
  const cleaned = spaced.replace(/\s+/g, ' ').trim();
  return cleaned || raw;
};

const makePreset = (name: string, displaySrc: string): PresetAsset => {
  const slug = slugify(name);
  return {
    name,
    displaySrc,
    referenceSrc: slug,
    fileName: `${slug}.svg`,
  };
};

const colorPresetBasePath = path.join(
  process.cwd(),
  'public/images/showcases/ai-nail-color-changer/preset/color'
);
const colorCdnPrefix =
  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-nail-color-changer/preset/color';

const getColorPresets = (): PresetAsset[] => {
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(colorPresetBasePath);
  } catch (error) {
    console.error(`Failed to read preset images from ${colorPresetBasePath}`, error);
    return [];
  }

  return entries
    .filter((file) => /\.(png|jpe?g|webp|heic)$/i.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const name = formatPresetName(file);
      return {
        name,
        displaySrc: `${colorCdnPrefix}/${file}`,
        referenceSrc: `${colorCdnPrefix}/${file}`,
        fileName: file,
      };
    });
};

const shapePresets: PresetAsset[] = [
  { name: 'Round', accent: '#FFE3B5' },
  { name: 'Square', accent: '#FFD6A1' },
  { name: 'Almond', accent: '#FFE7A1' },
  { name: 'Coffin', accent: '#FDD893' },
  { name: 'Stiletto', accent: '#FFE0A6' },
  { name: 'Squoval', accent: '#FFDFAF' },
].map((preset) => makePreset(preset.name, buildLabelSvg(preset.name, preset.accent)));

const stickerPresets: PresetAsset[] = [
  { name: 'Star', accent: '#FFF0C2' },
  { name: 'Heart', accent: '#FFE8D1' },
  { name: 'Floral', accent: '#FFE5B8' },
  { name: 'Chrome', accent: '#F8E4B2' },
  { name: 'Glitter', accent: '#FFE1B4' },
  { name: 'Marble', accent: '#F9E2C3' },
].map((preset) => makePreset(preset.name, buildLabelSvg(preset.name, preset.accent)));

const outputPath = path.join(process.cwd(), 'src/data/ai-nail-color-presets.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const data = {
  color: getColorPresets(),
  shape: shapePresets,
  sticker: stickerPresets,
};

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Generated ${outputPath}`);
