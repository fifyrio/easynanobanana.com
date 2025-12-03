'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function NanoBananaCategoryFilter({ activeCategory, onCategoryChange, categories }: CategoryFilterProps) {
  const t = useTranslations('nanoBananaPrompt.categories');
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to format tag names (e.g., "character-design" -> "Character Design")
  const formatTag = (tag: string) => {
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Combine 'allWorks' with dynamic categories
  // Ensure unique values and filter out empty strings
  const allCategories = ['allWorks', ...categories.filter(Boolean)];

  // Simple heuristic: if less than 10 categories, probably fits in one or two lines, 
  // but user asked for "1 row". 10 tags might be 2 rows on mobile.
  // Let's always show the button if we have a significant number of tags, say > 5.
  // Or just rely on the visual overflow hidden.
  const showExpandButton = allCategories.length > 8;

  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      <div 
        className={`flex flex-wrap gap-2 justify-center transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-[40px]'
        }`}
      >
        {allCategories.map(category => {
          const isAllWorks = category === 'allWorks';
          const displayName = isAllWorks ? t('allWorks') : formatTag(category);

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {displayName}
            </button>
          );
        })}
      </div>
      
      {showExpandButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-yellow-500 transition-colors"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          <svg 
            className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
