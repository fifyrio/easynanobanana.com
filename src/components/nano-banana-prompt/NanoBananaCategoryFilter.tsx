'use client';

import { useTranslations } from 'next-intl';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  'allWorks',
  'portrait',
  'illustration',
  'logoDesign',
  'productShot',
  'minimalist',
  'comicArt',
  'imageEdit',
  'styleTransfer',
  'fashion',
];

export function NanoBananaCategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const t = useTranslations('nanoBananaPrompt.categories');

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === category
                ? 'bg-yellow-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t(category)}
          </button>
        ))}
      </div>
    </div>
  );
}
