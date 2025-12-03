'use client';

import { useTranslations } from 'next-intl';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function NanoBananaCategoryFilter({ activeCategory, onCategoryChange, categories }: CategoryFilterProps) {
  const t = useTranslations('nanoBananaPrompt.categories');

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

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 justify-center">
        {allCategories.map(category => {
          const isAllWorks = category === 'allWorks';
          const displayName = isAllWorks ? t('allWorks') : formatTag(category);

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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
    </div>
  );
}
