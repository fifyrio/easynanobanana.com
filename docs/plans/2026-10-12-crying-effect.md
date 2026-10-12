# Crying effect page

User-approved scope: follow the existing effect-page flow; the user will test the actual crying output. Use the existing video API with a crying prompt, without adding a separate generation pipeline.

1. Add `/video/crying-effect-video-generator` with a video demo, upload/generation entry, instructions, copyable prompt, use cases, related tools and five FAQs. Keep indexable content and metadata on the server.
2. Register `ai-crying` and one `soft-crying` preset. Share the existing Burning Bridges generator UI through `VideoEffectGenerator`; keep its upload, authentication, credits, polling and download behavior. Use the current 100-credit / 4-second / 480p settings and silent output.
3. Use `easynanobanana-showcase-assets` to generate one real crying video with the page's prompt and settings, reusing an existing neutral portrait as input. Upload the input, demo, matching first-frame poster and 1200×630 OG image to R2 under `showcases/ai-crying`. The Hero reuses the hover-play component without black padding. Add VideoObject metadata and translate the two changed Hero strings with `easynanobanana-i18n`.
4. Complete locale validation, type-check, build and basic media/layout checks. The user will test the actual effect in the product. No commit, push or deployment requested.

Correction: the initial delivery omitted the real demo. The user's request to test the effect personally did not authorize replacing the required showcase with a still image. Demo generation and media verification are now part of the delivery scope.

Asset inventory (preset `soft-crying`; local mirror `public/images/showcases/ai-crying/`, not committed):

| Use | Relative local path / R2 key suffix | Format | Page use |
| --- | --- | --- | --- |
| Existing neutral portrait | `preset/soft-crying.jpg` | 1024×1024 JPEG | KIE reference input |
| Page prompt output | `demo/soft-crying.mp4` | 9:16, 480p, 4 seconds, silent | Hero / VideoObject |
| Actual first frame | `demo/soft-crying.jpg` | JPEG, video dimensions | Hero poster / VideoObject thumbnail |
| Social preview | `feature/og-image.jpg` | 1200×630 JPEG | OG / Twitter |
| Male portrait comparison | `cases/1-before.jpg`, `cases/1-after.jpg` | 496×864 JPEG, real demo frames at 0s / 3.5s | Emotional storytelling |
| Female portrait comparison | `cases/2-before.jpg`, `cases/2-after.jpg` | 1024×1024 JPEG, KIE image generation/edit | Sad reaction edits |
| Illustrated character comparison | `cases/3-before.jpg`, `cases/3-after.jpg` | 1024×1024 JPEG, KIE image generation/edit | Music and character edits |

Recovery: `pnpm tsx scripts/generate-ai-crying-assets.ts --dry-run` previews the inventory. Run without `--dry-run` to generate/upload. Local media is reused and re-uploaded; `temp/ai-crying-tasks/soft-crying.json` persists the task ID to resume polling without another paid task.

Image showcases follow the existing face-expression tool's three alternating before/after rows. `--showcases-only` generates/uploads the six related images without touching the Hero video. Image task IDs are persisted in the same task directory. The first pair comes from the real demo; the other pairs are explicitly labelled AI-generated still comparisons. All captions and image alt text use `aiCrying.showcase` translations.

Showcase verification: all six image URLs return HTTP 200 and `image/jpeg`, and all six decode on the rendered page. Desktop and 390px Chinese layouts were visually checked; no horizontal overflow or runtime page errors. The nine new translation keys bring the namespace to 97 leaf keys, validated across all 14 locales. Unrelated messages remain unchanged. Type-check, build and whitespace checks pass.

Delivery verification: all four R2 objects return HTTP 200 with matching JPEG/MP4 Content-Types. The demo is H.264, 496×864, 4.041667 seconds, with no audio stream; sampled frames show the neutral expression changing into crying with visible tears. The OG image is 1200×630. Desktop hover starts playback and leaving pauses it; the 390px Chinese layout has no horizontal overflow or runtime page errors. The server HTML includes the video, SEO content, canonical/hreflang links and structured data. All 88 source leaf keys pass validation across 14 locales; only the two intended Hero translations changed. Type-check, production build and diff whitespace checks pass. No commit or deployment performed.
