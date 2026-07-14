import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-keys';
import {
  generateImageSync,
  InsufficientCreditsError,
  ModerationRejectedError,
  ModerationUnavailableError,
  type AspectRatio,
} from '@/lib/mcp/generate-image-sync';

export const maxDuration = 120; // allow time to wait for KIE

const VALID_RATIOS: AspectRatio[] = ['9:16', '1:1', '16:9'];

export async function POST(request: NextRequest) {
  const verified = await verifyApiKey(request.headers.get('x-api-key'));
  if (!verified) {
    return NextResponse.json({ success: false, error: 'Invalid or missing API key' }, { status: 401 });
  }

  let prompt = '';
  let aspectRatio: AspectRatio = '1:1';
  try {
    const body = await request.json();
    prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (VALID_RATIOS.includes(body?.aspectRatio)) aspectRatio = body.aspectRatio;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ success: false, error: 'prompt is required' }, { status: 400 });
  }

  try {
    const result = await generateImageSync(verified.userId, prompt, aspectRatio);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits', required: err.required, available: err.available },
        { status: 402 }
      );
    }
    if (err instanceof ModerationRejectedError) {
      return NextResponse.json({ success: false, error: 'Prompt rejected by content policy' }, { status: 400 });
    }
    if (err instanceof ModerationUnavailableError) {
      return NextResponse.json(
        { success: false, error: 'Content moderation is temporarily unavailable. Please retry.' },
        { status: 503 }
      );
    }
    console.error('v1/images error:', err);
    return NextResponse.json({ success: false, error: 'Image generation failed' }, { status: 500 });
  }
}
