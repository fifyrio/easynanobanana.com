'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/common/Header';
import { NanoBananaGallery } from '@/components/nano-banana-prompt/NanoBananaGallery';

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

interface NanoBananaPromptClientProps {
  locale: string;
}

export default function NanoBananaPromptClient({ locale }: NanoBananaPromptClientProps) {
  const t = useTranslations('nanoBananaPrompt');
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch prompts and tags in parallel
        // Fetch up to 600 prompts for client-side pagination
        const [promptsResponse, tagsResponse] = await Promise.all([
          fetch(`/api/nano-banana-prompts?pageSize=600&locale=${locale}`),
          fetch(`/api/nano-banana-prompts/tags?limit=20&locale=${locale}`)
        ]);

        if (!promptsResponse.ok) {
          throw new Error('Failed to fetch prompts');
        }

        const promptsData = await promptsResponse.json();
        setPrompts(promptsData.prompts);

        // Handle tags separately - if it fails, just use empty array
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData.tags || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locale]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-4 md:py-6">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-50/50 to-gray-50" />

          <div className="container mx-auto px-4 relative max-w-7xl">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Nano <span className="text-yellow-500">Banana</span> Pro Prompts Gallery
              </h1>

              <p className="text-xs md:text-sm text-gray-600">
                {t('hero.subtitle')}
              </p>

              <p className="text-xs text-yellow-500 font-medium mt-2">
                {loading ? '...' : t('hero.totalCases', { count: prompts.length })}
              </p>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="container mx-auto px-4 py-8 max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-300 border-t-yellow-500 animate-spin" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Loading prompts...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg mb-2">Failed to load prompts</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <NanoBananaGallery items={prompts} initialTags={tags} />
          )}
        </section>
      </main>
    </div>
  );
}
