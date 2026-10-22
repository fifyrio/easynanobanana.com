# Seedance 2.5 AI Video Generator (`/video/seedance-2-5-ai-video-generator`) Design & Implementation Plan

**Date:** 2026-10-22  
**Target Keywords:** `seedance 2.5`, `seedance 2.5 text to video`, `seedance 2.5 free`, `seedance 2.5 ai video generator`  
**Route:** `/[locale]/video/seedance-2-5-ai-video-generator` (14 locales)

---

## 1. Context & Opportunity
- **Keyword Demand**: `seedance 2.5` and `seedance 2.5 text to video` are surging search queries around ByteDance's next-generation Seedance 2.5 multimodal video generation model (supporting reference-to-video, image-to-video, text-to-video, synchronized native audio, and 4–30s continuous motion).
- **Upstream Provider & Unit Economics (`aisplice.store`)**:
  - Upstream API: `https://www.aisplice.store/v1/videos` (`manual/tasks/videos`)
  - Model ID: `doubao-seedance-2.5`
  - Upstream Pricing: Base rate `$0.216/s` at 720p; `480p` multiplier `0.4448148` = **`$0.09608/s`** (`$0.384` per 4-second 480p clip, 31% cheaper than KIE's `$0.56`).
  - User Credit Cost: **100 credits** per 4-second 480p clip with synchronized audio (`generate_audio: true`). Works out-of-the-box with `public.deduct_credits_for_video` RPC (zero database migration) and maintains ~61% gross margin on the `$0.99 / 100-credit` paid video trial (`videoTrial`) and 92%–96% gross margin on standard subscription & credit packs.

---

## 2. Architecture & Data Flow

### 2.1 AISplice Video Service (`src/lib/aisplice-api/aisplice-video-service.ts`)
- Encapsulates calls to `https://www.aisplice.store/v1/videos`:
  - `createVideoTask(input)`: `POST /v1/videos` with `Authorization: Bearer ${AISPLICE_API_KEY}`
    - Payload:
      ```json
      {
        "model": "doubao-seedance-2.5",
        "prompt": "...",
        "images": ["https://..."],
        "duration": 4,
        "resolution": "480p",
        "size": "9:16",
        "nsfw_check": true,
        "metadata": {
          "generate_audio": true,
          "watermark": false,
          "output_format": "mp4"
        }
      }
      ```
    - Returns `task_id`.
  - `getTaskStatus(taskId)`: `GET /v1/videos/${encodeURIComponent(taskId)}`
    - Maps `status` (`queued | in_progress | completed | failed | unknown`) to normalized state (`waiting | success | fail`), extracting `videoUrl` from `url || metadata?.url || output?.url` and `error` from `fail_reason || error?.message`.
  - `downloadVideoBuffer(taskId, directUrl?)`:
    - Downloads the finished MP4 via `GET /v1/videos/${encodeURIComponent(taskId)}/content` (with `Authorization: Bearer ${AISPLICE_API_KEY}`) or falls back to `directUrl`, with retry + timeout protection.

### 2.2 Video Generation & Polling Integration
1. **`POST /api/video/generate`** (`src/app/api/video/generate/route.ts`):
   - Add `'ai-seedance-2-5'` to `EffectType` and `EFFECTS` with `provider: 'aisplice'`, `aispliceModel: 'doubao-seedance-2.5'`, `generateAudio: true`, and `presets: aiSeedance25PresetsJson.presets`.
   - After reserving 100 credits via `deduct_credits_for_video`, dispatch `'ai-seedance-2-5'` to `AISpliceVideoService.createVideoTask(...)` and store `provider: 'aisplice-seedance-2-5'` in the `videos.metadata` JSONB column alongside `external_task_id`.
   - On submission failure, mark `videos.status = 'failed'` and call `refund_video_credits`.
2. **`GET /api/video/task-status`** (`src/app/api/video/task-status/route.ts`):
   - When `video.status === 'processing'` and `video.effect_type === 'ai-seedance-2-5'` (or `video.metadata?.provider === 'aisplice-seedance-2-5'`), poll `AISpliceVideoService.getTaskStatus(taskId)`:
     - On `success`: download the MP4 via `AISpliceVideoService.downloadVideoBuffer`, upload to R2 (`videos/seedance-2-5-${taskId}.mp4`), update the `videos` row (`status = 'completed'`, `video_url = r2Url`, `completed_at`), and return `{ status: 'completed', videoUrl: r2Url }`.
     - On `fail`: update the `videos` row (`status = 'failed'`, `error_message`), invoke `refund_video_credits` (`p_provider_charged: false`), and return `{ status: 'failed', errorMessage }`.
3. **`POST /api/video/callback`** (`src/app/api/video/callback/route.ts`):
   - Support both KIE callback payloads and AISplice webhook payloads (`{ task_id, status: 'completed' | 'failed', url, fail_reason }`) idempotently.

### 2.3 Presets (`src/data/ai-seedance-2-5-presets.json`)
Three showcase presets tailored to Seedance 2.5's stronger temporal consistency, camera choreography, and native synchronized audio:
1. `dynamic-hero-orbit` — **Dynamic Hero Orbit & Lighting Shift** (smooth 360-degree orbital camera move around a character in golden-hour cyber-editorial lighting with natural hair/coat physics and synchronized atmospheric soundscape)
2. `cinematic-action-tracking` — **Cinematic Action Tracking Shot** (low-angle tracking shot following a brisk stride through a neon-lit rain street with puddle reflections and synchronized footsteps + rain ambience)
3. `macro-commercial-reveal` — **Luxury Macro Commercial Reveal** (precision macro push-in and orbital sweep across a luxury chronograph watch on volcanic stone with drifting mist and subtle mechanical/ambient resonance)

### 2.4 Frontend Generator & 14-Locale Landing Page
- **Component**: Update `src/components/video/VideoEffectGenerator.tsx` to accept `'ai-seedance-2-5'` and `'aiSeedance25'`.
- **Page**: Create `src/app/[locale]/video/seedance-2-5-ai-video-generator/page.tsx` with:
  - Hero + interactive `VideoEffectGenerator` (`allowAspectRatio={true}`, `allowCustomText={true}`)
  - Before / After showcase cards (3 real R2 videos + input reference photos + audio badges)
  - 3-step How-It-Works section
  - 4 Key Features highlighting Seedance 2.5 upgrades (multi-reference consistency, complex camera choreography, native audio-visual sync, 4–30s architecture)
  - 6 Use Cases
  - Seedance 2.5 vs Seedance 2.0 comparison table + transparent credit pricing
  - 6 FAQ items + `FAQPage` JSON-LD schema
  - Internal cross-links to `/video/seedance-2-0-ai-video-generator`, `/flux-3-image-klein`, `/image-editor`, etc.
- **Navigation & Sitemap**:
  - Register `aiSeedance25` in `src/lib/nav-data.ts` (`buildVideoDropdown`)
  - Add all 14 locale URLs for `/video/seedance-2-5-ai-video-generator` to `public/sitemap.xml`.
