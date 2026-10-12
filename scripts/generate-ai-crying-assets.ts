/** Crying demo and three before/after image showcases.
 * --showcases-only skips video assets; --dry-run lists outputs.
 * Local files and persisted task IDs avoid repurchasing.
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import dotenv from 'dotenv'
import sharp from 'sharp'
import data from '../src/data/ai-crying-presets.json'

dotenv.config({ path: '.env.local' })
dotenv.config()

const PREFIX = 'showcases/ai-crying'
const PUBLIC = `https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/${PREFIX}`
const LOCAL = path.join(process.cwd(), 'public/images', PREFIX)
const TASK = path.join(process.cwd(), 'temp/ai-crying-tasks/soft-crying.json')
const SOURCE = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-face-expression-changer/feature/before.png'
const preset = data.presets[0]
const IMAGE_CASES = [
  { id: 2, prompt: 'Photorealistic close-up portrait of a fictional adult East Asian woman with shoulder-length dark hair, cream sweater, soft daylight, warm grey studio background, calm neutral expression, eyes open looking at camera. Head and shoulders centered, entire face visible, square composition, no tears, no text, no watermark.' },
  { id: 3, prompt: 'Expressive hand-painted digital illustration of a fictional young adult character with short wavy auburn hair and a blue hoodie, calm neutral expression, eyes open looking at camera, warm soft lighting, muted lavender background. Head and shoulders centered, entire face visible, square composition, no tears, no text, no watermark.' },
]

async function download(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function main() {
  if (process.argv.includes('--dry-run')) {
    if (!process.argv.includes('--showcases-only')) {
      console.log(`INPUT ${SOURCE} → preset/soft-crying.jpg (1024×1024)`)
      console.log(`VIDEO demo/soft-crying.mp4: 4 seconds, 480p, 9:16, silent\n${preset.prompt}`)
      console.log('POSTER demo/soft-crying.jpg: first frame; OG feature/og-image.jpg: 1200×630')
    }
    console.log('SHOWCASE cases/1-{before,after}.jpg: actual demo frames, 496×864')
    for (const item of IMAGE_CASES) console.log(`SHOWCASE cases/${item.id}-{before,after}.jpg: ${item.prompt} → crying edit, 1:1`)
    console.log(`R2 ${PUBLIC}; hero and SEO use these outputs`)
    return
  }
  if (!process.env.KIE_API_TOKEN) throw new Error('KIE_API_TOKEN missing')
  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const { uploadBufferToR2 } = await import('../src/lib/r2')
  const service = new KIEVideoService()

  async function asset(relative: string, contentType: string, create: () => Promise<Buffer>) {
    const file = path.join(LOCAL, relative)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const body = fs.existsSync(file) ? fs.readFileSync(file) : await create()
    fs.writeFileSync(file, body)
    await uploadBufferToR2({ key: `${PREFIX}/${relative}`, body, contentType })
    console.log(`READY ${relative} (${body.length} bytes)`)
  }

  async function showcases() {
    const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
    const images = new KIEImageService()
    async function generate(id: string, create: () => Promise<string>) {
      const taskFile = path.join(path.dirname(TASK), `${id}.json`)
      fs.mkdirSync(path.dirname(taskFile), { recursive: true })
      const taskId = fs.existsSync(taskFile) ? JSON.parse(fs.readFileSync(taskFile, 'utf8')).taskId : await create()
      fs.writeFileSync(taskFile, JSON.stringify({ taskId }))
      console.log(`POLL IMAGE ${id}: ${taskId}`)
      for (let attempt = 0; attempt < 120; attempt++) {
        const status = await images.getTaskStatus(taskId)
        if (status.state === 'success') {
          const url = JSON.parse(status.resultJson).resultUrls?.[0]
          if (!url) throw new Error('Image task succeeded without output URL')
          return sharp(await download(url)).resize(1024, 1024).jpeg({ quality: 90 }).toBuffer()
        }
        if (status.state === 'failed') throw new Error(`Image task ${taskId} failed`)
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
      throw new Error(`Image polling timeout: rerun to resume ${taskId}`)
    }
    // Same timestamps and crop make the real video's expression change comparable.
    for (const [stage, second] of [['before', '0'], ['after', '3.5']] as const) {
      await asset(`cases/1-${stage}.jpg`, 'image/jpeg', async () => {
        const frame = execFileSync('ffmpeg', ['-v', 'error', '-ss', second, '-i', path.join(LOCAL, 'demo/soft-crying.mp4'),
          '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1'])
        return sharp(frame).jpeg({ quality: 90 }).toBuffer()
      })
    }
    for (const item of IMAGE_CASES) {
      await asset(`cases/${item.id}-before.jpg`, 'image/jpeg', () =>
        generate(`case-${item.id}-before`, () => images.createPromptOnlyTask(item.prompt, '1:1', 'google/nano-banana')))
      await asset(`cases/${item.id}-after.jpg`, 'image/jpeg', () =>
        generate(`case-${item.id}-after`, () => images.createTask(
          'Edit only the expression of this same character to show natural crying: inner eyebrows raised with sadness, watery slightly reddened eyes, clear tears rolling down both cheeks, a subtly trembling lower lip. Preserve identity, face shape, hairstyle, clothing, background, lighting, art style and composition exactly. Keep eyes open and the face recognizable. No hands, text, logos or extra objects.',
          `${PUBLIC}/cases/${item.id}-before.jpg`, '1:1', 'google/nano-banana-edit')))
    }
  }

  if (process.argv.includes('--showcases-only')) {
    await showcases()
    return
  }

  await asset('preset/soft-crying.jpg', 'image/jpeg', async () =>
    sharp(await download(SOURCE)).jpeg({ quality: 90 }).toBuffer())
  await asset('demo/soft-crying.mp4', 'video/mp4', async () => {
    fs.mkdirSync(path.dirname(TASK), { recursive: true })
    const taskId: string = fs.existsSync(TASK)
      ? JSON.parse(fs.readFileSync(TASK, 'utf8')).taskId
      : await service.createSeedanceTask({
        prompt: preset.prompt, referenceImageUrls: [`${PUBLIC}/preset/soft-crying.jpg`],
        duration: 4, resolution: '480p', aspectRatio: '9:16', generateAudio: false,
      })
    fs.writeFileSync(TASK, JSON.stringify({ taskId }))
    console.log(`POLL ${taskId}`)
    for (let attempt = 0; attempt < 120; attempt++) {
      const status = await service.getTaskStatus(taskId)
      if (status.state === 'success') {
        const url = JSON.parse(status.resultJson).resultUrls?.[0]
        if (!url) throw new Error('Task succeeded without output URL')
        return download(url)
      }
      if (status.state === 'fail') throw new Error(`Task ${taskId} failed: ${status.failMsg}`)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
    throw new Error(`Polling timeout: rerun to resume task ${taskId}`)
  })
  await asset('demo/soft-crying.jpg', 'image/jpeg', async () => {
    const frame = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(LOCAL, 'demo/soft-crying.mp4'),
      '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1'])
    return sharp(frame).jpeg({ quality: 90 }).toBuffer()
  })
  await asset('feature/og-image.jpg', 'image/jpeg', () =>
    sharp(path.join(LOCAL, 'demo/soft-crying.jpg')).resize(1200, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 90 }).toBuffer())
  await showcases()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Asset generation failed')
  process.exitCode = 1
})
