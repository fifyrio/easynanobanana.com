/**
 * Supabase Prompts Service
 *
 * Provides typed methods for interacting with the prompts table
 */

import { createClient } from '@supabase/supabase-js';

// Types (MVP - Simplified)
export interface Prompt {
  id: number;
  title: string;
  prompt: string;
  image_url: string;
  tags: string[];
  category: string;
  author: string;
  author_url?: string;
  locale: string;
  is_published: boolean;
  created_at: string;
}

export interface SearchPromptsParams {
  query?: string;
  locale?: string;
  category?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'recent'; // MVP: Only support recent sorting
}

export interface PromptsResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Initialize Supabase client (server-side with service role)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Search and filter prompts (MVP - Simplified)
 * Uses client-side filtering for search since we don't have search_vector yet
 */
export async function searchPrompts(
  params: SearchPromptsParams
): Promise<PromptsResponse> {
  const {
    query = '',
    locale = 'en',
    category,
    tags,
    page = 1,
    pageSize = 6,
    sortBy = 'recent',
  } = params;

  const supabase = getSupabaseClient();

  try {
    // Build query - MVP version without full-text search
    let queryBuilder = supabase
      .from('prompts')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .eq('locale', locale);

    // Apply category filter
    if (category && category !== 'allWorks') {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // Apply tags filter (contains any of the tags)
    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', tags);
    }

    // MVP: Simple text search using ILIKE on title and prompt
    // This is less efficient than full-text search but works for MVP
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,prompt.ilike.%${query}%`
      );
    }

    // Apply sorting (MVP: only recent)
    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    queryBuilder = queryBuilder.range(startIndex, startIndex + pageSize - 1);

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Failed to fetch prompts: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      prompts: (data as Prompt[]) || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Error searching prompts:', error);
    throw error;
  }
}

/**
 * Get a single prompt by ID
 */
export async function getPromptById(id: number): Promise<Prompt | null> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch prompt: ${error.message}`);
    }

    return data as Prompt;
  } catch (error) {
    console.error('Error fetching prompt by ID:', error);
    throw error;
  }
}

/**
 * Get recent prompts (MVP helper function)
 */
export async function getRecentPrompts(
  locale: string = 'en',
  limit: number = 20
): Promise<Prompt[]> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_published', true)
      .eq('locale', locale)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent prompts: ${error.message}`);
    }

    return (data as Prompt[]) || [];
  } catch (error) {
    console.error('Error fetching recent prompts:', error);
    throw error;
  }
}

/**
 * Get popular tags ordered by usage frequency
 */
export async function getPopularTags(
  locale: string = 'en',
  limit: number = 20
): Promise<string[]> {
  const supabase = getSupabaseClient();

  try {
    // Fetch only tags column for all published prompts in the locale
    // Limit the fetch to avoid performance issues if table grows huge (e.g. 1000 latest prompts)
    const { data, error } = await supabase
      .from('prompts')
      .select('tags')
      .eq('is_published', true)
      .eq('locale', locale)
      .limit(1000);

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }

    // Aggregate tags
    const tagCounts: Record<string, number> = {};
    
    data.forEach((row) => {
      if (Array.isArray(row.tags)) {
        row.tags.forEach((tag: string) => {
          // Normalize tag
          const normalizedTag = tag.trim(); 
          if (normalizedTag) {
             tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by count desc
    const sortedTags = Object.entries(tagCounts)
      .sort(([, countA], [, countB]) => countB - countA) // Descending
      .map(([tag]) => tag)
      .slice(0, limit);

    return sortedTags;
  } catch (error) {
    console.error('Error getting popular tags:', error);
    return []; // Return empty array on error gracefully
  }
}

