'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AssetItem, AssetCounts, AssetView } from '@/types/assets';

const EMPTY_COUNTS: AssetCounts = { all: 0, favorites: 0, image: 0, video: 0, audio: 0 };
const PAGE_SIZE = 24;

export function useAssets() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [counts, setCounts] = useState<AssetCounts>(EMPTY_COUNTS);
  const [view, setView] = useState<AssetView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const getToken = useCallback(async () => {
    const { supabase } = await import('@/lib/supabase');
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  }, []);

  const fetchAssets = useCallback(
    async (nextView: AssetView, search: string, page: number) => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const params = new URLSearchParams({
          view: nextView,
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (search.trim()) params.append('search', search.trim());

        const response = await fetch(`/api/assets?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to fetch assets');

        setAssets(data.assets || []);
        setCounts(data.counts || EMPTY_COUNTS);
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assets');
        console.error('Error fetching assets:', err);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  // Reload when the view changes (reset to page 1).
  useEffect(() => {
    fetchAssets(view, searchQuery, 1);
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Debounced search reload.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets(view, searchQuery, 1);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      fetchAssets(view, searchQuery, page);
    },
    [fetchAssets, view, searchQuery, totalPages]
  );

  const toggleFavorite = useCallback(
    async (asset: AssetItem) => {
      const nextValue = !asset.is_favorite;

      // Optimistic update, roll back on failure.
      setAssets((prev) =>
        prev
          .map((a) => (a.id === asset.id ? { ...a, is_favorite: nextValue } : a))
          // Drop de-favorited items while viewing the Favorites list.
          .filter((a) => (view === 'favorites' ? a.is_favorite : true))
      );
      setCounts((prev) => ({
        ...prev,
        favorites: Math.max(0, prev.favorites + (nextValue ? 1 : -1)),
      }));

      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/assets/${asset.id}/favorite`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_favorite: nextValue, kind: asset.kind }),
        });
        if (!response.ok) throw new Error('Failed to update favorite');
        return true;
      } catch (err) {
        console.error('Error toggling favorite:', err);
        // Roll back by re-fetching the current view.
        fetchAssets(view, searchQuery, currentPage);
        return false;
      }
    },
    [getToken, view, searchQuery, currentPage, fetchAssets]
  );

  return {
    assets,
    counts,
    view,
    setView,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    currentPage,
    totalPages,
    total,
    goToPage,
    toggleFavorite,
  };
}
