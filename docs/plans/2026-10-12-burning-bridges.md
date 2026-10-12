# Burning Bridges Trend Page Implementation Plan

**Goal:** Deliver one trend landing page with original copyable prompts, image-based video generation, real showcase assets, and 14 locales.

**Architecture:** Server page renders SEO copy, prompts, tutorial, FAQ, and related links. A focused client component handles one image upload, preset selection, existing authenticated video API, polling and download. Register `ai-burning-bridges` in the existing effect map; keep pricing, database, callback and refund code unchanged.

**Tech Stack:** Next.js 14, next-intl, existing Supabase/KIE/Seedance/R2 services.

## Scope and assumptions

- Accepted route: `/video/drake-burning-bridges-ai-video-generator`.
- Image references only; no reference-video control, original song or exact lip-sync promises.
- Four original preset prompts; initially validate cup raise and searching gesture with two generated clips.
- Reuse current 100-credit / 4-second / 480p video API. Real showcase generation and local translation are part of this implementation; no production deployment or Git push requested.
- Source keyword volume and trend origin are not verified. Describe the recognizable visual setup without invented chronology or ranking claims.

## Steps and verification

1. Add `src/data/ai-burning-bridges-presets.json` and `scripts/generate-ai-burning-bridges-assets.ts`. Reuse KIE/R2; resume from local files and re-upload without regenerating. Verify dry-run, two real clips, public URLs and media content.
2. Add `src/components/burning-bridges/{BurningBridgesGenerator,CopyPromptButton}.tsx` and `src/app/[locale]/video/drake-burning-bridges-ai-video-generator/page.tsx`. Add effect registration in `src/app/api/video/generate/route.ts`. Verify upload, preset navigation, clipboard, auth/credit errors, task success/failure with browser mocks; no live user credit deductions needed for UI checks.
3. Add `aiBurningBridges` and one `common.navigation.dropdown` key to English. Run existing incremental translation, validate all new leaf keys and placeholders, and review diff for unrelated changes. Register nav and sitemap without rewriting existing URLs.
4. Run type-check, build and desktop/mobile browser checks. Check server HTML, metadata, FAQs and media. Record actual limits and deployment state.

Do not modify pre-existing unrelated working-tree files. Keep generated video media as R2-backed local mirrors, consistent with the other video effects.

## Delivery and verification

- Implemented the route, four original presets and copy buttons, one-image generator, server-rendered content, navigation and 14 sitemap entries. Prompt-card links select the matching generator preset.
- Added `aiBurningBridges` and one navigation key: 102 leaf keys across all 14 locales. Existing values in all locale files remain unchanged; key/type/simple-placeholder validation passes.
- Generated four character images and two real Seedance clips; derived one 1200×630 OG image. All seven R2 URLs return 200. Both clips decode as h264 + AAC, 496×864, approximately 4.096 seconds. Visual frame review shows recognizable toast and searching actions; neither promises exact reference-motion transfer. Pet/virtual-character video outputs and audio content were not separately reviewed.
- Fixed a required pre-existing status lookup bug: generation and schema store `external_task_id`, while task-status queried `task_id`. `tests/video-task-status.test.ts` reproduced a 500 before the fix and passes after it, including ownership and unauthenticated-request checks.
- Type-check and production build pass. Browser mocks verified copy, preset selection, upload validation, login gate, insufficient balance, submit-time 402, completion, failure and download. No live user account was charged for UI testing.
- With JavaScript disabled, headings, all four prompts, five FAQs, canonical and 14 hreflang links remain visible. All locale routes return 200; 390px layouts do not overflow; no browser runtime exceptions in the checks.
- Review screenshots: `temp/burning-bridges-review/desktop.png` and `mobile.png`. Local preview: `http://localhost:3012/video/drake-burning-bridges-ai-video-generator`.

## Operational limits

- Local `KIE_VIDEO_CALLBACK_URL` is unset. Production account generation relies on the existing callback updating the database; task-status reads the database and does not poll KIE directly. Before release, confirm the deployed environment uses its reachable `/api/video/callback` URL, as documented in `.env.example`. A live signed-in purchase → callback → account-result test remains unverified.
- Asset polling can resume saved task IDs under ignored `temp/ai-burning-bridges-tasks/`; existing local outputs are re-uploaded without purchasing another generation. Media mirrors remain untracked under `public/images/showcases/ai-burning-bridges/`.
- No keyword-volume/ranking validation, Git commit/push or deployment was performed.

## User-supplied showcase replacements (2026-10-12)

- Source: `/Users/shenhongmei/Documents/Codex/2026-10-12/he/outputs/`. Reused all five supplied videos without re-encoding; MP4 faststart enabled and matching first-frame JPEG posters extracted. Original files are unchanged.
- Mapping: `02-Drakes-Burning-Bridge.mp4` → hero; `05-Music-Video.mp4` → party-lead; `04-Rap-Music-Video.mp4` → where-she-at; `03-Burning-Bridges-by-Drake.mp4` → pet-party; `01-Burning-Bridges.mp4` → virtual-character. These are illustrative party clips, not verification that each preset reproduces their choreography.
- Published media under `showcases/ai-burning-bridges/demo/20261012/` to avoid stale cached originals. Removed the unrelated input-photo comparison in the hero; all four prompt cards now show videos. Kept native proportions with object-contain.
- Hero VideoObject duration updated to 20.062 seconds. Actual generator settings remain 100 credits / 4 seconds / 480p; the supplied showcases are 15–20 seconds.
- Production build passes. Browser checks confirmed all five R2 videos load and play, all matching posters return 200, desktop and 390px mobile have no horizontal overflow, and VideoObject matches the hero URL and duration. No code commit or deployment performed.

## Approved showcase layout refinement

- Keep the light site theme. Place all five videos in a compact five-column hero gallery; use horizontal scrolling and scroll snap on mobile. Use uniform 9:16 cards with object-cover, accepting small side crops for the two wider clips. Remove the padded dark video frame.
- Show a small play affordance and title over each poster. Reveal native playback controls after playback starts; preserve native controls in the server HTML for visitors without JavaScript. Load videos on demand.
- Move prompt examples to text cards in two desktop columns. Keep every existing prompt, description, copy action and generator link; remove the repeated media column that was stretched by long text.
- SEO acceptance: unchanged metadata, H1/H2/H3, prompt article text, FAQ and JSON-LD in server HTML. Keep URLs, locales, sitemap and generation APIs unchanged. Verify playback, card proportions and mobile scrolling without page overflow.

- Refinement validation passed: type-check and production build; exact before/after SSR comparison of metadata, headings, complete prompt article text, FAQ and JSON-LD. Browser verified all five desktop cards share a row and 9:16 cover layout, click-to-play reveals controls, no-JavaScript native controls remain present, mobile gallery scrolls horizontally without document overflow, and no runtime exceptions. Screenshots: `/tmp/bridges-ui-desktop.png`, `/tmp/bridges-ui-mobile.png`.
