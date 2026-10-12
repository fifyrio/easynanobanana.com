/** Burning Bridges showcases. --dry-run previews; --images-only skips videos.
 * --preset ID limits images and demos to that preset; demo clips only for the
 * two human gestures. Existing local files are re-uploaded, not regenerated.
 * Task IDs persist locally so interrupted polling does not buy a second task.
 */
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import sharp from 'sharp'
import data from '../src/data/ai-burning-bridges-presets.json'

dotenv.config({ path: '.env.local' })
dotenv.config()

const PREFIX = 'showcases/ai-burning-bridges'
const PUBLIC = `https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/${PREFIX}`
const LOCAL = path.join(process.cwd(), 'public/images', PREFIX)
const TASKS = path.join(process.cwd(), 'temp/ai-burning-bridges-tasks')
const DEMOS = ['party-lead', 'where-she-at']
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const imagesOnly = args.includes('--images-only')
const presetIndex = args.indexOf('--preset')
const presetId = presetIndex < 0 ? undefined : args[presetIndex + 1]

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function main() {
  if (presetIndex >= 0 && !presetId) throw new Error('--preset needs an ID')
  const targets = data.presets.filter((preset) => !presetId || preset.id === presetId)
  if (!targets.length) throw new Error(`Unknown preset: ${presetId}`)
  if (dryRun) {
    for (const preset of targets) {
      console.log(`IMAGE ${preset.id}: ${preset.thumbnailScene}`)
      if (!imagesOnly && DEMOS.includes(preset.id)) console.log(`VIDEO ${preset.id}: ${preset.prompt}`)
    }
    if (!presetId) console.log('OG: crop party-lead image to 1200 × 630')
    return
  }
  if (!process.env.KIE_API_TOKEN) throw new Error('KIE_API_TOKEN missing')
  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const { uploadBufferToR2 } = await import('../src/lib/r2')
  const imageService = new KIEImageService()
  const videoService = new KIEVideoService()

  async function asset(relativePath: string, contentType: string, create: () => Promise<Buffer>) {
    const localPath = path.join(LOCAL, relativePath)
    fs.mkdirSync(path.dirname(localPath), { recursive: true })
    const body = fs.existsSync(localPath) ? fs.readFileSync(localPath) : await create()
    fs.writeFileSync(localPath, body)
    await uploadBufferToR2({ key: `${PREFIX}/${relativePath}`, body, contentType })
    console.log(`READY ${relativePath} (${body.length} bytes)`)
  }

  async function generated(relativePath: string, create: () => Promise<string>, video: boolean): Promise<Buffer> {
    const taskFile = path.join(TASKS, `${relativePath}.task.json`)
    fs.mkdirSync(path.dirname(taskFile), { recursive: true })
    const taskId: string = fs.existsSync(taskFile)
      ? JSON.parse(fs.readFileSync(taskFile, 'utf8')).taskId
      : await create()
    fs.writeFileSync(taskFile, JSON.stringify({ taskId }))
    console.log(`POLL ${relativePath}: ${taskId}`)
    for (let attempt = 0; attempt < 120; attempt++) {
      const status = video
        ? await videoService.getTaskStatus(taskId)
        : await imageService.getTaskStatus(taskId)
      const state = status.state as string
      if (state === 'success') {
        const result = JSON.parse(status.resultJson) as { resultUrls?: string[] }
        if (!result.resultUrls?.[0]) throw new Error('Task succeeded without output URL')
        return download(result.resultUrls[0])
      }
      if (state === 'fail' || state === 'failed') {
        throw new Error(`Task failed (${taskId}); inspect task before removing ${taskFile} to retry`)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
    throw new Error(`Polling timeout (${taskId}); rerun to resume the same task`)
  }

  for (const preset of targets) {
    const relativePath = `preset/${preset.id}.jpg`
    await asset(relativePath, 'image/jpeg', async () => {
      const raw = await generated(relativePath, () => imageService.createPromptOnlyTask(
        `${preset.thumbnailScene} Medium waist-up vertical portrait, subject centered with both arms visible. Warm crystal chandelier-lit indoor evening party, dark wood walls, distinct softly blurred guests. Cinematic warm photography or the specified character style. No text, watermark, logos or celebrity likeness.`,
        '9:16', 'google/nano-banana',
      ), false)
      return sharp(raw).jpeg({ quality: 90 }).toBuffer()
    })
    if (!imagesOnly && DEMOS.includes(preset.id)) {
      const clipPath = `demo/${preset.id}.mp4`
      await asset(clipPath, 'video/mp4', () => generated(clipPath, () => videoService.createSeedanceTask({
        prompt: preset.prompt,
        referenceImageUrls: [`${PUBLIC}/${relativePath}`],
        duration: 4,
        resolution: '480p',
        aspectRatio: '9:16',
        generateAudio: true,
      }), true))
    }
  }
  if (!presetId) {
    await asset('feature/og-image.jpg', 'image/jpeg', () => sharp(path.join(LOCAL, 'preset/party-lead.jpg'))
      .resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 90 }).toBuffer())
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Asset generation failed')
  process.exitCode = 1
})
