import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Daily check-in is disabled - users must purchase credits
  return NextResponse.json(
    { error: 'Daily check-in is no longer available. Please purchase credits to continue.' },
    { status: 410 }
  );
}
