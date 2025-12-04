'use client';

import { useState } from 'react';
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
  authorUrl?: string;
}

interface NanoBananaGalleryProps {
  items: PromptItem[];
  initialTags?: string[];
  loading?: boolean;
  currentPage: number;
  totalPages: number;
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onPageChange: (page: number) => void;
}

export function NanoBananaGallery({
  items,
  initialTags = [],
  loading = false,
  currentPage,
  totalPages,
  onSearch,
  onCategoryChange,
  onPageChange,
}: NanoBananaGalleryProps) {
  const t = useTranslations('nanoBananaPrompt');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('allWorks');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    onCategoryChange(category === 'allWorks' ? '' : category);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="columns-1 md:columns-2 lg:columns-4 gap-6 space-y-6">
      {Array.from({ length: 28 }).map((_, index) => (
        <div key={index} className="break-inside-avoid mb-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="flex gap-2 mt-3">
                <div className="h-6 bg-gray-200 rounded-full w-16" />
                <div className="h-6 bg-gray-200 rounded-full w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
          filteredCount={items.length}
          totalCount={items.length}
          isSearching={searchQuery.trim().length > 0}
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">
            {searchQuery ? t('search.noResults', { query: searchQuery }) : 'No prompts found'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {searchQuery ? t('search.noResultsHint') : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-4 gap-6 space-y-6">
          {items.map(item => (
            <div key={item.id} className="break-inside-avoid mb-6">
              <NanoBananaCard item={item} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="border border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
            aria-label="Previous page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page numbers with smart display (show max 7 pages) */}
          {(() => {
            const maxVisible = 7;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);

            if (endPage - startPage < maxVisible - 1) {
              startPage = Math.max(1, endPage - maxVisible + 1);
            }

            const pages = [];

            // First page
            if (startPage > 1) {
              pages.push(
                <button
                  key={1}
                  onClick={() => handlePageClick(1)}
                  className="min-w-[40px] h-10 rounded-lg transition-colors bg-white text-gray-700 border border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500"
                >
                  1
                </button>
              );
              if (startPage > 2) {
                pages.push(
                  <span key="ellipsis1" className="text-gray-400 px-2">...</span>
                );
              }
            }

            // Page range
            for (let page = startPage; page <= endPage; page++) {
              pages.push(
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
              );
            }

            // Last page
            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(
                  <span key="ellipsis2" className="text-gray-400 px-2">...</span>
                );
              }
              pages.push(
                <button
                  key={totalPages}
                  onClick={() => handlePageClick(totalPages)}
                  className="min-w-[40px] h-10 rounded-lg transition-colors bg-white text-gray-700 border border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500"
                >
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="border border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
            aria-label="Next page"
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
