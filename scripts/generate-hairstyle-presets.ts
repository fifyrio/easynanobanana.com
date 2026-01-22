import fs from 'fs';
import path from 'path';

type PresetAsset = {
  displaySrc: string;
  referenceSrc: string;
  fileName: string;
  name: string;
};

const presetBasePath = path.join(
  process.cwd(),
  'public/images/showcases/ai-hairstyle-changer/preset'
);
const styleCdnPrefix =
  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-hairstyle-changer/preset/style';
const colorCdnPrefix =
  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-hairstyle-changer/preset/color';

const formatName = (file: string) =>
  file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

const readPresets = (subfolder: 'style' | 'color'): PresetAsset[] => {
  const dir = path.join(presetBasePath, subfolder);
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch (error) {
    console.error(`Failed to read preset images from ${dir}`, error);
    return [];
  }

  return entries
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const displaySrc = `/images/showcases/ai-hairstyle-changer/preset/${subfolder}/${file}`;
      const referenceSrc =
        subfolder === 'style'
          ? `${styleCdnPrefix}/${file}`
          : `${colorCdnPrefix}/${file}`;
      return {
        displaySrc,
        referenceSrc,
        fileName: file,
        name: formatName(file),
      };
    });
};

const outputPath = path.join(process.cwd(), 'src/data/ai-hairstyle-presets.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const data = {
  style: readPresets('style'),
  color: readPresets('color'),
};

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Generated ${outputPath}`);
