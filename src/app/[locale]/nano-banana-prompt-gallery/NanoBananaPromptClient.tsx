'use client';

import { useEffect, useState, useCallback } from 'react';
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

const ITEMS_PER_PAGE = 28;

export default function NanoBananaPromptClient({ locale }: NanoBananaPromptClientProps) {
  const t = useTranslations('nanoBananaPrompt');
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  // Fetch prompts with server-side pagination
  const fetchPrompts = useCallback(async (
    page: number,
    search: string = '',
    category: string = ''
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Build API URL with query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: ITEMS_PER_PAGE.toString(),
        locale: locale,
      });

      if (search) {
        params.append('search', search);
      }

      if (category && category !== 'allWorks') {
        params.append('tags', category);
      }

      const response = await fetch(`/api/nano-banana-prompts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      setPrompts(data.prompts || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`/api/nano-banana-prompts/tags?limit=20&locale=${locale}`);
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags || []);
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };

    fetchTags();
  }, [locale]);

  // Initial fetch
  useEffect(() => {
    fetchPrompts(1, searchQuery, activeCategory);
  }, [fetchPrompts, locale]); // Only run on mount and locale change

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    fetchPrompts(1, query, activeCategory); // Reset to page 1
  }, [fetchPrompts, activeCategory]);

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    fetchPrompts(1, searchQuery, category); // Reset to page 1
  }, [fetchPrompts, searchQuery]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    fetchPrompts(page, searchQuery, activeCategory);
    // Scroll to top of gallery
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchPrompts, searchQuery, activeCategory]);

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
                {loading ? '...' : t('hero.totalCases', { count: totalCount })}
              </p>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="container mx-auto px-4 py-8 max-w-7xl">
          {error ? (
            <div className="text-center py-20">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg mb-2">Failed to load prompts</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <button
                onClick={() => fetchPrompts(currentPage, searchQuery, activeCategory)}
                className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <NanoBananaGallery
              items={prompts}
              initialTags={tags}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onSearch={handleSearch}
              onCategoryChange={handleCategoryChange}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </main>
    </div>
  );
}
