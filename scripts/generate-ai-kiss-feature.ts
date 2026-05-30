/**
 * AI Kiss Feature Asset Generator
 *
 * One-shot generator for the hero before/after sample assets used as the
 * default state on /video/ai-kiss when nothing is uploaded.
 *
 *   1. Couple photo (nano-banana text-to-image) → feature/sample-couple.jpg
 *   2. Kiss video (Seedance image-to-video) → feature/sample-kiss.mp4
 *
 * Both uploaded to R2 under showcases/ai-kiss/feature/.
 *
 * Usage:
 *   npx tsx scripts/generate-ai-kiss-feature.ts            # generate both
 *   npx tsx scripts/generate-ai-kiss-feature.ts --image-only
 *   npx tsx scripts/generate-ai-kiss-feature.ts --video-only --image-url <url>
 */

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

const R2_PUBLIC_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'

const COUPLE_PROMPT =
  'Professional cinematic photograph of a young couple standing close together, both looking warmly at each other. Soft warm golden hour lighting, shallow depth of field, blurred outdoor background. Photorealistic, 8K quality, both faces clearly visible.'

const KISS_VIDEO_PROMPT =
  'The young couple in the reference image lean in and share a tender, romantic kiss, eyes softly closing. Smooth cinematic motion, warm golden hour lighting, both faces clearly visible.'

interface CliArgs {
  imageOnly: boolean
  videoOnly: boolean
  imageUrl?: string
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const flag = (n: string) => {
    const i = args.indexOf(n)
    return i >= 0 ? args[i + 1] : undefined
  }
  return {
    imageOnly: args.includes('--image-only'),
    videoOnly: args.includes('--video-only'),
    imageUrl: flag('--image-url'),
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main(): Promise<void> {
  const cli = parseArgs()

  if (!process.env.KIE_API_TOKEN) throw new Error('KIE_API_TOKEN missing')

  const featureDir = path.join(
    process.cwd(),
    'public/images/showcases/ai-kiss/feature'
  )
  fs.mkdirSync(featureDir, { recursive: true })

  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const { uploadBufferToR2 } = await import('../src/lib/r2')

  let coupleImageUrl = cli.imageUrl

  // ===== Phase 1: couple before image =====
  if (!cli.videoOnly) {
    console.log('📸 Generating sample couple image...')
    const kieImg = new KIEImageService()
    const taskId = await kieImg.createPromptOnlyTask(COUPLE_PROMPT, '1:1', 'google/nano-banana')
    console.log(`   task=${taskId}`)

    let resultUrl: string | null = null
    for (let i = 1; i <= 60; i += 1) {
      await sleep(5000)
      const status = await kieImg.getTaskStatus(taskId)
      if (status.state === 'success') {
        const parsed = JSON.parse(status.resultJson) as { resultUrls?: string[] }
        resultUrl = parsed.resultUrls?.[0] ?? null
        break
      }
      if (status.state === 'failed') throw new Error('couple image failed')
      if (i % 6 === 0) console.log(`   ⏳ ${status.state}... (${i * 5}s)`)
    }
    if (!resultUrl) throw new Error('couple image timeout')

    const buf = await downloadBuffer(resultUrl)
    const localPath = path.join(featureDir, 'sample-couple.jpg')
    fs.writeFileSync(localPath, buf)
    console.log(`   💾 ${path.relative(process.cwd(), localPath)} (${buf.length} bytes)`)

    await uploadBufferToR2({
      key: 'showcases/ai-kiss/feature/sample-couple.jpg',
      body: buf,
      contentType: 'image/jpeg',
      metadata: { source: 'ai-kiss-feature-generator' },
    })
    coupleImageUrl = `${R2_PUBLIC_BASE}/showcases/ai-kiss/feature/sample-couple.jpg`
    console.log(`   ☁️  ${coupleImageUrl}`)
    console.log()
  }

  if (cli.imageOnly) {
    console.log('Done (image only).')
    return
  }

  if (!coupleImageUrl) {
    throw new Error('no couple image url — pass --image-url or skip --video-only')
  }

  // ===== Phase 2: kiss video =====
  console.log('🎬 Generating sample kiss video...')
  console.log(`   first frame: ${coupleImageUrl}`)
  const kieVideo = new KIEVideoService()
  const videoTaskId = await kieVideo.createSeedanceTask({
    prompt: KISS_VIDEO_PROMPT,
    referenceImageUrls: [coupleImageUrl],
    duration: 4,
    resolution: '480p',
    aspectRatio: '9:16',
    generateAudio: true,
  })
  console.log(`   task=${videoTaskId}`)

  let videoUrl: string | null = null
  for (let i = 1; i <= 60; i += 1) {
    await sleep(5000)
    const status = await kieVideo.getTaskStatus(videoTaskId)
    if (status.state === 'success') {
      const parsed = JSON.parse(status.resultJson) as { resultUrls?: string[] }
      videoUrl = parsed.resultUrls?.[0] ?? null
      break
    }
    if (status.state === 'fail') throw new Error(`kiss video failed: ${status.failMsg}`)
    if (i % 4 === 0) console.log(`   ⏳ ${status.state}... (${i * 5}s)`)
  }
  if (!videoUrl) throw new Error('kiss video timeout')

  const vbuf = await downloadBuffer(videoUrl)
  const localVideoPath = path.join(featureDir, 'sample-kiss.mp4')
  fs.writeFileSync(localVideoPath, vbuf)
  console.log(`   💾 ${path.relative(process.cwd(), localVideoPath)} (${vbuf.length} bytes)`)

  await uploadBufferToR2({
    key: 'showcases/ai-kiss/feature/sample-kiss.mp4',
    body: vbuf,
    contentType: 'video/mp4',
    metadata: { source: 'ai-kiss-feature-generator' },
  })
  const r2VideoUrl = `${R2_PUBLIC_BASE}/showcases/ai-kiss/feature/sample-kiss.mp4`
  console.log(`   ☁️  ${r2VideoUrl}`)
  console.log()
  console.log('🎉 Done.')
  console.log()
  console.log('Wire into AiKissExperience:')
  console.log(`  sample image: ${R2_PUBLIC_BASE}/showcases/ai-kiss/feature/sample-couple.jpg`)
  console.log(`  sample video: ${r2VideoUrl}`)
}

main().catch((err) => {
  console.error('💥 Fatal:', err)
  process.exit(1)
})
