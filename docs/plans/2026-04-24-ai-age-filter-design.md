# AI Age Filter — Design Document

**Date:** 2026-04-24
**Status:** Approved
**Template Source:** ai-hairstyle page

## Overview

Create a new `/ai-image-effects/ai-age-filter` page by migrating the existing ai-hairstyle template. Users upload a photo, select an age preset, and receive an AI-generated image showing their face at that age. Results are displayed with a Before/After comparison slider.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preset dimensions | Single dimension (age only) | Simpler UX, age is inherently one-dimensional |
| Number of presets | 7 | Full age spectrum coverage |
| Custom tab | No | Presets are sufficient for age selection |
| Reference images | Yes (displaySrc + referenceSrc) | Same pattern as hairstyle for best AI quality |
| Credits per generation | 5 | Consistent with hairstyle pricing |

## Age Presets

| Name | Approximate Age | Prompt Focus |
|------|----------------|--------------|
| Baby | ~2 years | Infant facial features, round face, soft skin |
| Child | ~5 years | Young child features, small face proportions |
| Teenager | ~15 years | Adolescent features, youthful skin |
| Young Adult | ~25 years | Peak youth, smooth skin, defined features |
| Middle Aged | ~45 years | Early aging signs, subtle wrinkles |
| Senior | ~65 years | Grey hair, wrinkles, aged skin |
| Elderly | ~80 years | Deep wrinkles, very aged appearance |

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/[locale]/ai-image-effects/ai-age-filter/page.tsx` | Server page with SEO metadata, loads presets |
| `src/components/AiAgeFilterExperience.tsx` | Main client component (simplified from AiHairstyleExperience) |
| `src/data/ai-age-filter-presets.json` | 7 age presets with displaySrc + referenceSrc |
| `messages/*.json` → `aiAgeFilter` section | 14 language translations |

## Files to Reuse (No Changes)

- `src/app/api/upload-image/route.ts`
- `src/app/api/generate-image/route.ts`
- `src/app/api/kie/task-status/route.ts`
- `src/components/ui/ShareModal.tsx`
- `src/components/ui/ImagePreviewModal.tsx`
- `src/components/ui/FreeOriginalDownloadButton.tsx`
- `src/hooks/useImageDownload.ts`
- `src/lib/kie-api/kie-image-service.ts`
- `src/lib/r2.ts`
- `src/lib/cloudflare-kv.ts`

## UI Simplifications (vs Hairstyle)

- Remove Preset/Custom tab toggle → only preset mode
- Remove dual selector (Style + Color) → single Age selector
- Reduce from 48 options to 7 → compact single/two-row grid
- Simplify summary box → show selected age only
- Remove prompt text area and suggestion buttons

## Page Sections

1. **Hero** — badge, title, subtitle
2. **Upload** — drag-and-drop image upload
3. **Age Selector** — 7 preset thumbnails in grid
4. **Generate Button** — with 5 credits indicator
5. **Before/After Slider** — interactive comparison
6. **Download/Share/Preview** — action buttons
7. **How To** — 3-step guide
8. **Benefits** — 3 benefit cards
9. **FAQ** — 4 collapsible items

## Data Flow

```
Upload image → POST /api/upload-image → R2 → public URL
Select age preset → build prompt from preset data
Click Generate → POST /api/generate-image → KIE task + deduct 5 credits
Poll status → GET /api/kie/task-status?taskId=xxx
Task complete → display result in Before/After slider
User actions → download / share / full-screen preview
```

## Preset Data Structure

```json
{
  "age": [
    {
      "displaySrc": "/images/showcases/ai-age-filter/preset/Baby.jpeg",
      "referenceSrc": "https://r2.../ai-age-filter/preset/Baby.jpeg",
      "fileName": "Baby.jpeg",
      "name": "Baby",
      "age": "~2"
    }
  ]
}
```

## i18n Structure

```json
{
  "aiAgeFilter": {
    "seo": { "title", "description", "ogTitle", "ogDescription", "keywords" },
    "hero": { "badge", "title", "subtitle" },
    "input": {
      "upload": { "label", "format", "button", "placeholder" },
      "preset": { "label", "swipe", "none" },
      "button": { "generate", "generating", "credits" },
      "stats": { "recipes", "time" }
    },
    "preview": { "loading", "labels", "viewFull", "saved" },
    "howTo": { "badge", "title", "steps" },
    "benefits": { "badge", "title", "subtitle", "cta", "cards" },
    "faq": { "badge", "title", "subtitle", "items" },
    "error": { "upload", "signIn", "credits" }
  }
}
```

## SEO

- English URL: `https://www.easynanobanana.com/ai-image-effects/ai-age-filter` (no `/en` prefix)
- Other locales: `https://www.easynanobanana.com/{locale}/ai-image-effects/ai-age-filter`
- All 14 hreflang alternates
- OpenGraph + Twitter Card metadata
