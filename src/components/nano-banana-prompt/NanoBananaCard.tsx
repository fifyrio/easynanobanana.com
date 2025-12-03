'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface GalleryItem {
  id: number;
  title: string;
  prompt: string;
  imageUrl: string;
  tags: string[];
  category: string;
  author: string;
  authorUrl?: string;
}

interface NanoBananaCardProps {
  item: GalleryItem;
}

export function NanoBananaCard({ item }: NanoBananaCardProps) {
  const t = useTranslations('nanoBananaPrompt.card');
  const tModal = useTranslations('nanoBananaPrompt.modal');
  const [copied, setCopied] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [popupImageLoaded, setPopupImageLoaded] = useState(false);

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        onClick={() => setIsPopupOpen(true)}
        className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:border-yellow-300 transition-all duration-300 cursor-pointer"
      >
        {/* Image Container */}
        <div className="relative">
          {/* Placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-gray-100 to-yellow-50 flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-300 border-t-yellow-500 animate-spin" />
                </div>
                <span className="text-xs text-gray-500 font-medium">{t('loading')}</span>
              </div>
            </div>
          )}
          <Image
            src={item.imageUrl}
            alt={item.prompt}
            width={400}
            height={400}
            className={`w-full h-auto object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base text-gray-900 leading-snug">{item.title}</h3>
          </div>

          {/* Prompt text always visible */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-[7]">{item.prompt}</p>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">by {item.author}</span>
            <button
              onClick={handleCopyPrompt}
              className="h-8 px-3 text-xs font-medium border border-gray-300 text-gray-700 hover:bg-yellow-500 hover:text-white hover:border-yellow-500 transition-colors bg-white rounded-lg flex items-center gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('copied')}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {t('copy')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsPopupOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative">
              {/* Popup Placeholder */}
              {!popupImageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-gray-100 to-yellow-50 flex items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-yellow-300 border-t-yellow-500 animate-spin" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{t('loadingImage')}</span>
                  </div>
                </div>
              )}
              <Image
                src={item.imageUrl}
                alt={item.prompt}
                width={800}
                height={800}
                className={`w-full h-auto object-cover transition-opacity duration-500 ${popupImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setPopupImageLoaded(true)}
              />
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Full Prompt */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{tModal('prompt')}</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{item.prompt}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {tModal('createdBy', { author: '' })}
                  {item.authorUrl ? (
                    <a
                      href={item.authorUrl}
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-gray-900 hover:text-yellow-500 hover:underline transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.author}
                    </a>
                  ) : (
                    <span className="font-medium text-gray-900">{item.author}</span>
                  )}
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('copied')}!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {tModal('copyPrompt')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
