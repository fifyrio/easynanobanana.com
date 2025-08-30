import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text') || 'AI Generated Image';
  const width = parseInt(searchParams.get('width') || '512');
  const height = parseInt(searchParams.get('height') || '512');

  // Create SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)" />
      <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
            text-anchor="middle" fill="white" opacity="0.9">
        AI Generated
      </text>
      <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" 
            text-anchor="middle" fill="white" opacity="0.8">
        ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}