'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { NanoBananaSearchBar } from './NanoBananaSearchBar';
import { NanoBananaCategoryFilter } from './NanoBananaCategoryFilter';
import { NanoBananaCard } from './NanoBananaCard';

export interface PromptItem {
  id: number;
  title: string;
  prompt: string;
  imageUrl: string;
  tags: string[];
  category: string;
  author: string;
}

interface NanoBananaGalleryProps {
  items: PromptItem[];
  initialTags?: string[];
}

const ITEMS_PER_PAGE = 28;

export function NanoBananaGallery({ items, initialTags = [] }: NanoBananaGalleryProps) {
  const t = useTranslations('nanoBananaPrompt');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('allWorks');

  // Items are already in the correct format from API
  const translatedItems = items;

  // Filter by category (tag)
  const categoryFilteredItems = useMemo(() => {
    if (activeCategory === 'allWorks') return translatedItems;
    // Filter items that contain the selected tag
    return translatedItems.filter(item => 
      Array.isArray(item.tags) && item.tags.includes(activeCategory)
    );
  }, [translatedItems, activeCategory]);

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return categoryFilteredItems;
    const query = searchQuery.toLowerCase();
    return categoryFilteredItems.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.prompt.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [categoryFilteredItems, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Category Filter */}
      <NanoBananaCategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        categories={initialTags}
      />

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <NanoBananaSearchBar
          onSearch={handleSearch}
          filteredCount={filteredItems.length}
          totalCount={translatedItems.length}
          isSearching={searchQuery.trim().length > 0}
        />
      </div>

      {/* Gallery Grid */}
      {currentItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-lg">
            {t('search.noResults', { query: searchQuery })}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {t('search.noResultsHint')}
          </p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-4 gap-6 space-y-6">
          {currentItems.map(item => (
            <div key={item.id} className="break-inside-avoid mb-6">
              <NanoBananaCard item={item} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="border border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-white text-gray-700 border border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="border border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

