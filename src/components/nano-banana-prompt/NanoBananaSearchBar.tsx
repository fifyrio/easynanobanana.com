'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  onSearch: (query: string) => void;
  filteredCount: number;
  totalCount: number;
  isSearching: boolean;
}

export function NanoBananaSearchBar({ onSearch, filteredCount, totalCount, isSearching }: SearchBarProps) {
  const t = useTranslations('nanoBananaPrompt.search');
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl">
      <div className="relative flex-1 w-full">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={t('placeholder')}
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="pl-10 pr-10 h-10 w-full bg-white border border-yellow-200 focus:border-yellow-500 focus:ring focus:ring-yellow-200 rounded-full outline-none transition-colors text-gray-900"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-yellow-50 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600 whitespace-nowrap">
        {isSearching ? (
          <span>
            <span className="font-medium text-yellow-500">{filteredCount}</span>
            {' / '}
            <span>{totalCount}</span>
            {' cases · Search applied'}
          </span>
        ) : (
          <span>{t('resultsCount', { count: totalCount })}</span>
        )}
      </div>
    </div>
  );
}
