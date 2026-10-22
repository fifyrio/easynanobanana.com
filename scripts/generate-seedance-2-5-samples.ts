/**
 * Resumable sample generator for /video/seedance-2-5-ai-video-generator showcase assets.
 * Generates 3 reference input images (`flux-3/klein-text-to-image`), 3 four-second 480p videos
 * using AISplice `doubao-seedance-2.5` (`POST https://www.aisplice.store/v1/videos`),
 * extracts FFmpeg poster frames and a 1200x630 OG image, and uploads all 10 assets to
 * Cloudflare R2 under `showcases/ai-seedance-2-5/`.
 *
 * Usage:
 *   npx tsx scripts/generate-seedance-2-5-samples.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import dotenv from 'dotenv'
import sharp from 'sharp'
import presetsData from '../src/data/ai-seedance-2-5-presets.json'

dotenv.config({ path: '.env.local' })
dotenv.config()

const root = path.join(process.cwd(), 'temp/seedance-2-5-rollout')
const r2Host = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'

const subjects = [
  {
    id: 'dynamic-hero-orbit',
    effect: 'ai-seedance-2-5',
    scene:
      'Waist-up cinematic portrait of a fictional adult woman aged 27 with sleek dark hair and a tailored cognac leather coat standing on a dramatic coastal cliff overlook at sunset, warm golden rim light, shallow depth of field, 85mm anamorphic lens, photorealistic cinema, no text or logos.',
    prompt: presetsData.presets[0].prompt,
    audio: true,
  },
  {
    id: 'cinematic-action-tracking',
    effect: 'ai-seedance-2-5',
    scene:
      'Full-body cinematic street shot of a fictional adult man aged 29 wearing a matte black technical trench coat over a slate sweater walking through a rain-glossed neon avenue at night, vibrant cyan and amber reflections on wet asphalt, photorealistic cinema, no text or logos.',
    prompt: presetsData.presets[1].prompt,
    audio: true,
  },
  {
    id: 'macro-commercial-reveal',
    effect: 'ai-seedance-2-5',
    scene:
      'Luxury commercial macro studio shot of a brushed titanium skeleton chronograph wristwatch resting on a dark volcanic basalt plinth with subtle atmospheric mist and warm directional rim lighting, crisp sapphire crystal reflections, no text or logos.',
    prompt: presetsData.presets[2].prompt,
    audio: true,
  },
]

async function main() {
  if (process.argv.includes('--dry-run')) {
    console.log(
      JSON.stringify(
        subjects.map((s) => ({
          ...s,
          image: `showcases/${s.effect}/input/${s.id}.jpg`,
          video: `showcases/${s.effect}/demo/${s.id}.mp4`,
          poster: `showcases/${s.effect}/demo/${s.id}.jpg`,
          provider: 'aisplice',
          model: 'doubao-seedance-2.5',
          duration: 4,
          resolution: '480p',
          aspectRatio: '9:16',
        })),
        null,
        2
      )
    )
    return
  }

  if (!process.env.KIE_API_TOKEN) throw new Error('KIE_API_TOKEN missing')
  if (!process.env.AISPLICE_API_KEY) throw new Error('AISPLICE_API_KEY missing')
  fs.mkdirSync(root, { recursive: true })

  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const { AISpliceVideoService } = await import(
    '../src/lib/aisplice-api/aisplice-video-service'
  )
  const { uploadBufferToR2 } = await import('../src/lib/r2')
  const images = new KIEImageService()
  const videos = new AISpliceVideoService()

  async function generatedImage(
    key: string,
    create: () => Promise<string>
  ): Promise<Buffer> {
    const taskFile = path.join(root, `${key.replace(/\//g, '_')}.task.json`)
    const taskId = fs.existsSync(taskFile)
      ? JSON.parse(fs.readFileSync(taskFile, 'utf8')).taskId
      : await create()
    fs.writeFileSync(taskFile, JSON.stringify({ taskId }))

    for (let attempt = 0; attempt < 180; attempt++) {
      let status: any
      try {
        status = await images.getTaskStatus(taskId)
      } catch (pollErr) {
        console.warn(
          `⚠️ Transient image poll error for ${key} (${taskId}), retrying...`,
          pollErr instanceof Error ? pollErr.message : pollErr
        )
        await new Promise((r) => setTimeout(r, 5000))
        continue
      }

      if (status.state === 'success') {
        const url = JSON.parse(status.resultJson).resultUrls?.[0]
        if (!url) throw new Error(`No result URL for ${key}`)
        const result = await fetch(url)
        if (!result.ok) throw new Error(`Download ${key}: ${result.status}`)
        return Buffer.from(await result.arrayBuffer())
      }
      if (['fail', 'failed'].includes(status.state)) {
        throw new Error(
          `Failed ${key}: ${status.failMsg || status.state}; inspect saved task before retrying`
        )
      }
      console.log(`⏳ WAIT ${key} (${taskId}): ${status.state}`)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
    throw new Error(`Timeout ${key}; rerun to resume saved task`)
  }

  async function generatedVideo(
    key: string,
    create: () => Promise<string>
  ): Promise<Buffer> {
    const taskFile = path.join(root, `${key.replace(/\//g, '_')}.task.json`)
    const taskId = fs.existsSync(taskFile)
      ? JSON.parse(fs.readFileSync(taskFile, 'utf8')).taskId
      : await create()
    fs.writeFileSync(taskFile, JSON.stringify({ taskId }))

    for (let attempt = 0; attempt < 180; attempt++) {
      let status
      try {
        status = await videos.getTaskStatus(taskId)
      } catch (pollErr) {
        console.warn(
          `⚠️ Transient AISplice poll error for ${key} (${taskId}), retrying...`,
          pollErr instanceof Error ? pollErr.message : pollErr
        )
        await new Promise((r) => setTimeout(r, 5000))
        continue
      }

      if (status.state === 'success') {
        return videos.downloadVideoBuffer(taskId, status.videoUrl)
      }
      if (status.state === 'fail') {
        throw new Error(
          `Failed ${key} (${taskId}): ${status.error || status.rawStatus}`
        )
      }
      console.log(`⏳ WAIT ${key} (${taskId}): ${status.rawStatus}`)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
    throw new Error(`Timeout ${key}; rerun to resume saved task`)
  }

  async function asset(
    key: string,
    contentType: string,
    create: () => Promise<Buffer>
  ): Promise<string> {
    const local = path.join(root, key)
    fs.mkdirSync(path.dirname(local), { recursive: true })
    if (!fs.existsSync(local)) {
      fs.writeFileSync(local, await create())
    }
    await uploadBufferToR2({ key, body: fs.readFileSync(local), contentType })
    console.log(`✅ READY ${r2Host}/${key}`)
    return local
  }

  for (const s of subjects) {
    const prefix = `showcases/${s.effect}`
    const inputKey = `${prefix}/input/${s.id}.jpg`
    await asset(inputKey, 'image/jpeg', async () => {
      const raw = await generatedImage(inputKey, () =>
        images.createFluxKleinTask({
          prompt: s.scene,
          aspectRatio: '9:16',
          resolution: '1K',
          outputFormat: 'png',
          enhancePrompt: true,
        })
      )
      return sharp(raw).jpeg({ quality: 90 }).toBuffer()
    })

    const videoKey = `${prefix}/demo/${s.id}.mp4`
    const localVideoPath = await asset(videoKey, 'video/mp4', () =>
      generatedVideo(`${s.effect}-${s.id}`, () =>
        videos.createVideoTask({
          prompt: s.prompt,
          model: 'doubao-seedance-2.5',
          referenceImageUrls: [`${r2Host}/${inputKey}`],
          duration: 4,
          resolution: '480p',
          aspectRatio: '9:16',
          generateAudio: s.audio,
          nsfwCheck: true,
        })
      )
    )

    const posterKey = `${prefix}/demo/${s.id}.jpg`
    await asset(posterKey, 'image/jpeg', async () => {
      const poster = path.join(root, `${s.effect}-${s.id}-poster.jpg`)
      execFileSync(
        'ffmpeg',
        ['-y', '-i', localVideoPath, '-frames:v', '1', poster],
        { stdio: 'ignore' }
      )
      return fs.readFileSync(poster)
    })
  }

  await asset('showcases/ai-seedance-2-5/feature/og-image.jpg', 'image/jpeg', () =>
    sharp(path.join(root, 'showcases/ai-seedance-2-5/demo/dynamic-hero-orbit.jpg'))
      .resize(1200, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 90 })
      .toBuffer()
  )

  console.log(
    '🎉 All Seedance 2.5 (AISplice doubao-seedance-2.5) showcase videos, posters, and OG image uploaded to R2!'
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
