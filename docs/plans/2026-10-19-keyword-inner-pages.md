# Keyword Inner Pages Implementation Plan

**Goal:** Deliver the four user-approved items: Nano Banana 2.1 blog, Rumpelstiltskin video effect, Bulin 47 validation, and Burning Bridges content expansion.

**Architecture:** Reuse the existing Markdown blog renderer, server-rendered video page, VideoEffectGenerator, KIE/Seedance service, R2 storage and translation scripts. Add one effect registration and namespace. Preserve existing paid-trial changes and pricing.

**Tech Stack:** Next.js 14, next-intl, TypeScript, KIE, Supabase, R2.

## Scope and assumptions

- The user's latest table explicitly selects `/blog/nano-banana-2-1`; no Nano Banana model integration in this task.
- Rumpelstiltskin is an original four-second tiptoe dance, not reference-video replacement or original-song reproduction. Validate real output before publishing the generator's promise.
- Bulin 47 is a small private freestyle generation experiment and updated demand assessment, not an indexed page.
- Reuse the current 100-credit, four-second, 480p video flow. `effect_type` is text in the checked-in schema/RPC; no migration needed for the new identifier.
- New video content and navigation follow all 14 existing locales. The blog follows the existing English Markdown convention.
- Real sample generation, translation and R2 asset upload are within the requested implementation. Production deployment and Git push are outside this request.

## Steps and verification

1. Add resumable sample-generation script, one Rumpelstiltskin preset, and private Bulin test prompt. Dry-run, generate a small sample set, inspect frames and probe media; record successes and limits.
2. Add the Rumpelstiltskin server page and register its preset in the current API and client union. Verify authenticated routing, preset validation, generation parameters and unchanged credit handling with focused tests.
3. Write the Nano Banana 2.1 guide with primary sources, Pro comparison and copyable prompts. Expand Burning Bridges with helpful same-intent wording and related links, preserving its route and existing text.
4. Add only task namespaces/navigation keys, use project translation script, validate all locale shapes/placeholders, register canonical sitemap URLs and relevant internal links.
5. Run type-check and build. Inspect desktop/mobile, server HTML, canonical/hreflang, media URLs, upload/login/error/result flows and prompt copy. Record live sample validation separately from mocked user-account testing.

## Delivery and validation

- Added the English Markdown article at /blog/nano-banana-2-1, with official/KIE sources, a task-based Pro comparison, four original prompt examples and links to related tools. No Nano Banana integration change was made, matching the user's table.
- Added /video/rumpelstiltskin-ai-video-generator, one original tiptoe preset, one existing-pipeline effect registration, 14 translated namespaces/navigation labels and 14 sitemap URLs. Existing pricing, callback, credit and paid-trial changes were retained.
- Expanded the existing Burning Bridges page with photo-selection advice, realistic output expectations and one same-intent section covering all three keyword variants. Existing content was preserved and the new effect is linked from that page.
- Generated four input images and four real clips. Three Rumpelstiltskin clips are linked on the new page; the Bulin candidate is an unindexed experiment. All three dance clips are H.264 496×864, 4.041667 seconds, silent. The Bulin clip includes AAC but did not meet the intended standing freestyle visual task. See docs/research/2026-10-19-video-effect-validation.md for qualitative results and limits.
- Published 13 media objects to R2 (four inputs, four videos, four posters, one 1200×630 OG). Actual GETs for all nine page/report video, poster and OG references returned 200 with appropriate content types. Local files and saved task IDs remain in ignored temp/keyword-rollout/.
- The existing blog route reproduced a production-only HTTP 500 (static-to-dynamic locale-header error). Added request rendering to the shared blog detail route; the new article and an existing article both return 200 after rebuilding.
- pnpm run build and pnpm run type-check pass. Focused new-effect tests and existing task-status tests pass. Type-check was rerun after build to avoid concurrent .next type-file generation.
- Translation validation passes for 88 new leaf keys in all 14 languages. Compared against the pre-task locale snapshots: every pre-existing message value is unchanged. Corrected a generated Chinese proper-name mistranslation within the new namespace.
- Production browser checks pass for all three video playbacks, desktop and 390px mobile layouts, English/Chinese/Japanese/German mobile pages, no-JS heading/prompt/FAQ/schema output and 14 hreflang links. All 14 locale routes return 200. Blog has one H1 and four prompt blocks, and Burning Bridges contains the three selected keyword variants.
- Browser mocks verified copy, missing upload, login gate, authenticated request shape, completion/download, provider failure, submit-time 402 and insufficient balance. No real customer credits were charged by UI tests. Direct sample-generation KIE charges are documented separately.
- Screenshots and logs: temp/keyword-rollout/production-desktop.png, production-mobile.png, production-mobile-generator.png, blog-mobile.png, production-check.log and auth3.log.

## Operational status

- Local production preview is running at http://localhost:3014. No Git commit/push or production deployment was performed.
- Local KIE_VIDEO_CALLBACK_URL is unset. Real sample validation uses provider polling; a live signed-in customer flow through the production callback was not exercised. Before release, verify the deployed callback is reachable and that the already-existing paid-trial changes are deployed as intended.
- Rumpelstiltskin is a small experiment: three samples show variable footwork and do not establish a general success rate or exact meme reproduction. Bulin 47 remains a candidate because query volume is unconfirmed and the visual output missed the expected task.
