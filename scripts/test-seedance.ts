/**
 * Seedance 2 Fast — POC test script
 *
 * End-to-end validation of the image-to-video pipeline:
 *   1. Submit task to KIE via KIEVideoService
 *   2. Seed Cloudflare KV so the webhook callback finds the task
 *   3. Poll KIE /recordInfo every 5s (validates KIE-side progress)
 *   4. After KIE reports success, fetch KV to confirm webhook landed
 *      and the mp4 was transferred to R2
 *
 * --- Setup ---
 *   1. In .env.local make sure these are set:
 *        KIE_API_TOKEN=sk-kie-...
 *        KIE_VIDEO_CALLBACK_URL=https://<ngrok-subdomain>.ngrok-free.app/api/video/callback
 *        CLOUDFLARE_KV_NAMESPACE_ID=...
 *        CLOUDFLARE_KV_API_TOKEN=...
 *        CLOUDFLARE_ACCOUNT_ID=...
 *        R2_ACCOUNT_ID=...   R2_ACCESS_KEY_ID=...   R2_SECRET_ACCESS_KEY=...
 *        R2_BUCKET_NAME=...  R2_PUBLIC_BASE_URL=... (or NEXT_PUBLIC_R2_ENDPOINT)
 *
 *   2. In one terminal:
 *        ngrok http 3000
 *      Copy the https URL and put it in KIE_VIDEO_CALLBACK_URL above.
 *
 *   3. In another terminal:
 *        npm run dev
 *
 *   4. In a third terminal:
 *        npx tsx scripts/test-seedance.ts \
 *           --first-frame-url "https://your-r2-domain/path/to/character.png" \
 *           --prompt "the character walks forward and waves, cinematic"
 *
 *  Notes:
 *   - Use a publicly reachable image URL (R2 public bucket, CDN, etc.)
 *     Local file paths or signed S3 URLs that expire will not work.
 *   - Pure text-to-video also works — just omit --first-frame-url.
 */

import path from 'path'
import dotenv from 'dotenv'

// IMPORTANT: dotenv must run BEFORE any module that reads process.env at top level.
// cloudflare-kv.ts captures env vars on module load, so we use dynamic imports below.
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

import type {
  SeedanceResolution,
  SeedanceAspectRatio,
} from '../src/lib/kie-api/kie-video-service'

// ===== CLI =====

interface CliArgs {
  prompt: string
  firstFrameUrl?: string
  duration: number
  resolution: SeedanceResolution
  aspectRatio: SeedanceAspectRatio
  generateAudio: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const flag = (name: string): string | undefined => {
    const idx = args.indexOf(name)
    return idx >= 0 ? args[idx + 1] : undefined
  }
  // Cheapest POC defaults: 480p, 4s, with audio = 9 credits/s × 4s = 36 credits ≈ $0.18
  // Pricing reference (per second):
  //   480p with-audio  =  9   credits  ($0.045)
  //   480p no-audio    = 15.5 credits  ($0.0775)
  //   720p with-audio  = 20   credits  ($0.10)
  //   720p no-audio    = 33   credits  ($0.165)
  return {
    prompt:
      flag('--prompt') ??
      'a cute cartoon banana character with a yellow helmet walks forward and waves cheerfully, soft pastel lighting, cinematic',
    firstFrameUrl: flag('--first-frame-url'),
    duration: Number.parseInt(flag('--duration') ?? '4', 10),
    resolution: (flag('--resolution') ?? '480p') as SeedanceResolution,
    aspectRatio: (flag('--aspect-ratio') ?? '9:16') as SeedanceAspectRatio,
    generateAudio: (flag('--generate-audio') ?? 'true') === 'true',
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
  const cli = parseArgs()

  if (!process.env.KIE_API_TOKEN) {
    throw new Error(
      'KIE_API_TOKEN missing. Set it in .env.local before running this script.'
    )
  }
  if (!process.env.KIE_VIDEO_CALLBACK_URL) {
    console.warn(
      '⚠️  KIE_VIDEO_CALLBACK_URL is not set — KIE will not deliver a webhook.'
    )
    console.warn(
      '   The script will still validate KIE-side generation via polling.'
    )
  }

  console.log('🎬 Seedance 2 Fast POC')
  console.log('─'.repeat(70))
  console.log(`Prompt:         ${cli.prompt}`)
  console.log(`First frame:    ${cli.firstFrameUrl ?? '(text-to-video only)'}`)
  console.log(`Duration:       ${cli.duration}s`)
  console.log(`Resolution:     ${cli.resolution}`)
  console.log(`Aspect ratio:   ${cli.aspectRatio}`)
  console.log(`Generate audio: ${cli.generateAudio}`)
  console.log(`Callback URL:   ${process.env.KIE_VIDEO_CALLBACK_URL ?? '(none)'}`)
  console.log('─'.repeat(70))

  // Dynamic imports so env vars are populated before modules capture them.
  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const { saveKIETaskMetadataKV, getKIETaskMetadataKV } = await import(
    '../src/lib/cloudflare-kv'
  )

  const service = new KIEVideoService()

  const taskId = await service.createSeedanceTask({
    prompt: cli.prompt,
    firstFrameUrl: cli.firstFrameUrl,
    duration: cli.duration,
    resolution: cli.resolution,
    aspectRatio: cli.aspectRatio,
    generateAudio: cli.generateAudio,
  })

  // Seed KV so the webhook can find the task.
  await saveKIETaskMetadataKV({
    taskId,
    status: 'pending',
    prompt: cli.prompt,
    imageUrl: cli.firstFrameUrl ?? '',
    imageType: 'generation',
    metadata: {
      isVideo: true,
      model: 'bytedance/seedance-2-fast',
      duration: cli.duration,
      resolution: cli.resolution,
      aspectRatio: cli.aspectRatio,
      generateAudio: cli.generateAudio,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  console.log(`📌 Seeded KV with taskId: ${taskId}`)
  console.log()

  // Poll loop — 60 attempts × 5s = 5 min max.
  const maxAttempts = 60
  const intervalMs = 5_000

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await sleep(intervalMs)

    try {
      const status = await service.getTaskStatus(taskId)
      console.log(
        `[${String(attempt).padStart(2, '0')}/${maxAttempts}] state=${status.state} progress=${status.progress}% costTime=${status.costTime}ms`
      )

      if (status.state === 'success') {
        const result = KIEVideoService.processCallback({
          code: 200,
          msg: 'success',
          data: status,
        })

        console.log()
        console.log('✅ KIE reports SUCCESS')
        console.log(`   Source mp4:    ${result.videoUrl}`)
        console.log(`   Credits used:  ${status.creditsConsumed}`)
        console.log(`   Cost time:     ${status.costTime}ms`)

        // Give the webhook + R2 transfer time to finish.
        console.log()
        console.log('⏳ Waiting 15s for webhook → R2 transfer to complete...')
        await sleep(15_000)

        const kv = await getKIETaskMetadataKV(taskId)
        console.log()
        console.log('📦 KV metadata after callback:')
        console.log(JSON.stringify(kv, null, 2))

        if (kv?.status === 'completed' && kv.resultUrls?.[0]) {
          console.log()
          console.log('🎉 POC PASSED — full pipeline working')
          console.log(`   R2 URL: ${kv.resultUrls[0]}`)
        } else {
          console.log()
          console.log('⚠️  KIE finished but webhook did not update KV. Check:')
          console.log('   • ngrok is running and forwarding to port 3000')
          console.log('   • dev server is running (`npm run dev`)')
          console.log('   • KIE_VIDEO_CALLBACK_URL matches the ngrok URL')
          console.log('   • Dev server logs show "📥 Received Seedance video callback"')
        }
        return
      }

      if (status.state === 'fail') {
        console.log()
        console.log(
          `❌ KIE reports FAIL: ${status.failMsg || status.failCode || '(no message)'}`
        )
        return
      }
    } catch (err) {
      console.warn(
        `Poll error (attempt ${attempt}):`,
        err instanceof Error ? err.message : err
      )
    }
  }

  console.log()
  console.log(
    `⏱️  Timeout after ${(maxAttempts * intervalMs) / 1000}s — task may still complete via webhook.`
  )
}

main().catch((err) => {
  console.error('💥 Fatal:', err)
  process.exit(1)
})
