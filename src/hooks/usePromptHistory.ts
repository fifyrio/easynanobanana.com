'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PromptHistoryItem } from '@/types/prompt-history';

interface UsePromptHistoryOptions {
  autoLoad?: boolean;
}

export function usePromptHistory(options: UsePromptHistoryOptions = {}) {
  const { autoLoad = true } = options;

  const [prompts, setPrompts] = useState<PromptHistoryItem[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptHistoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Get auth token
  const getToken = useCallback(async () => {
    const { supabase } = await import('@/lib/supabase');
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  }, []);

  // Fetch prompts
  const fetchPrompts = useCallback(async (search?: string, page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Build query params
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());

      const url = `/api/prompt-history?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prompt history');
      }

      setPrompts(data.prompts || []);
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load prompt history';
      setError(message);
      console.error('Error fetching prompt history:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, pageSize]);

  // Search prompts (debounced)
  const searchPrompts = useCallback(async (query: string) => {
    setCurrentPage(1); // Reset to page 1 when searching
    if (!query.trim()) {
      fetchPrompts(undefined, 1);
      return;
    }
    fetchPrompts(query, 1);
  }, [fetchPrompts]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchPrompts(searchQuery || undefined, page);
  }, [fetchPrompts, searchQuery, totalPages]);

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      fetchPrompts();
    }
  }, [autoLoad, fetchPrompts]);

  // Search effect with debounce
  useEffect(() => {
    if (!searchQuery) {
      fetchPrompts();
      return;
    }

    const timer = setTimeout(() => {
      searchPrompts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPrompts, fetchPrompts]);

  return {
    prompts,
    selectedPrompt,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    setSelectedPrompt,
    refetch: fetchPrompts,
    currentPage,
    totalPages,
    total,
    goToPage
  };
}
