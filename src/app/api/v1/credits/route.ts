import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-keys';
import { createServiceClient } from '@/lib/supabase-server';
import { getBalance } from '@/lib/credits';

export async function GET(request: NextRequest) {
  const verified = await verifyApiKey(request.headers.get('x-api-key'));
  if (!verified) {
    return NextResponse.json({ success: false, error: 'Invalid or missing API key' }, { status: 401 });
  }

  const balance = await getBalance(createServiceClient(), verified.userId);
  return NextResponse.json({ success: true, data: { credits: balance } });
}
