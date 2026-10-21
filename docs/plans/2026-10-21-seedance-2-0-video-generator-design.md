# Seedance 2.0 AI Video Generator (`/video/seedance-2-0-ai-video-generator`) Design & Implementation Plan

**Date:** 2026-10-21
**Goal:** Deliver the P2 opportunity (`seedance 2.0 free` / `seedance 2.0` / `seedance 2.0 ai video generator`, US KD 44.5, US monthly search volume 9,900 / 56,000 global primary-keyword volume) by integrating KIE's `bytedance/seedance-2-mini` into the video pipeline, upgrading `VideoEffectGenerator` with optional custom motion instructions (`customText`) and aspect-ratio switching (`9:16` / `16:9`), generating 3 real Seedance 2.0 showcase videos on R2, and launching a 14-locale SEO landing page at `/[locale]/video/seedance-2-0-ai-video-generator`.

## 1. Scope & Product Decisions

- **Upstream Model & Pricing:**
  - Route `effectType: 'ai-seedance-2-0'` to KIE's `bytedance/seedance-2-mini` (`3.8` KIE credits/s at 480p without video input = `15.2` KIE credits ≈ \$0.076 per 4-second video, 67% cheaper than `seedance-2-fast`).
  - Keep user credit deduction at **100 credits per 4-second 480p video** so the route works seamlessly with the deployed `deduct_credits_for_video` RPC, `refund_video_credits` RPC, and `$0.99` / `100-credit` paid video trial (`videoTrial`) with zero database migration required.
  - Clearly explain credit & trial rules on the landing page to transparently address `seedance 2.0 free` search intent without promising unlimited unauthenticated generation.
- **Interactive Controls (`VideoEffectGenerator.tsx`):**
  - Expose 3 versatile Seedance 2.0 camera/motion presets (`cinematic-portrait-motion`, `street-walk-tracking`, `product-tabletop-reveal`).
  - Enable optional `allowCustomText` (up to 300 characters appended to the preset prompt) and `allowAspectRatio` (`9:16` / `16:9`) on `/video/seedance-2-0-ai-video-generator`.
- **Real R2 Showcase Assets:**
  - Generate 3 input reference images (`showcases/ai-seedance-2-0/input/*.jpg`), 3 real 4-second 480p MP4 clips with `bytedance/seedance-2-mini` (`showcases/ai-seedance-2-0/demo/*.mp4`), 3 FFmpeg poster frames (`showcases/ai-seedance-2-0/demo/*.jpg`), and 1 `1200×630` OpenGraph image (`showcases/ai-seedance-2-0/feature/og-image.jpg`).

## 2. Architecture & Files Changed

1. **`src/lib/kie-api/kie-video-service.ts`**:
   - Add `SeedanceModel = 'bytedance/seedance-2-fast' | 'bytedance/seedance-2-mini' | 'bytedance/seedance-2'` and optional `model?: SeedanceModel` in `SeedanceCreateInput` (default `'bytedance/seedance-2-fast'`).
2. **`src/data/ai-seedance-2-0-presets.json`**:
   - Define the 3 Seedance 2.0 motion presets (`cinematic-portrait-motion`, `street-walk-tracking`, `product-tabletop-reveal`).
3. **`src/app/api/video/generate/route.ts`**:
   - Add `'ai-seedance-2-0'` to `EffectType` and `EFFECTS` with `model: 'bytedance/seedance-2-mini'` and `generateAudio: true`.
4. **`src/components/video/VideoEffectGenerator.tsx`**:
   - Extend props with `effectType: ... | 'ai-seedance-2-0'`, `namespace: ... | 'aiSeedance20'`, `allowCustomText?: boolean`, and `allowAspectRatio?: boolean`.
5. **`src/app/[locale]/video/seedance-2-0-ai-video-generator/page.tsx`**:
   - Server-rendered 14-locale SEO page with Hero video preview, `VideoEffectGenerator`, copyable prompt cards, 3 real video showcase examples, `Seedance 2.0 Mini vs Fast vs Standard` comparison table, 6 FAQs (`FAQSchema`, `VideoObjectSchema`, `BreadcrumbSchema`), and `canonical`/`hreflang` alternates.
6. **`src/lib/nav-data.ts`, `public/sitemap.xml`, `messages/*.json`**:
   - Register navigation item `aiSeedance20` in `buildVideoDropdown`, add 14 locale URLs to `public/sitemap.xml`, and populate `aiSeedance20` translations across all 14 locale files.
