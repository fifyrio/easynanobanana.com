'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const locale = useLocale();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [popupImageLoaded, setPopupImageLoaded] = useState(false);
  const primaryTag = item.tags?.[0];

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encodedPrompt = encodeURIComponent(item.prompt);
    router.push(`/${locale}/image-editor?prompt=${encodedPrompt}`);
  };

  return (
    <>
      <div
        onClick={() => setIsPopupOpen(true)}
        className="group relative flex h-full flex-col rounded-[28px] border border-[#f0e4c8] bg-white/95 shadow-[0_14px_40px_rgba(249,186,26,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(249,186,26,0.25)]"
      >
        <div className="relative m-4 min-h-[280px] overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-50 via-gray-100/70 to-yellow-50">
              <div className="flex flex-col items-center gap-3 text-[#f0a000]">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-[#f2c977] border-t-[#f49b00] animate-spin" />
                </div>
                <span className="text-xs font-medium text-gray-600">{t('loading')}</span>
              </div>
            </div>
          )}
          <Image
            src={item.imageUrl}
            alt={item.prompt}
            width={600}
            height={600}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2ZmZjllZCIvPjwvc3ZnPg=="
            className={`h-[280px] w-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        <div className="space-y-4 px-6 pb-6 text-left">
          <div className="space-y-1.5">
            <h3 className="text-xl font-semibold text-[#f3a000]">{item.title}</h3>
            <p className="text-sm text-gray-500">{t('by', { author: item.author })}</p>
            {primaryTag && (
              <span className="inline-flex items-center rounded-full border border-[#f3c676] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f39a00]">
                {primaryTag}
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-[#f3e3c3] bg-[#fff9ed] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium uppercase tracking-wide text-[#e48b00]">{tModal('prompt')}</span>
              <button
                onClick={handleCopyPrompt}
                aria-label={t('copy')}
                className="rounded-full p-2 text-[#e48b00] transition-colors hover:bg-white"
              >
                {copied ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 line-clamp-[7]">{item.prompt}</p>
          </div>

          <button
            type="button"
            onClick={handleGenerateImageClick}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f5b200] py-3 text-base font-semibold text-white transition-all hover:bg-[#f39a00]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l1.2 3.6H17l-3 2.2 1.2 3.7L12 11.5 8.8 13.5 10 9.8 7 7.6h3.8z" />
            </svg>
            {t('generateImage')}
          </button>
        </div>
      </div>

      {isPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#f0e4c8] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPopupOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-2 text-gray-800 shadow hover:bg-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative m-6 min-h-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
              {!popupImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-50 via-gray-100/70 to-yellow-50">
                  <div className="flex flex-col items-center gap-3 text-[#f0a000]">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-[#f2c977] border-t-[#f49b00] animate-spin" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{t('loadingImage')}</span>
                  </div>
                </div>
              )}
              <Image
                src={item.imageUrl}
                alt={item.prompt}
                width={1200}
                height={1200}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIxMjAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjEyMDAiIGZpbGw9IiNmZmY5ZWQiLz48L3N2Zz4="
                className={`h-full w-full object-cover transition-opacity duration-500 ${popupImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setPopupImageLoaded(true)}
              />
            </div>

            <div className="space-y-4 px-6 pb-6 text-left">
              <h3 className="text-2xl font-semibold text-[#f39a00]">{item.title}</h3>
              <p className="text-sm text-gray-500">{t('by', { author: item.author })}</p>
              {primaryTag && (
                <span className="inline-flex items-center rounded-full border border-[#f3c676] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f39a00]">
                  {primaryTag}
                </span>
              )}

              <div className="rounded-2xl border border-[#f3e3c3] bg-[#fff9ed] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wide text-[#e48b00]">{tModal('prompt')}</span>
                  <button
                    onClick={handleCopyPrompt}
                    className="rounded-full p-2 text-[#e48b00] transition-colors hover:bg-white"
                  >
                    {copied ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.prompt}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
                <span>
                  {item.authorUrl ? (
                    <a
                      href={item.authorUrl}
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-gray-900 hover:text-[#f39a00]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tModal('createdBy', { author: item.author })}
                    </a>
                  ) : (
                    tModal('createdBy', { author: item.author })
                  )}
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-2 rounded-full border border-[#f3c676] px-4 py-2 text-sm font-semibold text-[#f39a00] transition-colors hover:bg-[#fff3d6]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? t('copied') : tModal('copyPrompt')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleGenerateImageClick}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f5b200] py-3 text-base font-semibold text-white transition-all hover:bg-[#f39a00]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l1.2 3.6H17l-3 2.2 1.2 3.7L12 11.5 8.8 13.5 10 9.8 7 7.6h3.8z" />
                </svg>
                {t('generateImage')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
