/**
 * AI History Collage Asset Generator
 *
 * Generates all static assets for /video/ai-history-collage:
 *   1. 8 preset thumbnails (nano-banana text-to-image, 1:1)
 *        → public/images/showcases/ai-history-collage/preset/<id>.jpg
 *   2. Feature sample collage image (9:16)
 *        → feature/sample-collage.jpg
 *   3. Feature sample video (Seedance image-to-video, silent)
 *        → feature/sample-collage.mp4
 *   4. OG image (1:1 collage banner)
 *        → feature/og-image.png
 *
 * Everything uploads to R2 under showcases/ai-history-collage/.
 *
 * Usage:
 *   npx tsx scripts/generate-ai-history-collage-assets.ts                # all
 *   npx tsx scripts/generate-ai-history-collage-assets.ts --presets-only
 *   npx tsx scripts/generate-ai-history-collage-assets.ts --feature-only
 *   npx tsx scripts/generate-ai-history-collage-assets.ts --preset silk-road
 *   npx tsx scripts/generate-ai-history-collage-assets.ts --video-only --image-url <url>
 *   npx tsx scripts/generate-ai-history-collage-assets.ts --dry-run
 *   npx tsx scripts/generate-ai-history-collage-assets.ts --force
 */

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

const R2_PUBLIC_BASE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'
const R2_PREFIX = 'showcases/ai-history-collage'
const LOCAL_BASE = 'public/images/showcases/ai-history-collage'

// ===== CLI args =====

interface CliArgs {
  presetId?: string
  imageUrl?: string
  presetsOnly: boolean
  featureOnly: boolean
  videoOnly: boolean
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
    videoOnly: args.includes('--video-only'),
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  }
}

// ===== Types =====

interface CollagePreset {
  id: string
  name: string
  description: string
  displaySrc: string
  prompt: string
}

// ===== Prompts =====

const COLLAGE_STYLE =
  'Paper-cutout scrapbook collage illustration in the style of a Vox history explainer: torn paper edges, visible paper texture, hand-drawn arrows, small text cards, layered cutout elements on a craft-paper background. Flat lighting, rich colors, editorial infographic look.'

const THUMBNAIL_SCENE_BY_ID: Record<string, string> = {
  'ancient-dynasty':
    'an ancient emperor cutout figure over a parchment dynasty map, calligraphy scrolls, bronze coins and seal stamps',
  'roman-empire':
    'a Roman legionnaire cutout figure among marble columns, laurel wreaths and a Mediterranean empire map with conquest arrows',
  'age-of-exploration':
    'a cutout explorer with a sailing ship, brass compass and dotted ocean routes on a vintage world map with sea monster doodles',
  'industrial-revolution':
    'cutout factory workers with rotating paper gears, a steam locomotive, smokestack silhouettes and blueprint fragments',
  'newsreel-1940s':
    'torn newspaper headlines, halftone photo clippings, a vintage radio with wave doodles and stamped date cards',
  'silk-road':
    'a camel caravan cutout crossing a parchment trade-route map with silk bolts, spice sacks and oasis towns along a dotted path',
  'space-race':
    'a cutout rocket with crinkled paper flames, satellites on strings, retro mission patches on a construction-paper starfield',
  'renaissance':
    'a cutout inventor with da Vinci style sketch pages, flying machine doodles, gilded picture frames, quill pens and ink splats',
}

function buildThumbnailPrompt(preset: CollagePreset): string {
  const scene = THUMBNAIL_SCENE_BY_ID[preset.id] ?? preset.description
  return `${COLLAGE_STYLE} Square composition featuring ${scene}.`
}

const SAMPLE_IMAGE_PROMPT = `${COLLAGE_STYLE} Vertical 9:16 composition telling a Silk Road story: a cutout traveler and their dog as paper characters, a camel caravan, a parchment map with a dotted route and hand-drawn arrows, silk bolts and spice sacks, small text cards pinned around the scene.`

const SAMPLE_VIDEO_PROMPT =
  'Using the reference image as the only visual basis, create a silent image-to-video that keeps the paper-cutout scrapbook stop-motion collage style. Treat every element (characters, camel caravan, map, text cards, arrows) as an independent cutout piece. Motion must have a frame-skipping feel, subtle paper flutter, segmented displacement, and sticker-bounce effects.'

const OG_IMAGE_PROMPT = `${COLLAGE_STYLE} Square hero banner composition: a grand history timeline collage mixing an emperor, a sailing ship, a steam locomotive and a rocket as cutout pieces marching left to right across a parchment map with bold hand-drawn arrows. Leave gentle margins, no real text.`

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

// ===== Main =====

async function main(): Promise<void> {
  const cli = parseArgs()

  if (!process.env.KIE_API_TOKEN) {
    throw new Error('KIE_API_TOKEN missing in .env.local / .env')
  }

  const presetsPath = path.join(process.cwd(), 'src/data/ai-history-collage-presets.json')
  const { presets } = JSON.parse(fs.readFileSync(presetsPath, 'utf8')) as {
    presets: CollagePreset[]
  }

  const presetDir = path.join(process.cwd(), LOCAL_BASE, 'preset')
  const featureDir = path.join(process.cwd(), LOCAL_BASE, 'feature')
  fs.mkdirSync(presetDir, { recursive: true })
  fs.mkdirSync(featureDir, { recursive: true })

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
        metadata: { source: 'ai-history-collage-asset-generator' },
      })
      console.log(`   ☁️  ${r2Key}`)
    }
  }

  // ===== Phase 1: preset thumbnails =====
  if (!cli.featureOnly && !cli.videoOnly) {
    let targets = presets
    if (cli.presetId) {
      targets = targets.filter((p) => p.id === cli.presetId)
      if (targets.length === 0) throw new Error(`preset id not found: ${cli.presetId}`)
    }

    console.log(`📜 Generating ${targets.length} preset thumbnail(s)...`)
    for (const preset of targets) {
      const localPath = path.join(presetDir, `${preset.id}.jpg`)
      if (fs.existsSync(localPath) && !cli.force) {
        console.log(`⏭️  ${preset.id} — exists, skip (--force to override)`)
        continue
      }
      const prompt = buildThumbnailPrompt(preset)
      console.log(`📝 ${preset.id}`)
      console.log(`   ${prompt}`)
      if (cli.dryRun) continue

      try {
        const buf = await generateImage(kie, prompt, '1:1')
        await saveAndUpload(
          localPath,
          `${R2_PREFIX}/preset/${preset.id}.jpg`,
          buf,
          'image/jpeg'
        )
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

  // ===== Phase 2: feature sample image =====
  let sampleImageUrl = cli.imageUrl
  if (!cli.videoOnly) {
    console.log('📸 Generating sample collage image (9:16)...')
    if (cli.dryRun) {
      console.log(`   ${SAMPLE_IMAGE_PROMPT}`)
    } else {
      const buf = await generateImage(kie, SAMPLE_IMAGE_PROMPT, '9:16')
      await saveAndUpload(
        path.join(featureDir, 'sample-collage.jpg'),
        `${R2_PREFIX}/feature/sample-collage.jpg`,
        buf,
        'image/jpeg'
      )
      sampleImageUrl = `${R2_PUBLIC_BASE}/${R2_PREFIX}/feature/sample-collage.jpg`
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
  }

  if (cli.dryRun) {
    console.log('Done (dry-run).')
    return
  }

  // ===== Phase 3: feature sample video =====
  if (!sampleImageUrl) {
    throw new Error('no sample image url — pass --image-url with --video-only')
  }

  console.log('🎬 Generating sample collage video (Seedance, silent)...')
  console.log(`   reference: ${sampleImageUrl}`)
  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const kieVideo = new KIEVideoService()
  const videoTaskId = await kieVideo.createSeedanceTask({
    prompt: SAMPLE_VIDEO_PROMPT,
    referenceImageUrls: [sampleImageUrl],
    duration: 4,
    resolution: '480p',
    aspectRatio: '9:16',
    generateAudio: false,
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
    if (status.state === 'fail') throw new Error(`sample video failed: ${status.failMsg}`)
    if (i % 4 === 0) console.log(`   ⏳ ${status.state}... (${i * 5}s)`)
  }
  if (!videoUrl) throw new Error('sample video timeout')

  const vbuf = await downloadBuffer(videoUrl)
  await saveAndUpload(
    path.join(featureDir, 'sample-collage.mp4'),
    `${R2_PREFIX}/feature/sample-collage.mp4`,
    vbuf,
    'video/mp4'
  )

  console.log()
  console.log('🎉 Done.')
  console.log(`  sample image: ${R2_PUBLIC_BASE}/${R2_PREFIX}/feature/sample-collage.jpg`)
  console.log(`  sample video: ${R2_PUBLIC_BASE}/${R2_PREFIX}/feature/sample-collage.mp4`)
  console.log(`  og image:     ${R2_PUBLIC_BASE}/${R2_PREFIX}/feature/og-image.png`)
}

main().catch((err) => {
  console.error('💥 Fatal:', err)
  process.exit(1)
})
