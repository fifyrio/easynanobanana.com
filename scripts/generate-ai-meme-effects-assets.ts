/** Demo video, poster and OG image for the Gatsby cheers, Cardo dinner and Christmas car pages.
 * Usage: tsx scripts/generate-ai-meme-effects-assets.ts [--dry-run] [--only=gatsby-cheers]
 * Source photos are generated with nano-banana; task IDs are persisted so reruns never repurchase.
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import dotenv from 'dotenv'
import sharp from 'sharp'
import gatsby from '../src/data/ai-gatsby-cheers-presets.json'
import cardo from '../src/data/ai-cardo-dinner-presets.json'
import car from '../src/data/ai-christmas-car-presets.json'

dotenv.config({ path: '.env.local' })
dotenv.config()

const CDN = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'
const PORTRAIT = 'Photorealistic head-and-shoulders portrait of a fictional adult with short dark hair, friendly neutral expression, eyes open looking at camera, soft even daylight, plain light background, vertical 9:16 composition, entire face visible, no text, no watermark.'

const EFFECTS = [
  { key: 'gatsby-cheers', slug: 'ai-gatsby-cheers', audio: true, preset: gatsby.presets[0], source: PORTRAIT },
  { key: 'cardo-dinner', slug: 'ai-cardo-dinner', audio: true, preset: cardo.presets[0], source: PORTRAIT },
  { key: 'christmas-car', slug: 'ai-christmas-car', audio: false, preset: car.presets[0],
    source: 'Photorealistic photo of a fictional dark blue modern hatchback car parked on a quiet suburban street at dusk, front three-quarter view, whole car visible, no people, no readable license plate, vertical 9:16 composition, no text, no watermark.' },
]

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)
  const targets = EFFECTS.filter((e) => !only || e.key === only)
  if (dryRun) {
    for (const e of targets) {
      console.log(`[${e.key}] source: ${e.source}\n  video 4s 480p 9:16 audio=${e.audio}\n  → ${CDN}/showcases/${e.slug}/{preset,demo,feature}/`)
    }
    return
  }
  if (!process.env.KIE_API_TOKEN) throw new Error('KIE_API_TOKEN missing')
  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const { uploadBufferToR2 } = await import('../src/lib/r2')
  const video = new KIEVideoService()
  const images = new KIEImageService()
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  for (const e of targets) {
    const prefix = `showcases/${e.slug}`
    const local = path.join(process.cwd(), 'public/images', prefix)
    const taskDir = path.join(process.cwd(), `temp/${e.slug}-tasks`)
    fs.mkdirSync(taskDir, { recursive: true })

    const asset = async (relative: string, contentType: string, create: () => Promise<Buffer>): Promise<void> => {
      const file = path.join(local, relative)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      const body = fs.existsSync(file) ? fs.readFileSync(file) : await create()
      fs.writeFileSync(file, body)
      await uploadBufferToR2({ key: `${prefix}/${relative}`, body, contentType })
      console.log(`READY ${prefix}/${relative} (${body.length} bytes)`)
    }
    const task = async (id: string, create: () => Promise<string>): Promise<string> => {
      const file = path.join(taskDir, `${id}.json`)
      const taskId: string = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).taskId : await create()
      fs.writeFileSync(file, JSON.stringify({ taskId }))
      console.log(`POLL ${e.key}/${id}: ${taskId}`)
      return taskId
    }

    await asset('preset/source.jpg', 'image/jpeg', async () => {
      const taskId = await task('source', () => images.createPromptOnlyTask(e.source, '9:16', 'google/nano-banana'))
      for (let i = 0; i < 120; i++) {
        const s = await images.getTaskStatus(taskId)
        if (s.state === 'success') {
          const url = JSON.parse(s.resultJson).resultUrls?.[0]
          if (!url) throw new Error('Image task has no output URL')
          return sharp(await download(url)).jpeg({ quality: 90 }).toBuffer()
        }
        if (s.state === 'failed') throw new Error(`Image task ${taskId} failed`)
        await sleep(5000)
      }
      throw new Error(`Image polling timeout: rerun to resume ${taskId}`)
    })

    await asset(`demo/${e.preset.id}.mp4`, 'video/mp4', async () => {
      const taskId = await task('video', () => video.createSeedanceTask({
        prompt: e.preset.prompt, referenceImageUrls: [`${CDN}/${prefix}/preset/source.jpg`],
        duration: 4, resolution: '480p', aspectRatio: '9:16', generateAudio: e.audio,
      }))
      for (let i = 0; i < 120; i++) {
        const s = await video.getTaskStatus(taskId)
        if (s.state === 'success') {
          const url = JSON.parse(s.resultJson).resultUrls?.[0]
          if (!url) throw new Error('Video task has no output URL')
          return download(url)
        }
        if (s.state === 'fail') throw new Error(`Video task ${taskId} failed: ${s.failMsg}`)
        await sleep(5000)
      }
      throw new Error(`Video polling timeout: rerun to resume ${taskId}`)
    })

    await asset(`demo/${e.preset.id}.jpg`, 'image/jpeg', async () => {
      const frame = execFileSync('ffmpeg', ['-v', 'error', '-ss', '2', '-i', path.join(local, `demo/${e.preset.id}.mp4`),
        '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1'])
      return sharp(frame).jpeg({ quality: 90 }).toBuffer()
    })
    await asset('feature/og-image.jpg', 'image/jpeg', () =>
      sharp(path.join(local, `demo/${e.preset.id}.jpg`)).resize(1200, 630, { fit: 'cover', position: 'attention' })
        .jpeg({ quality: 90 }).toBuffer())
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Asset generation failed')
  process.exitCode = 1
})
