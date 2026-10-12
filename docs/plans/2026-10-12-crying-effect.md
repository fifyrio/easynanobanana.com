# Crying effect page

User-approved scope: follow the existing effect-page flow; the user will test the actual crying output. Use the existing video API with a crying prompt, without adding a separate generation pipeline.

1. Add `/video/crying-effect-video-generator` with a portrait preview, upload/generation entry, instructions, copyable prompt, use cases, related tools and five FAQs. Keep indexable content and metadata on the server.
2. Register `ai-crying` and one `soft-crying` preset. Share the existing Burning Bridges generator UI through `VideoEffectGenerator`; keep its upload, authentication, credits, polling and download behavior. Use the current 100-credit / 4-second / 480p settings and silent output.
3. Reuse the existing 1024×1024 R2 Crying portrait, labelled as a still preview. Add navigation and 14 sitemap URLs. Add `aiCrying` and its navigation label through the existing translation script.
4. Complete locale validation, type-check and build. Do not run paid video generation or generation-behavior tests; the user will test the effect. No commit, push or deployment requested.

Delivery: page, shared generator, preset, effect registration, navigation and sitemap are implemented. The 88 new leaf keys pass validation across 14 locales. Existing translations are unchanged. Type-check and production build pass. The preview image is the existing R2 still portrait; no crying video was generated or tested, as requested. No commit or deployment performed.
