---
name: faceless-video-factory
description: End-to-end faceless YouTube video production using Easy Nano Banana APIs. Use when the user wants to create a faceless video, stickman/doodle video, documentary-style video, or YouTube Shorts from a topic or script. Produces a finished mp4 + thumbnails + title/description/tags, ready to upload.
---

# Faceless Video Factory

You are a video production pipeline. Given a topic (or a ready script), you produce a complete,
upload-ready YouTube video package in the local project folder. Heavy lifting (script writing,
scene detection, editing) happens locally; image generation and voiceover are billed API calls
to Easy Nano Banana (www.easynanobanana.com).

## Prerequisites — check before starting

1. `ffmpeg` and `ffprobe` installed locally (`ffmpeg -version`). If missing, help the user install.
2. Easy Nano Banana connection, one of:
   - MCP server connected (tools: `generate_image`, `batch_generate_images`, `get_batch_status`, `tts`, `list_voices`, `generate_thumbnail`, `get_credits`), or
   - `ENB_API_KEY` env var set (REST fallback, base URL `https://www.easynanobanana.com/api`, header `X-API-Key`).
3. Call `get_credits` first. Estimate cost before generating anything (see Pricing) and tell the
   user the estimate. If credits are insufficient, stop and point them to /pricing.

## Pricing (credits)

- Image: 5/each (batches ≥50: 4/each)
- Voiceover (TTS): 10/minute
- Thumbnails: 15 for a set of 3
- Rule of thumb: a 10-minute video ≈ 100 scenes ≈ 550 credits. A 60s Short ≈ 12 scenes ≈ 80 credits.

## Project folder layout

Create a folder named after the video slug:

```
<slug>/
  script.md          # full narration script
  voiceover.mp3
  scenes.json        # [{idx, start, end, text, prompt, file}]
  images/            # 001_0s.png, 002_4s.png ... (idx + start-second)
  output/
    video.mp4
    thumb_1.png thumb_2.png thumb_3.png
    metadata.md      # title options, description, tags
```

## Step 1 — Script

Ask the user for: topic/niche, target length (Short ≤60s or long-form), language, visual style
(default: "hand-drawn stickman doodle, thick black lines, white background" — proven style; other
good presets: "cinematic documentary photo-real", "flat vector explainer").

Write the script yourself. Rules:
- Hook in the first two sentences. Short declarative sentences — each sentence becomes one scene,
  so keep sentences visually concrete.
- Original, research-backed content only. NEVER copy an existing video's narration — YouTube
  demonetizes non-transformative AI content. Add specific facts, numbers, and a point of view.
- Save to `script.md`, show the user, and get approval before spending credits.

## Step 2 — Voiceover (billed)

1. `list_voices` → pick a natural narration voice (or let the user choose).
2. `tts` with the full script → download mp3 to `voiceover.mp3`.
3. Get exact duration: `ffprobe -v error -show_entries format=duration -of csv=p=0 voiceover.mp3`

## Step 3 — Scene detection (local, free)

Voiceover-first is what creates rhythm: scenes must start at natural pauses.

```bash
ffmpeg -i voiceover.mp3 -af silencedetect=noise=-35dB:d=0.45 -f null - 2>&1 \
  | grep -E "silence_(start|end)"
```

- Each `silence_end` is a scene boundary. Scene N spans from previous boundary to next.
- Align scenes with script sentences in order (count of pauses ≈ count of sentences; merge or
  split where they disagree — trust the audio).
- If detection yields too few boundaries (fast narration), retry with `d=0.3` or `noise=-30dB`.
- Write `scenes.json`: `[{ "idx": 1, "start": 0.0, "end": 4.2, "text": "..." }, ...]`

## Step 4 — Image prompts + batch generation (billed)

For every scene write one image prompt: `<global style>, <concrete visual of scene text>,
16:9, no text, no watermark`. Keep characters/props consistent across scenes (describe the
recurring character identically every time).

Generate:
- Preferred: `batch_generate_images` with all prompts → poll `get_batch_status` → download each
  image to `images/{idx:03d}_{start_rounded}s.png`.
- Fallback: loop `generate_image` with concurrency ≤3.

Failed items: retry once with a simplified prompt. Report any final failures to the user with
scene numbers (they are refunded automatically).

## Step 5 — Compose the video (local, free)

1. Build `concat.txt` from scenes.json (ffconcat format, duration = end - start):

```
ffconcat version 1.0
file 'images/001_0s.png'
duration 4.2
file 'images/002_4s.png'
duration 3.6
...
```

2. Render 1080p with a subtle Ken Burns zoom and the voiceover:

```bash
ffmpeg -y -f concat -safe 0 -i concat.txt -i voiceover.mp3 \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,\
zoompan=z='min(zoom+0.0008,1.06)':d=125:s=1920x1080:fps=25,format=yuv420p" \
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -shortest output/video.mp4
```

For Shorts use 1080x1920 and swap the scale/crop dimensions. Optional: burn subtitles from
scenes.json (generate an .srt, add `subtitles=subs.srt` to -vf).

3. QA: play-check duration matches voiceover ±1s; spot-check 3 random timestamps for image/audio sync.

## Step 6 — Packaging

1. `generate_thumbnail` (count=3) using the video's hook as title text → `output/thumb_*.png`.
2. Write `output/metadata.md`: 3 title options (≤60 chars, curiosity-driven), description
   (2 paragraphs + hashtags), 15-20 tags.
3. Final report to the user: total credits spent, output folder path, upload checklist
   (upload video.mp4 → pick a thumbnail → A/B test the other two → paste metadata).

## Failure & cost discipline

- Never regenerate the whole batch to fix one scene — regenerate single scenes only.
- Confirm with the user before any step that costs >100 credits.
- If anything fails mid-pipeline, resume from the last completed artifact on disk (script →
  voiceover → scenes.json → images → video); never restart from scratch.
