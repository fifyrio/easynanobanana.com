import fs from 'fs';
import path from 'path';
import AiHairstyleExperience from '@/components/AiHairstyleExperience';

export const metadata = {
  title: 'AI Hairstyle Changer | Try Virtual Haircuts & Hair Colors Free',
  description: 'Upload a selfie and describe your dream haircut. Our AI hairstyle changer previews new cuts, bangs, and bold colors instantly so you can experiment risk-free.',
  keywords: [
    'ai hairstyle changer',
    'virtual haircut',
    'try on hairstyles online',
    'ai hair color',
    'virtual salon',
  ],
};

const presetBasePath = path.join(process.cwd(), 'public/images/showcases/ai-hairstyle-changer/preset');

function getPresetImages(subfolder: 'style' | 'color') {
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
    .map((file) => `/images/showcases/ai-hairstyle-changer/preset/${subfolder}/${file}`);
}

export default function AiHairstylePage() {
  const stylePresets = getPresetImages('style');
  const colorPresets = getPresetImages('color');

  return <AiHairstyleExperience stylePresets={stylePresets} colorPresets={colorPresets} />;
}
