/**
 * AI Pet Dance Asset Generator
 *
 * Generates every static asset for /ai-pet-video/ai-dog-dancing:
 *   1. 10 preset thumbnails (nano-banana text-to-image, 1:1)
 *        → preset/<id>.jpg
 *   2. Feature sample pet photo (9:16) + its dance video
 *        → feature/sample-pet.jpg, feature/sample-dance.mp4
 *   3. OG image (1:1 banner)
 *        → feature/og-image.png
 *   4. Demo wall clips for the featured styles (9:16, with audio)
 *        → demo/<id>.mp4
 *
 * Everything mirrors to public/images/showcases/ai-pet-dance/ and uploads
 * to R2 under showcases/ai-pet-dance/.
 *
 * Usage:
 *   npx tsx scripts/generate-ai-pet-dance-assets.ts                 # everything
 *   npx tsx scripts/generate-ai-pet-dance-assets.ts --presets-only
 *   npx tsx scripts/generate-ai-pet-dance-assets.ts --feature-only
 *   npx tsx scripts/generate-ai-pet-dance-assets.ts --demos-only
 *   npx tsx scripts/generate-ai-pet-dance-assets.ts --preset hip-hop
 *   npx tsx scripts/generate-ai-pet-dance-assets.ts --dry-run
 *   npx tsx scripts/generate-ai-pet-dance-assets.ts --force
 */

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

const R2_PUBLIC_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'
const R2_PREFIX = 'showcases/ai-pet-dance'
const LOCAL_BASE = 'public/images/showcases/ai-pet-dance'

/** Must match DEMO_PRESET_IDS in the page component. */
const DEMO_PRESET_IDS = ['hip-hop', 'kpop', 'breakdance', 'samba']

// ===== CLI args =====

interface CliArgs {
  presetId?: string
  imageUrl?: string
  presetsOnly: boolean
  featureOnly: boolean
  demosOnly: boolean
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
    imageUrl: flag('--image-url'),
    presetsOnly: args.includes('--presets-only'),
    featureOnly: args.includes('--feature-only'),
    demosOnly: args.includes('--demos-only'),
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  }
}

// ===== Types =====

interface PetDancePreset {
  id: string
  name: string
  description: string
  displaySrc: string
  thumbnailScene: string
  stillPrompt: string
  prompt: string
}

// ===== Prompts =====

const PHOTO_STYLE =
  'Photorealistic pet photography, cinematic lighting, shallow depth of field, sharp fur detail, full body in frame, no text, no watermark.'

function buildThumbnailPrompt(preset: PetDancePreset): string {
  return `${PHOTO_STYLE} Square composition featuring ${preset.thumbnailScene}.`
}

const SAMPLE_PET_PROMPT = `${PHOTO_STYLE} Vertical 9:16 composition: a happy golden retriever standing upright on its hind legs in a backwards cap and gold chain, mid hip-hop dance pose on a sunlit graffiti street corner, full body clearly visible from ears to paws.`

const OG_IMAGE_PROMPT = `${PHOTO_STYLE} Square hero banner: three pets — a golden retriever, a fluffy white pomeranian and a siamese cat — standing upright in a row, each mid dance pose in a different outfit, on a bright stage with soft confetti. Leave gentle margins, no real text.`

// ===== Helpers =====

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

type KieImage = InstanceType<
  typeof import('../src/lib/kie-api/kie-image-service').KIEImageService
>

async function generateImage(
  kie: KieImage,
  prompt: string,
  ratio: '1:1' | '9:16'
): Promise<Buffer> {
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

type KieVideo = InstanceType<
  typeof import('../src/lib/kie-api/kie-video-service').KIEVideoService
>

async function generateVideo(
  kieVideo: KieVideo,
  prompt: string,
  referenceImageUrl: string
): Promise<Buffer> {
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

// ===== Main =====

async function main(): Promise<void> {
  const cli = parseArgs()

  if (!process.env.KIE_API_TOKEN) {
    throw new Error('KIE_API_TOKEN missing in .env.local / .env')
  }

  const presetsPath = path.join(process.cwd(), 'src/data/ai-pet-dance-presets.json')
  const { presets } = JSON.parse(fs.readFileSync(presetsPath, 'utf8')) as {
    presets: PetDancePreset[]
  }

  const presetDir = path.join(process.cwd(), LOCAL_BASE, 'preset')
  const featureDir = path.join(process.cwd(), LOCAL_BASE, 'feature')
  const demoDir = path.join(process.cwd(), LOCAL_BASE, 'demo')
  for (const dir of [presetDir, featureDir, demoDir]) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const kie = new KIEImageService()

  let uploadBufferToR2: typeof import('../src/lib/r2').uploadBufferToR2 | null = null
  if (!cli.dryRun) {
    uploadBufferToR2 = (await import('../src/lib/r2')).uploadBufferToR2
  }

  const saveAndUpload = async (
    localPath: string,
    r2Key: string,
    buf: Buffer,
    contentType: string
  ): Promise<void> => {
    fs.writeFileSync(localPath, buf)
    console.log(`   💾 ${path.relative(process.cwd(), localPath)} (${buf.length} bytes)`)
    if (uploadBufferToR2) {
      await uploadBufferToR2({
        key: r2Key,
        body: buf,
        contentType,
        metadata: { source: 'ai-pet-dance-asset-generator' },
      })
      console.log(`   ☁️  ${r2Key}`)
    }
  }

  // ===== Phase 1: preset thumbnails =====
  if (!cli.featureOnly && !cli.demosOnly) {
    let targets = presets
    if (cli.presetId) {
      targets = targets.filter((p) => p.id === cli.presetId)
      if (targets.length === 0) throw new Error(`preset id not found: ${cli.presetId}`)
    }

    console.log(`🐕 Generating ${targets.length} preset thumbnail(s)...`)
    for (const preset of targets) {
      const localPath = path.join(presetDir, `${preset.id}.jpg`)
      if (fs.existsSync(localPath) && !cli.force) {
        console.log(`⏭️  ${preset.id} — exists, skip (--force to override)`)
        continue
      }
      const prompt = buildThumbnailPrompt(preset)
      console.log(`📝 ${preset.id}`)
      if (cli.dryRun) {
        console.log(`   ${prompt}`)
        continue
      }

      try {
        const buf = await generateImage(kie, prompt, '1:1')
        await saveAndUpload(localPath, `${R2_PREFIX}/preset/${preset.id}.jpg`, buf, 'image/jpeg')
      } catch (err) {
        console.error(`   ❌ ${preset.id} failed:`, err instanceof Error ? err.message : err)
      }
      console.log()
    }
  }

  if (cli.presetsOnly) {
    console.log('Done (presets only).')
    return
  }

  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const kieVideo = new KIEVideoService()

  // ===== Phase 2: feature sample + OG =====
  let samplePetUrl = cli.imageUrl
  if (!cli.demosOnly) {
    console.log('📸 Generating sample pet photo (9:16)...')
    if (cli.dryRun) {
      console.log(`   ${SAMPLE_PET_PROMPT}`)
    } else {
      const buf = await generateImage(kie, SAMPLE_PET_PROMPT, '9:16')
      await saveAndUpload(
        path.join(featureDir, 'sample-pet.jpg'),
        `${R2_PREFIX}/feature/sample-pet.jpg`,
        buf,
        'image/jpeg'
      )
      samplePetUrl = `${R2_PUBLIC_BASE}/${R2_PREFIX}/feature/sample-pet.jpg`
    }
    console.log()

    console.log('🖼  Generating OG image...')
    if (cli.dryRun) {
      console.log(`   ${OG_IMAGE_PROMPT}`)
    } else {
      const buf = await generateImage(kie, OG_IMAGE_PROMPT, '1:1')
      await saveAndUpload(
        path.join(featureDir, 'og-image.png'),
        `${R2_PREFIX}/feature/og-image.png`,
        buf,
        'image/png'
      )
    }
    console.log()

    console.log('🎬 Generating sample dance video...')
    if (!cli.dryRun) {
      if (!samplePetUrl) throw new Error('no sample pet url — pass --image-url')
      const hipHop = presets.find((p) => p.id === 'hip-hop')
      if (!hipHop) throw new Error('hip-hop preset missing')
      const buf = await generateVideo(kieVideo, hipHop.prompt, samplePetUrl)
      await saveAndUpload(
        path.join(featureDir, 'sample-dance.mp4'),
        `${R2_PREFIX}/feature/sample-dance.mp4`,
        buf,
        'video/mp4'
      )
    }
    console.log()
  }

  if (cli.featureOnly) {
    console.log('Done (feature only).')
    return
  }

  // ===== Phase 3: demo wall clips =====
  console.log(`🕺 Generating ${DEMO_PRESET_IDS.length} demo wall clip(s)...`)
  for (const id of DEMO_PRESET_IDS) {
    const preset = presets.find((p) => p.id === id)
    if (!preset) {
      console.error(`   ❌ demo preset not found: ${id}`)
      continue
    }

    const localPath = path.join(demoDir, `${id}.mp4`)
    if (fs.existsSync(localPath) && !cli.force) {
      console.log(`⏭️  ${id} — exists, skip (--force to override)`)
      continue
    }

    console.log(`🎞  ${id}`)
    if (cli.dryRun) {
      console.log(`   ${preset.prompt}`)
      continue
    }

    // The preset thumbnail is the first frame for its own demo clip.
    const thumbUrl = `${R2_PUBLIC_BASE}/${R2_PREFIX}/preset/${id}.jpg`
    try {
      const buf = await generateVideo(kieVideo, preset.prompt, thumbUrl)
      await saveAndUpload(localPath, `${R2_PREFIX}/demo/${id}.mp4`, buf, 'video/mp4')
    } catch (err) {
      console.error(`   ❌ ${id} failed:`, err instanceof Error ? err.message : err)
    }
    console.log()
  }

  console.log('🎉 Done.')
  console.log(`  sample photo: ${R2_PUBLIC_BASE}/${R2_PREFIX}/feature/sample-pet.jpg`)
  console.log(`  sample video: ${R2_PUBLIC_BASE}/${R2_PREFIX}/feature/sample-dance.mp4`)
  console.log(`  og image:     ${R2_PUBLIC_BASE}/${R2_PREFIX}/feature/og-image.png`)
}

main().catch((err) => {
  console.error('💥 Fatal:', err)
  process.exit(1)
})
