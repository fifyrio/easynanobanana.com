/**
 * AI Pet Talk/Sing Asset Generator
 *
 * Generates static assets for the informational-intent galleries under
 * /ai-pet-video/{talking-pet,singing-cat-video,singing-dog-video,talking-animal-video}:
 *   1. 6 preset thumbnails (nano-banana text-to-image, 1:1)  → preset/<id>.jpg
 *   2. 6 demo clips (Seedance image-to-video, with audio)    → demo/<id>.mp4
 *   3. OG banner (1:1)                                       → feature/og-image.png
 *
 * Mirrors to public/images/showcases/ai-pet-talk/ and uploads to R2 under
 * showcases/ai-pet-talk/. Reuses the same KIE services and token as the dance
 * generator — talking/singing is just a different prompt, not a new pipeline.
 *
 * Usage:
 *   npx tsx scripts/generate-ai-pet-talk-assets.ts                # everything
 *   npx tsx scripts/generate-ai-pet-talk-assets.ts --presets-only
 *   npx tsx scripts/generate-ai-pet-talk-assets.ts --clips-only
 *   npx tsx scripts/generate-ai-pet-talk-assets.ts --preset sing-cat
 *   npx tsx scripts/generate-ai-pet-talk-assets.ts --dry-run
 *   npx tsx scripts/generate-ai-pet-talk-assets.ts --force
 */

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

const R2_PUBLIC_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'
const R2_PREFIX = 'showcases/ai-pet-talk'
const LOCAL_BASE = 'public/images/showcases/ai-pet-talk'

interface CliArgs {
  presetId?: string
  presetsOnly: boolean
  clipsOnly: boolean
  dryRun: boolean
  force: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const flag = (name: string): string | undefined => {
    const idx = args.indexOf(name)
    return idx >= 0 ? args[idx + 1] : undefined
  }
  return {
    presetId: flag('--preset'),
    presetsOnly: args.includes('--presets-only'),
    clipsOnly: args.includes('--clips-only'),
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  }
}

interface TalkPreset {
  id: string
  name: string
  description: string
  displaySrc: string
  thumbnailScene: string
  stillPrompt: string
  prompt: string
}

const PHOTO_STYLE =
  'Photorealistic pet photography, cinematic lighting, shallow depth of field, sharp fur or feather detail, head and shoulders in frame, no text, no watermark.'

function buildThumbnailPrompt(preset: TalkPreset): string {
  return `${PHOTO_STYLE} Square composition featuring ${preset.thumbnailScene}.`
}

const OG_IMAGE_PROMPT = `${PHOTO_STYLE} Square hero banner: a cat at a vintage microphone singing, a dog talking to camera, and a colourful parrot mid-word, arranged in a warm-lit row. Leave gentle margins, no real text.`

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

type KieImage = InstanceType<typeof import('../src/lib/kie-api/kie-image-service').KIEImageService>

async function generateImage(kie: KieImage, prompt: string, ratio: '1:1' | '9:16'): Promise<Buffer> {
  const taskId = await kie.createPromptOnlyTask(prompt, ratio, 'google/nano-banana')
  console.log(`   task=${taskId}`)
  for (let i = 1; i <= 60; i += 1) {
    await sleep(5000)
    const status = await kie.getTaskStatus(taskId)
    if (status.state === 'success') {
      const parsed = JSON.parse(status.resultJson) as { resultUrls?: string[] }
      const url = parsed.resultUrls?.[0]
      if (!url) throw new Error('success but no resultUrls')
      return downloadBuffer(url)
    }
    if (status.state === 'failed') throw new Error('KIE image task failed')
    if (i % 6 === 0) console.log(`   ⏳ still ${status.state}... (${i * 5}s)`)
  }
  throw new Error('image generation timeout')
}

type KieVideo = InstanceType<typeof import('../src/lib/kie-api/kie-video-service').KIEVideoService>

async function generateVideo(kieVideo: KieVideo, prompt: string, referenceImageUrl: string): Promise<Buffer> {
  const taskId = await kieVideo.createSeedanceTask({
    prompt,
    referenceImageUrls: [referenceImageUrl],
    duration: 4,
    resolution: '480p',
    aspectRatio: '9:16',
    generateAudio: true,
  })
  console.log(`   task=${taskId}`)
  for (let i = 1; i <= 60; i += 1) {
    await sleep(5000)
    const status = await kieVideo.getTaskStatus(taskId)
    if (status.state === 'success') {
      const parsed = JSON.parse(status.resultJson) as { resultUrls?: string[] }
      const url = parsed.resultUrls?.[0]
      if (!url) throw new Error('success but no resultUrls')
      return downloadBuffer(url)
    }
    if (status.state === 'fail') throw new Error(`video failed: ${status.failMsg}`)
    if (i % 4 === 0) console.log(`   ⏳ ${status.state}... (${i * 5}s)`)
  }
  throw new Error('video generation timeout')
}

async function main(): Promise<void> {
  const cli = parseArgs()
  if (!process.env.KIE_API_TOKEN) throw new Error('KIE_API_TOKEN missing in .env.local / .env')

  const presetsPath = path.join(process.cwd(), 'src/data/ai-pet-talk-presets.json')
  const { presets } = JSON.parse(fs.readFileSync(presetsPath, 'utf8')) as { presets: TalkPreset[] }

  const presetDir = path.join(process.cwd(), LOCAL_BASE, 'preset')
  const demoDir = path.join(process.cwd(), LOCAL_BASE, 'demo')
  const featureDir = path.join(process.cwd(), LOCAL_BASE, 'feature')
  for (const dir of [presetDir, demoDir, featureDir]) fs.mkdirSync(dir, { recursive: true })

  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const kie = new KIEImageService()

  let uploadBufferToR2: typeof import('../src/lib/r2').uploadBufferToR2 | null = null
  if (!cli.dryRun) uploadBufferToR2 = (await import('../src/lib/r2')).uploadBufferToR2

  const saveAndUpload = async (localPath: string, r2Key: string, buf: Buffer, contentType: string): Promise<void> => {
    fs.writeFileSync(localPath, buf)
    console.log(`   💾 ${path.relative(process.cwd(), localPath)} (${buf.length} bytes)`)
    if (uploadBufferToR2) {
      await uploadBufferToR2({ key: r2Key, body: buf, contentType, metadata: { source: 'ai-pet-talk-asset-generator' } })
      console.log(`   ☁️  ${r2Key}`)
    }
  }

  let targets = presets
  if (cli.presetId) {
    targets = targets.filter((p) => p.id === cli.presetId)
    if (targets.length === 0) throw new Error(`preset id not found: ${cli.presetId}`)
  }

  // ===== Phase 1: thumbnails =====
  if (!cli.clipsOnly) {
    console.log(`🎤 Generating ${targets.length} preset thumbnail(s)...`)
    for (const preset of targets) {
      const localPath = path.join(presetDir, `${preset.id}.jpg`)
      if (fs.existsSync(localPath) && !cli.force) {
        console.log(`⏭️  ${preset.id} — exists, skip (--force to override)`)
        continue
      }
      const prompt = buildThumbnailPrompt(preset)
      console.log(`📝 ${preset.id}`)
      if (cli.dryRun) { console.log(`   ${prompt}`); continue }
      try {
        const buf = await generateImage(kie, prompt, '1:1')
        await saveAndUpload(localPath, `${R2_PREFIX}/preset/${preset.id}.jpg`, buf, 'image/jpeg')
      } catch (err) {
        console.error(`   ❌ ${preset.id} failed:`, err instanceof Error ? err.message : err)
      }
      console.log()
    }

    console.log('🖼  Generating OG image...')
    if (cli.dryRun) {
      console.log(`   ${OG_IMAGE_PROMPT}`)
    } else if (!cli.presetId) {
      const buf = await generateImage(kie, OG_IMAGE_PROMPT, '1:1')
      await saveAndUpload(path.join(featureDir, 'og-image.png'), `${R2_PREFIX}/feature/og-image.png`, buf, 'image/png')
    }
    console.log()
  }

  if (cli.presetsOnly) { console.log('Done (presets only).'); return }

  // ===== Phase 2: demo clips (first frame = the preset thumbnail) =====
  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const kieVideo = new KIEVideoService()

  console.log(`🎬 Generating ${targets.length} demo clip(s)...`)
  for (const preset of targets) {
    const localPath = path.join(demoDir, `${preset.id}.mp4`)
    if (fs.existsSync(localPath) && !cli.force) {
      console.log(`⏭️  ${preset.id} — exists, skip (--force to override)`)
      continue
    }
    console.log(`🎞  ${preset.id}`)
    if (cli.dryRun) { console.log(`   ${preset.prompt}`); continue }

    const thumbUrl = `${R2_PUBLIC_BASE}/${R2_PREFIX}/preset/${preset.id}.jpg`
    try {
      const buf = await generateVideo(kieVideo, preset.prompt, thumbUrl)
      await saveAndUpload(localPath, `${R2_PREFIX}/demo/${preset.id}.mp4`, buf, 'video/mp4')
    } catch (err) {
      console.error(`   ❌ ${preset.id} failed:`, err instanceof Error ? err.message : err)
    }
    console.log()
  }

  console.log('🎉 Done.')
}

main().catch((err) => {
  console.error('💥 Fatal:', err)
  process.exit(1)
})
