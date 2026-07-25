'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Header from '@/components/common/Header';
import Pagination from '@/components/common/Pagination';
import { useAssets } from '@/hooks/useAssets';
import { useImageDownload } from '@/hooks/useImageDownload';
import type { AssetItem, AssetView } from '@/types/assets';

// Sidebar navigation entries. `key` maps to the API `view` param.
const LIBRARY_ITEMS: { key: AssetView; label: string; icon: React.ReactNode }[] = [
  {
    key: 'all',
    label: 'All Assets',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'favorites',
    label: 'Favorites',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

const TOOL_ITEMS: { key: AssetView; label: string; icon: React.ReactNode }[] = [
  {
    key: 'image',
    label: 'Image',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'video',
    label: 'Video',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'audio',
    label: 'Audio',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
];

const VIEW_TITLES: Record<string, string> = {
  all: 'All assets',
  favorites: 'Favorites',
  image: 'Images',
  video: 'Videos',
  audio: 'Audio',
};

export default function AssetsPage() {
  const router = useRouter();
  const {
    assets,
    counts,
    view,
    setView,
    searchQuery,
    setSearchQuery,
    loading,
    currentPage,
    totalPages,
    total,
    goToPage,
    toggleFavorite,
  } = useAssets();

  const { downloadImage, isDisabled } = useImageDownload();
  const [selected, setSelected] = useState<AssetItem | null>(null);

  const countFor = (key: AssetView): number => {
    if (key === 'all') return counts.all;
    if (key === 'favorites') return counts.favorites;
    return counts[key];
  };

  const handleDownload = (asset: AssetItem) => {
    const ext = asset.kind === 'video' ? 'mp4' : 'png';
    downloadImage(asset.media_url, 'preview', `${asset.title || 'asset'}.${ext}`);
  };

  const handleFavorite = async (asset: AssetItem) => {
    const ok = await toggleFavorite(asset);
    if (ok) {
      toast.success(asset.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } else {
      toast.error('Could not update favorite');
    }
  };

  const renderSidebarButton = (item: { key: AssetView; label: string; icon: React.ReactNode }) => {
    const active = view === item.key;
    return (
      <button
        key={item.key}
        onClick={() => setView(item.key)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          active ? 'bg-[#FFF3B2] text-[#8A6A00]' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className={active ? 'text-[#C69312]' : 'text-slate-400'}>{item.icon}</span>
          {item.label}
        </span>
        <span className={`text-xs ${active ? 'text-[#C69312]' : 'text-slate-400'}`}>
          {countFor(item.key)}
        </span>
      </button>
    );
  };

  return (
    <React.Fragment>
      <Header />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white lg:min-h-[calc(100vh-4rem)] p-4">
            <div className="relative mb-5">
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
              />
            </div>

            <nav className="space-y-1">{LIBRARY_ITEMS.map(renderSidebarButton)}</nav>

            <p className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Tools
            </p>
            <nav className="space-y-1">{TOOL_ITEMS.map(renderSidebarButton)}</nav>
          </aside>

          {/* Main */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{VIEW_TITLES[view] || 'Assets'}</h1>
                {!loading && total > 0 && (
                  <p className="mt-1 text-sm text-slate-500">{total} item{total === 1 ? '' : 's'}</p>
                )}
              </div>
              <button
                onClick={() => router.push('/image-editor')}
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V7H3a1 1 0 010-2h1V4a1 1 0 011-1zm9 3a1 1 0 01.894.553l.448.894.894.448a1 1 0 010 1.79l-.894.448-.448.894a1 1 0 01-1.79 0l-.448-.894-.894-.448a1 1 0 010-1.79l.894-.448.448-.894A1 1 0 0114 6z" />
                </svg>
                Generate
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-yellow-500" />
                <p className="mt-4 text-slate-500 text-sm">Loading your assets...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {view === 'favorites' ? 'No favorites yet' : 'Your generations will appear here'}
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-xs">
                  {view === 'favorites'
                    ? 'Tap the heart on any asset to save it here.'
                    : 'Generate images to start building your library.'}
                </p>
                <button
                  onClick={() => router.push('/image-editor')}
                  className="mt-6 inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M14 6a1 1 0 01.894.553l.448.894.894.448a1 1 0 010 1.79l-.894.448-.448.894a1 1 0 01-1.79 0l-.448-.894-.894-.448a1 1 0 010-1.79l.894-.448.448-.894A1 1 0 0114 6z" />
                  </svg>
                  Generate
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setSelected(asset)}
                      className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="relative aspect-square bg-slate-100">
                        {asset.thumbnail_url ? (
                          <Image
                            src={asset.thumbnail_url}
                            alt={asset.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover"
                          />
                        ) : asset.kind === 'video' ? (
                          <video
                            src={asset.media_url}
                            muted
                            playsInline
                            preload="metadata"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={asset.media_url}
                            alt={asset.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover"
                          />
                        )}

                        {/* Video play badge */}
                        {asset.kind === 'video' && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-10 h-10 rounded-full bg-black/45 backdrop-blur flex items-center justify-center">
                              <svg className="w-5 h-5 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.8A1 1 0 004.8 3.7v12.6a1 1 0 001.5.87l10.5-6.3a1 1 0 000-1.74L6.3 2.8z" />
                              </svg>
                            </span>
                          </span>
                        )}

                        {/* Favorite toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFavorite(asset);
                          }}
                          aria-label={asset.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        >
                          <svg
                            className={`w-4 h-4 ${asset.is_favorite ? 'text-rose-500' : 'text-slate-500'}`}
                            fill={asset.is_favorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>

                        {asset.is_favorite && (
                          <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center group-hover:opacity-0 transition-opacity">
                            <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </span>
                        )}

                        {/* Download on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(asset);
                          }}
                          disabled={isDisabled('preview')}
                          aria-label="Download"
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-slate-700 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-2.5">
                        <p className="text-xs text-slate-700 line-clamp-1">{asset.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(asset.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={goToPage}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-slate-900 rounded-t-2xl overflow-hidden">
              {selected.kind === 'video' ? (
                <video
                  src={selected.media_url}
                  controls
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <Image src={selected.media_url} alt={selected.title} fill className="object-contain" />
              )}
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">{selected.title}</h3>
              {selected.prompt && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Prompt</label>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selected.prompt}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
                <span>Created: {new Date(selected.created_at).toLocaleString()}</span>
                {selected.subtype && (
                  <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full font-medium">
                    {selected.subtype}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleDownload(selected)}
                  disabled={isDisabled('preview')}
                  className="flex-1 min-w-[120px] bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  Download
                </button>
                <button
                  onClick={async () => {
                    await handleFavorite(selected);
                    setSelected({ ...selected, is_favorite: !selected.is_favorite });
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  {selected.is_favorite ? '♥ Favorited' : '♡ Favorite'}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
