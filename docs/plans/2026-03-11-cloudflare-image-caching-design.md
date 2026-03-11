# Design: Migrate from Vercel Image Optimization to Cloudflare R2 Direct Serving

**Date:** 2026-03-11
**Status:** Approved

## Problem

Vercel's image optimization service (`/_next/image`) has exceeded free tier limits, incurring unnecessary costs. The homepage and other components use `next/image` which routes all remote images through Vercel's optimization pipeline.

## Solution: Disable Vercel Image Optimization, Serve Directly from R2 CDN

Set `images.unoptimized: true` in `next.config.js` so that `next/image` no longer proxies images through Vercel. Images load directly from their original URLs (R2 CDN).

## Why This Works

1. **R2 images are already WebP** - No format conversion needed
2. **R2 public buckets include Cloudflare CDN** - Global edge caching built-in
3. **Homepage images are fixed showcase content** - No runtime resizing needed
4. **Zero additional cost** - R2 free tier: 10GB storage + 10M reads/month

## Scope of Changes

### Config Change (`next.config.js`)

```js
images: {
  unoptimized: true,
}
```

Remove `domains`, `formats`, and `minimumCacheTTL` (unused when `unoptimized: true`).

### Image Sources (No Code Changes Needed)

| Source | Example | Format | Change Required |
|--------|---------|--------|-----------------|
| R2 remote images | `${R2_ENDPOINT}/showcases/...` | WebP | None - served directly from R2 CDN |
| Local public images | `/images/logo.png` | PNG | None - served as static assets |
| Twitter/X images (PhotoWall) | `pbs.twimg.com/...` | JPG | None - already using `<img>` tag |

### Components Using `next/image` (No Changes Needed)

- `HomePageClient.tsx` - 12 R2 images (before/after + how-to steps)
- `Header.tsx` / `Footer.tsx` - Local logo/icons
- `RecentTaskCard.tsx` - Already uses `unoptimized` prop
- Blog pages - Cover images
- AI experience components

All retain `next/image` benefits: lazy loading, `fill` layout, `sizes` attribute, CLS prevention.

## Performance Impact

### Retained
- Lazy loading (browser-native)
- Layout stability (`fill` + `sizes`)
- Cloudflare CDN edge caching (via R2 public bucket)
- WebP format (already optimized)

### Lost (Minimal Impact)
- No automatic AVIF generation (~5-10% smaller than WebP)
- No runtime srcset generation (fixed showcase images don't need it)

## Cost Impact

- **Before:** Vercel image optimization charges after free tier exceeded
- **After:** $0 - R2 free tier covers all usage
