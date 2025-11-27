import fs from 'fs';
import path from 'path';
import AiAnimeGeneratorExperience, { PresetAsset } from '@/components/AiAnimeGeneratorExperience';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'aiAnimeGenerator.hero' });

  return {
    title: t('title'),
    description: t('subtitle'),
    keywords: [
      'ai anime generator',
      'photo to anime',
      'anime avatar maker',
      'anime portrait ai',
      'cartoon yourself anime',
    ],
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      url: 'https://www.easynanobanana.com/ai-anime-generator',
      siteName: 'EasyNanoBanana',
      images: [
        {
          url: 'https://www.easynanobanana.com/images/showcases/ai-anime-generator/feature/showcase-1.jpg',
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
      images: ['https://www.easynanobanana.com/images/showcases/ai-anime-generator/feature/showcase-1.jpg'],
    },
    alternates: {
      canonical: 'https://www.easynanobanana.com/ai-anime-generator',
    },
  };
}

const presetBasePath = path.join(process.cwd(), 'public/images/showcases/ai-anime-generator/preset');
const styleCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-anime-generator/preset/style';
const effectCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-anime-generator/preset/effect';

const formatName = (file: string) => file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

type PresetFolder = 'style' | 'effect';

function getPresetImages(subfolder: PresetFolder): PresetAsset[] {
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
      const displaySrc = `/images/showcases/ai-anime-generator/preset/${subfolder}/${file}`;
      const referenceSrc =
        subfolder === 'style'
          ? `${styleCdnPrefix}/${file}`
          : `${effectCdnPrefix}/${file}`;

      return {
        displaySrc,
        referenceSrc,
        fileName: file,
        name: formatName(file),
      } satisfies PresetAsset;
    });
}

export default function AiAnimeGeneratorPage() {
  const stylePresets = getPresetImages('style');
  const effectPresets = getPresetImages('effect');

  return <AiAnimeGeneratorExperience stylePresets={stylePresets} effectPresets={effectPresets} />;
}
