import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Tutorial rewards are disabled - users must purchase credits
  return NextResponse.json(
    { error: 'Tutorial rewards are no longer available. Please purchase credits to continue.' },
    { status: 410 }
  );
}
