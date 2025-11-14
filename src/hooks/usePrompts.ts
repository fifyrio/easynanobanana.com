'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { SavedPrompt, CreatePromptInput, UpdatePromptInput } from '@/types/prompts';

interface UsePromptsOptions {
  folderId?: string | null;
  autoLoad?: boolean;
}

export function usePrompts(options: UsePromptsOptions = {}) {
  const { folderId, autoLoad = true } = options;

  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPrompt | null>(null);
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
      if (folderId) params.append('folder_id', folderId);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());

      const url = `/api/prompts/saved?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prompts');
      }

      setPrompts(data.prompts || []);
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load prompts';
      setError(message);
      console.error('Error fetching prompts:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId, getToken, pageSize]);

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

  // Create prompt
  const createPrompt = useCallback(async (input: CreatePromptInput) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/prompts/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save prompt');
      }

      // Add to local state
      setPrompts(prev => [data.prompt, ...prev]);
      toast.success('Prompt saved!');

      return data.prompt;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save prompt';
      toast.error(message);
      throw err;
    }
  }, [getToken]);

  // Update prompt
  const updatePrompt = useCallback(async (id: string, input: UpdatePromptInput) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/prompts/saved/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update prompt');
      }

      // Update local state
      setPrompts(prev =>
        prev.map(prompt =>
          prompt.id === id ? data.prompt : prompt
        )
      );

      // Update selected if it's the one being edited
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(data.prompt);
      }

      toast.success('Prompt updated!');

      return data.prompt;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update prompt';
      toast.error(message);
      throw err;
    }
  }, [getToken, selectedPrompt]);

  // Delete prompt
  const deletePrompt = useCallback(async (id: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/prompts/saved/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete prompt');
      }

      // Remove from local state
      setPrompts(prev => prev.filter(prompt => prompt.id !== id));

      // Clear selection if deleted
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
      }

      toast.success('Prompt deleted');

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete prompt';
      toast.error(message);
      throw err;
    }
  }, [getToken, selectedPrompt]);

  // Move prompt to folder
  const moveToFolder = useCallback(async (promptId: string, folderId: string | null) => {
    return updatePrompt(promptId, { folder_id: folderId });
  }, [updatePrompt]);

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
    createPrompt,
    updatePrompt,
    deletePrompt,
    moveToFolder,
    refetch: fetchPrompts,
    currentPage,
    totalPages,
    total,
    goToPage
  };
}
