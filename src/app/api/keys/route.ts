import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';
import { generateApiKey } from '@/lib/api-keys';

async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const supabase = await createAuthenticatedClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// List the current user's API keys (masked; never returns plaintext).
export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// Create a new API key. Returns the plaintext exactly once.
export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let name = 'Default';
  try {
    const body = await request.json();
    if (typeof body?.name === 'string' && body.name.trim()) name = body.name.trim().slice(0, 60);
  } catch {
    // no body → keep default name
  }

  const key = generateApiKey();
  const service = createServiceClient();
  const { data, error } = await service
    .from('api_keys')
    .insert([{ user_id: user.id, key_hash: key.hash, key_prefix: key.prefix, name }])
    .select('id, name, key_prefix, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    data: { ...data, plaintext: key.plaintext },
  });
}
