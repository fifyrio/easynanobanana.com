import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Social share rewards are disabled - users must purchase credits
  return NextResponse.json(
    { error: 'Social share rewards are no longer available. Please purchase credits to continue.' },
    { status: 410 }
  );
}
