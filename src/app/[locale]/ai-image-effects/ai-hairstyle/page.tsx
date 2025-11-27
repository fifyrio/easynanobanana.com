import fs from 'fs';
import path from 'path';
import AiHairstyleExperience, { PresetAsset } from '@/components/AiHairstyleExperience';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiHairstyle.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
    keywords: [
      'ai hairstyle changer',
      'virtual haircut',
      'try on hairstyles online',
      'ai hair color',
      'virtual salon',
    ],
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      url: 'https://www.easynanobanana.com/ai-image-effects/ai-hairstyle',
      siteName: 'EasyNanoBanana',
      images: [
        {
          url: 'https://www.easynanobanana.com/images/showcases/ai-hairstyle-changer/feature/showcase-1.jpg',
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('subtitle'),
      images: ['https://www.easynanobanana.com/images/showcases/ai-hairstyle-changer/feature/showcase-1.jpg'],
    },
  };
}

const presetBasePath = path.join(process.cwd(), 'public/images/showcases/ai-hairstyle-changer/preset');
const styleCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-hairstyle-changer/preset/style';
const colorCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-hairstyle-changer/preset/color';

const formatName = (file: string) => file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

function getPresetImages(subfolder: 'style' | 'color'): PresetAsset[] {
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
}

export default function AiHairstylePage() {
  const stylePresets = getPresetImages('style');
  const colorPresets = getPresetImages('color');

  return <AiHairstyleExperience stylePresets={stylePresets} colorPresets={colorPresets} />;
}
