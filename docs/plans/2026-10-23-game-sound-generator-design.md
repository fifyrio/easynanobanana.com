# Game Sound & Music Generator (`game-sound-generator`) Design & Implementation Plan

**Date:** 2026-10-23  
**Target Keywords:** `game sound generator`, `ai game sound generator`, `game sound effect generator`, `game music generator`, `ai game music generator`  
**Route:** `/[locale]/game-sound-generator` (14 locales)

---

## 1. Context & Product Scope

- **Keyword Opportunity:** Based on the Oct 23 Gefei research (`docs/research/2026-10-23-gefei-music-keywords.md`), `game sound generator` (2,900/mo, KD 4, CPC \$6.77, +177% YoY) and `game music generator` (1,900/mo, KD 8, CPC \$1.64, +638% YoY) form a high-intent game audio cluster with low competition.
- **Reference UI (Ludo.ai Audio Generator Screenshots):**
  1. **Header Banner:** Purple-to-blue gradient header (`Audio Generator` / `AI Game Sound & Music Generator` + subtitle `"Generate speech, sound effects, music, and character voices for your game."`).
  2. **Dark Navy 3-Column Workbench (`#141829` / `#1D2237`):**
     - **Left Column (`Generation Mode`):** Interactive dropdown selector with all 8 Ludo-style game audio modes (with icon, title, and subtitle) plus a `? How it works` jump link:
       1. `sound-effects` — **Sound Effects**: Audio assets for UI, combat, and movement.
       2. `ambiance-loops` — **Ambiance Loops**: Seamless looping soundscapes.
       3. `music` — **Music**: Background themes for menus, levels, and cinematic sequences.
       4. `audio-remix` — **Audio Remix**: Create variations of sound effects, sound landscapes, and music.
       5. `human-voice` — **Human Voice**: Design unique voice actors by describing traits.
       6. `non-human-voice` — **Non-Human Voice**: Synthetic speech styles for robots, aliens, and stylized entities.
       7. `speech-clone` — **Speech (Clone)**: Replicate a voice style to generate consistent dialogue cues.
       8. `speech-preset` — **Speech (Preset)**: Select from preset voice archetypes for narration and dialogue.
     - **Center Column (`Description`):** Dark textarea (`maxLength={500}`) with dynamic mode-specific placeholder and quick-fill prompt chips.
     - **Right Column (`Duration / Loop / Tempo & Key`):**
       - `Duration (seconds)` 3-stop selector (`Auto`, `5s`, `10s`) matching the reference screenshot (which appends concise duration/envelope cues for short one-shots vs full phrases while delegating generation to KIE `ai-music-api/sounds`).
       - `Loop` toggle switch (`Off` / `On`) mapped directly to KIE `sound_loop`.
       - Compact `Tempo (BPM)` & `Musical Key` controls (`Auto` or `60–180 BPM`, `Any` / `Am` / `Cm` / `Dm` / `Em` / `C` / `G` etc.) mapped to KIE `sound_tempo` and `sound_key`.
  3. **Action Bar, Pro Tips Banner & Audio Grid:**
     - Toolbar with `Select Multiple`, `Filter Grid` (All / Favorites / Mode filter), and centered gradient primary button `Generate {Mode Name} (5 Credits)`.
     - Purple Pro Tips callout banner (`Audio Generator Pro Tips: Don't forget to click the Heart icon on successful generations to save them to your Favorites for easy access later.`).
     - Interactive Audio Results Grid: displays generated tracks (2 variations per KIE task) + preloaded real R2 game audio showcase tracks so first-time visitors can audition, loop-test, favorite (Heart icon persisted in `localStorage`), filter, and download MP3s immediately.

---

## 2. Backend Architecture & Data Flow

1. **KIE Sound Service (`src/lib/kie-api/kie-sound-service.ts`):**
   - Wraps `POST https://api.kie.ai/api/v1/jobs/createTask` and `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...` for model `ai-music-api/sounds`.
   - Input payload strictly follows KIE `ai-music-api/sounds` schema:
     ```json
     {
       "model": "ai-music-api/sounds",
       "input": {
         "prompt": "...",
         "model": "V6",
         "sound_loop": true,
         "sound_tempo": 96,
         "sound_key": "Am",
         "grab_lyrics": false
       }
     }
     ```
   - Extracts completed clips from `data.response.data[]` (or parsed `data.resultJson.data[]`), returning `{ id, audioUrl, streamAudioUrl, imageUrl, duration, title, tags }`.
2. **API Endpoints:**
   - `POST /api/sound/generate` (`src/app/api/sound/generate/route.ts`):
     - Authenticates Bearer token via Supabase.
     - Screens prompt with `screenPrompt()` (Creem moderation) and checks rate limit (`imageLimiter`).
     - Verifies user has `>= 5` credits (`creditsRequired = 5`, upstream cost is `2.5` KIE credits ≈ \$0.0125 per request yielding 2 clips).
     - Builds mode-aware prompt (incorporating mode framing + optional duration cue within the 500-char limit) and calls `KIESoundService.createSoundTask(...)`.
     - Persists task metadata via `saveKIETaskMetadataKV` (with `metadata.taskKind = 'sound'`) and deducts 5 credits in `credit_transactions`.
   - `GET /api/sound/task-status` (`src/app/api/sound/task-status/route.ts`):
     - Reads KV metadata and polls `KIESoundService.getTaskStatus(taskId)`.
     - When `state === 'success'`, downloads the generated MP3 clips, uploads them to Cloudflare R2 under `sounds/kie-sound-${taskId}-${idx}.mp3`, updates KV metadata to `completed` with permanent R2 `resultUrls` and clip details (`clips`), and returns them to the client.
     - When `state === 'fail'`, marks KV metadata `failed` and refunds the 5 credits idempotently if not yet refunded.

---

## 3. Real Showcase Assets & SEO Sections

- Generate real game audio clips via KIE `ai-music-api/sounds` and upload to Cloudflare R2 (`showcases/game-sound-generator/`), plus an OG cover image (`showcases/game-sound-generator/feature/og-image.jpg`).
- Store showcase metadata in `src/data/game-sound-samples.json`.
- Build 14-locale SEO sections below the workbench:
  - What is the AI Game Sound & Music Generator?
  - How to Generate Game Audio (3 steps)
  - Real Game Audio Showcase & Copyable Prompts (BGM loops, combat/UI SFX, ambiance loops, character voices)
  - Supported Game Audio Modes comparison table
  - Pro Tips for Seamless Loops & Game Engine Integration (Unity, Unreal, Godot)
  - 6 FAQs with `FAQSchema` JSON-LD + `BreadcrumbSchema` + `WebApplication` JSON-LD
- Register in `src/lib/nav-data.ts` and `public/sitemap.xml` across all 14 locales.
