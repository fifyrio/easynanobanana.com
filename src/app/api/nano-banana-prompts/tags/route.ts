import { NextRequest, NextResponse } from 'next/server';
import { getPopularTags } from '@/lib/supabase/prompts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'en';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const tags = await getPopularTags(locale, limit);

    return NextResponse.json({ tags }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
