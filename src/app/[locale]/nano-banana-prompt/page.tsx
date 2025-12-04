import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import NanoBananaPromptClient from './NanoBananaPromptClient';

export interface PromptItem {
  id: number;
  title: string;
  prompt: string;
  imageUrl: string;
  tags: string[];
  category: string;
  author: string;
  authorUrl?: string;
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'nanoBananaPrompt.seo' });
  const tHero = await getTranslations({ locale, namespace: 'nanoBananaPrompt.hero' });

  const baseUrl = 'https://www.easynanobanana.com';
  // English locale uses root path without /en prefix
  const pathSegment = locale === 'en' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${pathSegment}/nano-banana-prompt`;

  return {
    title: t('title'),
    description: t('description'),
    keywords: [
      'AI prompts',
      'prompt engineering',
      'AI art',
      'portrait prompts',
      'logo design',
      'prompt library',
    ],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
      siteName: 'Nano Banana Pro',
      images: [
        {
          url: `${baseUrl}/images/nano-banana-prompts-og.jpg`,
          width: 1200,
          height: 630,
          alt: tHero('title'),
        },
      ],
      locale: locale === 'zh' ? 'zh_CN' : locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [`${baseUrl}/images/nano-banana-prompts-og.jpg`],
      creator: '@NanoBanana',
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/nano-banana-prompt`,
        'zh': `${baseUrl}/zh/nano-banana-prompt`,
        'id': `${baseUrl}/id/nano-banana-prompt`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function NanoBananaPromptPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  return <NanoBananaPromptClient locale={locale} />;
}
