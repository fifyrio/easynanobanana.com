import { NextRequest, NextResponse } from 'next/server';
import { searchPrompts } from '@/lib/supabase/prompts';

export interface PromptItem {
  id: number;
  title: string;
  prompt: string;
  imageUrl: string;
  tags: string[];
  category: string;
  author: string;
}

export interface PromptsResponse {
  prompts: PromptItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * GET /api/nano-banana-prompts
 *
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 6)
 * - search: string (optional) - search in title, prompt
 * - category: string (optional) - filter by category
 * - tags: string (optional) - comma-separated tags
 * - locale: string (default: 'en') - language for localized data
 * - sortBy: string (default: 'recent') - MVP only supports 'recent'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '6', 10);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const tagsParam = searchParams.get('tags') || '';
    const locale = searchParams.get('locale') || 'en';
    const sortBy = 'recent'; // MVP: Only support recent sorting

    // Parse tags
    const tags = tagsParam ? tagsParam.split(',').map(tag => tag.trim()).filter(Boolean) : undefined;

    // Validate parameters
    if (page < 1 || pageSize < 1 || pageSize > 600) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Fetch data from Supabase
    const result = await searchPrompts({
      query: search || undefined,
      locale,
      category: category || undefined,
      tags,
      page,
      pageSize,
      sortBy,
    });

    // Transform Supabase data to API format
    const response: PromptsResponse = {
      prompts: result.prompts.map(p => ({
        id: p.id,
        title: p.title,
        prompt: p.prompt,
        imageUrl: p.image_url,
        tags: p.tags,
        category: p.category,
        author: p.author,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 5 minutes on CDN, revalidate in background for 1 hour
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);

    // Return appropriate error response
    const message = error instanceof Error ? error.message : 'Failed to fetch prompts';
    const status = message.includes('Missing Supabase') ? 500 : 500;

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? message : undefined
      },
      { status }
    );
  }
}
