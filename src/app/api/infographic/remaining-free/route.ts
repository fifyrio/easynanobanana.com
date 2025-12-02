import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Initialize Supabase client and set auth
    const supabase = await createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    // For database operations, use service client to bypass RLS
    const { createServiceClient } = await import('@/lib/supabase-server');
    const serviceSupabase = createServiceClient();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Calculate the start of the current day (UTC 00:00:00)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayIsoString = today.toISOString();

    // Count today's generated infographics for this user
    const { count, error: countError } = await serviceSupabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayIsoString)
      .contains('metadata', { type: 'infographic' });

    if (countError) {
      console.error('Error counting daily infographics:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch limit' },
        { status: 500 }
      );
    }

    const dailyLimit = 3;
    const used = count || 0;
    const remaining = Math.max(0, dailyLimit - used);

    return NextResponse.json({
      limit: dailyLimit,
      used: used,
      remaining: remaining
    });

  } catch (error: any) {
    console.error('Error fetching infographic limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
