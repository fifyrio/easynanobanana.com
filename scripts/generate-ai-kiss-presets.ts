/**
 * AI Kiss Preset Thumbnail Generator
 *
 * Generates 8 preset thumbnail images for the /video/ai-kiss page using KIE
 * text-to-image (google/nano-banana). Each preset = a different kiss style.
 *
 * Reads:  src/data/ai-kiss-presets.json
 * Writes: public/images/showcases/ai-kiss/preset/<id>.jpg  (local)
 *         <R2_PUBLIC_BASE>/showcases/ai-kiss/preset/<id>.jpg  (cloud)
 *
 * Usage:
 *   npx tsx scripts/generate-ai-kiss-presets.ts                  # all
 *   npx tsx scripts/generate-ai-kiss-presets.ts --preset soft-kiss
 *   npx tsx scripts/generate-ai-kiss-presets.ts --dry-run
 *   npx tsx scripts/generate-ai-kiss-presets.ts --no-upload      # local only
 *   npx tsx scripts/generate-ai-kiss-presets.ts --force          # overwrite existing
 */

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

// ===== CLI args =====

interface CliArgs {
  presetId?: string
  dryRun: boolean
  upload: boolean
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
    dryRun: args.includes('--dry-run'),
    upload: !args.includes('--no-upload'),
    force: args.includes('--force'),
  }
}

// ===== Types =====

interface AiKissPreset {
  id: string
  name: string
  description: string
  displaySrc: string
  prompt: string
}

interface PresetFile {
  presets: AiKissPreset[]
}

// ===== Prompt builder =====

/**
 * Thumbnail prompts override the per-preset video prompt because the video
 * prompt addresses "reference images" that don't exist in text-to-image mode.
 */
const THUMBNAIL_STYLE_BY_ID: Record<string, string> = {
  'soft-kiss':
    'a young couple sharing a soft, tender, gentle kiss with eyes closed',
  'passionate-kiss':
    'a young couple sharing a heartfelt romantic kiss, cinematic and emotional',
  'forehead-kiss':
    'one person tenderly kissing the other on the forehead, eyes softly closed',
  'cheek-kiss':
    'one person giving the other a playful kiss on the cheek, both smiling warmly',
  'surprise-kiss':
    'a young couple in a sweet surprise kiss, one leaning in unexpectedly, the other softened with joy',
  'slow-motion-kiss':
    'a young couple in a cinematic slow-motion romantic kiss, golden hour lighting',
  'eskimo-kiss':
    'a young couple in a cute Eskimo kiss, noses gently rubbing together, both smiling',
  'first-kiss':
    'a young couple sharing a shy first kiss, both leaning in slowly with eyes gently closing',
}

function buildThumbnailPrompt(preset: AiKissPreset): string {
  const style = THUMBNAIL_STYLE_BY_ID[preset.id] ?? preset.prompt
  return `Cinematic square close-up portrait of ${style}. Warm soft lighting, shallow depth of field, photorealistic, 8K quality, neutral background. Both faces clearly visible.`
}

// ===== Helpers =====

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// ===== Main =====

async function main(): Promise<void> {
  const cli = parseArgs()

  if (!process.env.KIE_API_TOKEN) {
    throw new Error('KIE_API_TOKEN missing in .env.local')
  }

  const presetJsonPath = path.join(
    process.cwd(),
    'src/data/ai-kiss-presets.json'
  )
  const data = JSON.parse(fs.readFileSync(presetJsonPath, 'utf8')) as PresetFile

  let targets = data.presets
  if (cli.presetId) {
    targets = targets.filter((p) => p.id === cli.presetId)
    if (targets.length === 0) {
      throw new Error(`preset id not found: ${cli.presetId}`)
    }
  }

  const localDir = path.join(
    process.cwd(),
    'public/images/showcases/ai-kiss/preset'
  )
  fs.mkdirSync(localDir, { recursive: true })

  console.log('🎬 AI Kiss preset thumbnail generator')
  console.log('─'.repeat(70))
  console.log(`Targets: ${targets.length} preset(s)`)
  console.log(`Dry run: ${cli.dryRun}`)
  console.log(`Upload:  ${cli.upload}`)
  console.log(`Force:   ${cli.force}`)
  console.log('─'.repeat(70))
  console.log()

  // Dynamic import so dotenv runs first
  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const kie = new KIEImageService()

  let uploadBufferToR2: typeof import('../src/lib/r2').uploadBufferToR2 | null = null
  if (cli.upload && !cli.dryRun) {
    const r2 = await import('../src/lib/r2')
    uploadBufferToR2 = r2.uploadBufferToR2
  }

  for (const preset of targets) {
    const localPath = path.join(localDir, `${preset.id}.jpg`)
    if (fs.existsSync(localPath) && !cli.force) {
      console.log(`⏭️  ${preset.id} — exists locally, skip (use --force to override)`)
      continue
    }

    const prompt = buildThumbnailPrompt(preset)
    console.log(`📝 ${preset.id}`)
    console.log(`   ${prompt}`)

    if (cli.dryRun) {
      console.log(`   (dry-run, skipping API call)`)
      console.log()
      continue
    }

    try {
      // Square thumbnail. Use createPromptOnlyTask (text-to-image).
      // Service supports '1:1' or '9:16'; pick 1:1 for preset thumbs.
      const taskId = await kie.createPromptOnlyTask(prompt, '1:1', 'google/nano-banana')
      console.log(`   ✅ task=${taskId}`)

      // Poll up to 5 min
      let resultUrl: string | null = null
      for (let attempt = 1; attempt <= 60; attempt += 1) {
        await sleep(5000)
        const status = await kie.getTaskStatus(taskId)
        if (status.state === 'success') {
          const parsed = JSON.parse(status.resultJson) as { resultUrls?: string[] }
          if (parsed.resultUrls?.[0]) {
            resultUrl = parsed.resultUrls[0]
            break
          }
          throw new Error('success but no resultUrls')
        }
        if (status.state === 'failed') {
          throw new Error(`KIE task failed`)
        }
        if (attempt % 6 === 0) console.log(`   ⏳ still ${status.state}... (${attempt * 5}s)`)
      }

      if (!resultUrl) {
        console.warn(`   ⚠️  timeout, skipping ${preset.id}`)
        continue
      }

      const buf = await downloadBuffer(resultUrl)
      fs.writeFileSync(localPath, buf)
      console.log(`   💾 local: ${path.relative(process.cwd(), localPath)} (${buf.length} bytes)`)

      if (uploadBufferToR2) {
        const r2Key = `showcases/ai-kiss/preset/${preset.id}.jpg`
        await uploadBufferToR2({
          key: r2Key,
          body: buf,
          contentType: 'image/jpeg',
          metadata: { source: 'ai-kiss-preset-generator', presetId: preset.id },
        })
        console.log(`   ☁️  r2:    ${r2Key}`)
      }

      console.log()
    } catch (err) {
      console.error(`   ❌ ${preset.id} failed:`, err instanceof Error ? err.message : err)
      console.log()
    }
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error('💥 Fatal:', err)
  process.exit(1)
})
