# AI Anime Generator Page – Best Practices

> Derived from the shipped **`/ai-image-effects/ai-hairstyle`** experience. Use this as the contract when extending or reusing the pattern for **`ai-anime-generator`**.

## 1. Architecture & Ownership
- Split every tool page into a **server-only `page.tsx`** (SEO + filesystem) and a **client `*Experience.tsx`** (state + interactivity). Never mix `'use client'` with Node APIs like `fs`/`path`.
- Server component responsibilities:
  - Define full metadata (`title`, `description`, `keywords`, OG/Twitter objects, canonical URL).
  - Read preset image folders from `public/images/showcases/{tool}/preset/{category}` and feed them as props.
  - Map each preset into `{ displaySrc, referenceSrc, fileName, name }`, where `displaySrc` points to `/public` and `referenceSrc` points to CDN.
- Client component responsibilities:
  - Manage all UI, auth, and API state via React hooks.
  - Trigger `/api/generate-image` and refresh user profile/credits after success.
  - Own UX widgets (upload, sliders, modals, FAQ) and share behavior with existing components in `src/components`.

## 2. File & Asset Layout
```
src/app/ai-image-effects/ai-anime-generator/page.tsx        # server
src/components/AiAnimeGeneratorExperience.tsx               # client
public/images/showcases/ai-anime-generator/feature/*        # before/after, OG, videos
public/images/showcases/ai-anime-generator/preset/style/*   # style thumbnails
public/images/showcases/ai-anime-generator/preset/effect/*  # effect thumbnails
```
- Keep preset images lightweight (≤200×200, WebP/PNG). Export 1024×1024 `before/after` PNGs and 1200×630 OG JPGs. Host heavy reference assets/videos on Cloudflare R2 under `.../preset/style|effect`.
- Copy `AiHairstyleExperience.tsx` and tailor copy, preset categories, and prompt text; avoid diverging from shared hooks/components.

## 3. Component Patterns
- **State buckets** (keep them grouped for readability):
  1. Upload (`uploadedImage`, `uploadedFileName`)
  2. Inputs (`prompt`, `activeTab`, `selectedStyle`, `selectedEffect`)
  3. Generation (`isGenerating`, `generatedImage`, `description`, `error`)
  4. UI affordances (`sliderPosition`, `isDragging`, `showShareModal`, `showPreviewModal`, `openFaq`)
- **Handlers**:
  - `handleFileChange` reads previews via `FileReader` and sanitizes empty states.
  - `buildPrompt()` composes preset selections or free-form prompt while preserving facial identity.
  - Slider handlers must support mouse + touch events referencing `comparisonRef`.
- **Auth + Credits**: Gate generation with `useAuth()`. Before calling the API, assert `uploadedImage`, `user`, and `profile.credits >= creditsRequired`. After a successful response, always `await refreshProfile()` to keep credits in sync.

## 4. API Integration
- POST `/api/generate-image` with headers `{ 'Content-Type': 'application/json', Authorization: \`Bearer ${session.access_token}\` }`.
- Payload shape:
  ```json
  {
    "prompt": "Final prompt...",
    "model": "gemini-2.0-flash",
    "imageUrls": ["data:image/png;base64,..."],
    "metadata": { "style": "shounen", "effect": "cel-shaded" }
  }
  ```
- Handle responses exhaustively:  
  `401` → ask user to sign in, `402` → show credit deficit with required/available, `503` → show retry message, fallback to generic error. Guard against missing `imageUrl`.
- Log request intent (not raw images) for debugging parity with Hairstyle page.

## 5. UI/UX Requirements
- Reuse shared components (`Header`, `Button`, `FreeOriginalDownloadButton`, `ShareModal`, `ImagePreviewModal`). Respect their prop contracts (loading states, cooldown, callbacks).
- Implement **before/after slider** with keyboard-focusable handle, drag/touch support, and `next/image` for both layers.
- Provide prompt suggestions, preset tabs, FAQ accordion, feature stats, and testimonial/showcase blocks mirroring Hairstyle’s flow.
- Always display actionable feedback:
  - Loading overlay or disabled button with `Generating...`
  - Inline error banner near CTA
  - Success state reveals download + share buttons

## 6. Asset & CDN Strategy
- Store UI thumbnails locally for instant load; link `referenceSrc` to CDN copies used by the backend so prompt metadata can include HD references.
- Videos (how-it-works, animation loops) should autoplay, loop, mute, and lazy-load. Keep duration 5–10 s.
- Export OG/feature images with branding and alt text describing the transformation (e.g., “Photo transformed into cyberpunk anime style”).

## 7. SEO & Metadata Checklist
- Title format: `AI Anime Generator | Transform Photos to Anime Style Free`.
- Description: 150–160 chars summarizing capability + CTA.
- Keywords: 5–10 intent-aligned terms (anime generator, photo to anime, etc.).
- Configure Open Graph + Twitter cards referencing `feature/showcase-1.jpg`.
- URL path: `/ai-image-effects/ai-anime-generator`; ensure canonical + sitemap entry.
- Add descriptive `alt` text everywhere, especially for before/after and preset thumbnails.

## 8. Testing & QA Matrix
- Upload flow: png/jpeg/webp + empty state.
- Preset selection & custom prompt tabs.
- Auth-required paths: signed-out (401), low credits (402), normal success.
- Comparison slider with mouse, trackpad, touch, and keyboard focus.
- Download + share modals, FAQ toggles, responsive layout (mobile/tablet/desktop).
- Performance: verify image sizes via Lighthouse and confirm lazy loading of videos.

## 9. Common Pitfalls to Avoid
- Declaring `'use client'` in `page.tsx` or importing `fs` inside client modules.
- Skipping validation before API calls (causes confusing failures).
- Forgetting to refresh the Supabase profile, leaving credit counts stale.
- Hardcoding absolute asset paths instead of `path.join(process.cwd(), ...)`.
- Missing touch events on the slider or bypassing `next/image`.
- Leaving out loading states, causing duplicate requests from impatient clicks.

By mirroring these patterns from AI Hairstyle, each new AI tool stays consistent, maintainable, and SEO-friendly while reducing regressions when the shared components evolve.
