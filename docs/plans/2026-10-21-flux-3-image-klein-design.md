# FLUX 3 Image Klein (`flux-3-image-klein`) Design & Implementation Plan

**Date:** 2026-10-21
**Goal:** Deliver the P1 opportunity (`flux 3 image klein` / `flux klein` / `flux klein edit`) by integrating KIE's `flux-3/klein-text-to-image` and `flux-3/klein-edit-image` models into the image generation pipeline, launching a dedicated 14-locale `/flux-3-image-klein` tool landing page with real R2 showcase samples, and adding `FLUX 3 Image Klein` as a selectable model in `/image-editor`.

## 1. Scope & Product Decisions

- **Entry Points:**
  1. New 14-locale dedicated page at `/[locale]/flux-3-image-klein` (`https://www.easynanobanana.com/flux-3-image-klein` for `en`), defaulting to `FLUX 3 Image Klein` (`flux-3-klein`) and supporting both **Text to Image** (`flux-3/klein-text-to-image`) and **Image to Image / Edit** (`flux-3/klein-edit-image`).
  2. Existing `/[locale]/image-editor` updated so its model selector allows switching between `Easy Nano Banana` (`nano-banana`, default on `/image-editor`) and `FLUX 3 Image Klein` (`flux-3-klein`).
- **Pricing & Resolution:**
  - Keep a unified **5 user credits per generation** across both models.
  - Default to `resolution: '1K'` on KIE (`1.6` KIE credits ≈ \$0.008 per image, 47% lower upstream cost than `google/nano-banana`).
  - Expose aspect ratios `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3` (plus `auto` when in `image-to-image` edit mode on `flux-3-klein`) and the `enhance_prompt` toggle (default `true`).
- **Real Showcase Assets:**
  - Generate real sample images using KIE (`flux-3/klein-text-to-image` and `flux-3/klein-edit-image`), upload them (and a 1200×630 OG image) to Cloudflare R2 under `showcases/flux-3-image-klein/`, and wire them into interactive "Try Example" showcase cards.

## 2. Architecture & Data Flow

1. **KIE Image Service (`src/lib/kie-api/kie-image-service.ts`):**
   - Add `FluxKleinAspectRatio` and `createFluxKleinTask(options)` to `KIEImageService`.
   - When `imageUrls` has 1–10 URLs, invoke `flux-3/klein-edit-image` with `{ prompt, image_urls, aspect_ratio, resolution: '1K', output_format: 'png', num_images: 1, enhance_prompt }`.
   - When `imageUrls` is empty/omitted, invoke `flux-3/klein-text-to-image` with `{ prompt, aspect_ratio: aspectRatio === 'auto' ? '1:1' : aspectRatio, resolution: '1K', output_format: 'png', num_images: 1, enhance_prompt }`.
2. **Generate Image API Route (`src/app/api/generate-image/route.ts`):**
   - Accept optional `modelFamily?: 'nano-banana' | 'flux-3-klein'` and `enhancePrompt?: boolean`.
   - Validate aspect ratio and route `flux-3-klein` requests to `kieService.createFluxKleinTask(...)`, while preserving `nano-banana` behavior as the default.
   - Retain Creem prompt moderation (`screenPrompt`), rate limiting (`imageLimiter`), R2 task metadata persistence (`saveKIETaskMetadataKV`), and 5-credit deduction.
3. **Configurable `ImageEditor` Component (`src/components/ImageEditor.tsx`):**
   - Accept optional props: `defaultModel?: 'nano-banana' | 'flux-3-klein'`, `defaultMode?: 'text-to-image' | 'image-to-image'`, `samples?: ImageEditorSample[]`, `hideHeader?: boolean`.
   - Make the model `<select>` interactive so users can switch between `Easy Nano Banana` and `FLUX 3 Image Klein`.
   - Show `4:3`, `3:4`, and `auto` (in `image-to-image` mode) aspect ratios plus the `Enhance Prompt` toggle when `flux-3-klein` is selected.
   - Support both text-only and before/after edit samples in the Showcase carousel ("Try This Example" pre-fills the prompt, sets the mode/aspect ratio, and preloads reference image URLs for edit samples).
4. **Dedicated SEO Page (`src/app/[locale]/flux-3-image-klein/page.tsx`) & 14-Locale Translations:**
   - Server-rendered hero, embedded `ImageEditor` (defaulting to `flux-3-klein`), real KIE showcase gallery with copyable prompts, `FLUX 3 Image Klein vs FLUX.1 & Nano Banana` comparison table, use-case cards covering `flux 3 image klein`, `flux klein`, and `flux klein edit`, and 6 FAQs with `FAQSchema` JSON-LD.
   - Register navigation link in `src/lib/nav-data.ts` and all 14 locale URLs in `public/sitemap.xml`.

## 3. Verification Plan

1. **Unit / Route Tests:** Add focused tests (`tests/flux-klein-generation.test.ts`) verifying `KIEImageService.createFluxKleinTask` payload shapes for both `flux-3/klein-text-to-image` and `flux-3/klein-edit-image`, aspect-ratio fallback (`auto` -> `1:1` in text-to-image), and `/api/generate-image` routing.
2. **Live Sample Generation & R2 Upload:** Run a script to generate real `flux-3/klein-text-to-image` and `flux-3/klein-edit-image` outputs via KIE, upload to R2, and verify HTTP 200 on all asset URLs.
3. **14-Locale Validation & Build:** Verify all 14 `messages/*.json` files have identical key shapes for the new namespace, and pass `pnpm run type-check` and `pnpm run build`.
