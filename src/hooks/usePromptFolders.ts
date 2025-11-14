'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { PromptFolder, CreateFolderInput, UpdateFolderInput } from '@/types/prompts';

export function usePromptFolders() {
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getToken = useCallback(async () => {
    const { supabase } = await import('@/lib/supabase');
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  }, []);

  // Fetch all folders
  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/prompts/folders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch folders');
      }

      setFolders(data.folders || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load folders';
      setError(message);
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Create folder
  const createFolder = useCallback(async (input: CreateFolderInput) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/prompts/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create folder');
      }

      // Add to local state
      setFolders(prev => [...prev, data.folder]);
      toast.success('Folder created!');

      return data.folder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create folder';
      toast.error(message);
      throw err;
    }
  }, [getToken]);

  // Update folder
  const updateFolder = useCallback(async (id: string, input: UpdateFolderInput) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/prompts/folders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(input)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update folder');
      }

      // Update local state
      setFolders(prev =>
        prev.map(folder =>
          folder.id === id ? data.folder : folder
        )
      );
      toast.success('Folder updated!');

      return data.folder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update folder';
      toast.error(message);
      throw err;
    }
  }, [getToken]);

  // Delete folder
  const deleteFolder = useCallback(async (id: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/prompts/folders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete folder');
      }

      // Remove from local state
      setFolders(prev => prev.filter(folder => folder.id !== id));
      toast.success('Folder deleted');

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete folder';
      toast.error(message);
      throw err;
    }
  }, [getToken]);

  // Initial fetch
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: fetchFolders
  };
}
