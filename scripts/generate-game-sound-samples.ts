/**
 * Resumable sample generator for /game-sound-generator showcase assets.
 * Generates real MP3 game audio clips via KIE `ai-music-api/sounds` and an OG cover
 * via `flux-3/klein-text-to-image`, uploads them to Cloudflare R2, and updates durations
 * in `src/data/game-sound-samples.json`.
 *
 * Usage:
 *   npx tsx scripts/generate-game-sound-samples.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import sharp from 'sharp'
import sampleData from '../src/data/game-sound-samples.json'
import type { GameAudioMode, DurationHint, SoundKey } from '../src/lib/kie-api/kie-sound-service'

dotenv.config({ path: '.env.local' })
dotenv.config()

const root = path.join(process.cwd(), 'temp/game-sound-rollout')
const r2Host = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'

async function main() {
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(sampleData, null, 2))
    return
  }

  if (!process.env.KIE_API_TOKEN && !process.env.KIE_API_KEY) {
    throw new Error('KIE_API_TOKEN missing in environment')
  }

  fs.mkdirSync(root, { recursive: true })
  const { KIESoundService } = await import('../src/lib/kie-api/kie-sound-service')
  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const { uploadBufferToR2 } = await import('../src/lib/r2')

  const sounds = new KIESoundService()
  const images = new KIEImageService()

  // Seed task #1 with the already-completed RPG town taskId from our live verification if not cached
  const seedTaskFile = path.join(
    root,
    'showcases_game-sound-generator_samples_1-fantasy-town-bgm.mp3.task.json'
  )
  if (!fs.existsSync(seedTaskFile)) {
    fs.writeFileSync(
      seedTaskFile,
      JSON.stringify({ taskId: '37d1ae2768c47c534e157af0225f7fdf' })
    )
  }

  for (const item of sampleData.samples) {
    const safeName = item.audioKey.replace(/\//g, '_')
    const taskFile = path.join(root, `${safeName}.task.json`)
    const localAudioPath = path.join(root, item.audioKey)
    fs.mkdirSync(path.dirname(localAudioPath), { recursive: true })

    let taskId: string
    if (fs.existsSync(taskFile)) {
      taskId = JSON.parse(fs.readFileSync(taskFile, 'utf8')).taskId
    } else {
      const created = await sounds.createSoundTask({
        prompt: item.prompt,
        mode: item.mode as GameAudioMode,
        durationHint: item.durationHint as DurationHint,
        soundLoop: item.soundLoop,
        soundTempo: item.soundTempo,
        soundKey: item.soundKey as SoundKey,
      })
      taskId = created.taskId
      fs.writeFileSync(taskFile, JSON.stringify({ taskId }))
    }

    if (!fs.existsSync(localAudioPath)) {
      let downloaded = false
      for (let attempt = 0; attempt < 60; attempt++) {
        const status = await sounds.getTaskStatus(taskId)
        if (status.state === 'success' && status.clips.length > 0) {
          const clip = status.clips[0]
          if (clip.duration) {
            item.duration = Number(clip.duration.toFixed(1))
          }
          const res = await fetch(clip.audioUrl)
          if (!res.ok) {
            throw new Error(`Audio download failed for ${item.id}: ${res.status}`)
          }
          const buf = Buffer.from(await res.arrayBuffer())
          fs.writeFileSync(localAudioPath, buf)
          downloaded = true
          break
        }
        if (status.state === 'fail' || status.state === 'failed') {
          throw new Error(
            `KIE sound task failed for ${item.id}: ${status.failMsg || status.state}`
          )
        }
        console.log(`⏳ WAIT ${item.id} (${taskId}): ${status.state}`)
        await new Promise((r) => setTimeout(r, 4000))
      }
      if (!downloaded) {
        throw new Error(`Timeout waiting for sound sample ${item.id} (${taskId})`)
      }
    }

    await uploadBufferToR2({
      key: item.audioKey,
      body: fs.readFileSync(localAudioPath),
      contentType: 'audio/mpeg',
    })
    console.log(`✅ READY ${r2Host}/${item.audioKey}`)
  }

  // Generate 1200x630 OG image
  const ogKey = 'showcases/game-sound-generator/feature/og-image.jpg'
  const ogLocalPath = path.join(root, ogKey)
  const ogTaskFile = path.join(root, `${ogKey.replace(/\//g, '_')}.task.json`)
  fs.mkdirSync(path.dirname(ogLocalPath), { recursive: true })

  if (!fs.existsSync(ogLocalPath)) {
    const ogTaskId = fs.existsSync(ogTaskFile)
      ? JSON.parse(fs.readFileSync(ogTaskFile, 'utf8')).taskId
      : await images.createFluxKleinTask({
          prompt: sampleData.heroPrompt,
          aspectRatio: '16:9',
          resolution: '1K',
          outputFormat: 'png',
          enhancePrompt: true,
        })
    fs.writeFileSync(ogTaskFile, JSON.stringify({ taskId: ogTaskId }))

    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await images.getTaskStatus(ogTaskId)
      if (status.state === 'success') {
        const url = JSON.parse(status.resultJson).resultUrls?.[0]
        if (!url) throw new Error('No OG image URL returned')
        const res = await fetch(url)
        const raw = Buffer.from(await res.arrayBuffer())
        const jpg = await sharp(raw)
          .resize(1200, 630, { fit: 'cover', position: 'attention' })
          .jpeg({ quality: 90 })
          .toBuffer()
        fs.writeFileSync(ogLocalPath, jpg)
        break
      }
      if (status.state === 'failed' || status.state === 'fail') {
        throw new Error(`OG image task failed: ${status.failMsg}`)
      }
      console.log(`⏳ WAIT OG image (${ogTaskId}): ${status.state}`)
      await new Promise((r) => setTimeout(r, 4000))
    }
  }

  await uploadBufferToR2({
    key: ogKey,
    body: fs.readFileSync(ogLocalPath),
    contentType: 'image/jpeg',
  })
  console.log(`✅ READY ${r2Host}/${ogKey}`)

  // Helper to poll a KIE image task and save buffer
  async function pollAndSaveImage(
    taskId: string,
    localPath: string,
    publicCopyPath: string,
    r2Key: string,
    asPng: boolean
  ): Promise<string> {
    fs.mkdirSync(path.dirname(localPath), { recursive: true })
    fs.mkdirSync(path.dirname(publicCopyPath), { recursive: true })

    if (!fs.existsSync(localPath)) {
      let downloaded = false
      for (let attempt = 0; attempt < 90; attempt++) {
        const status = await images.getTaskStatus(taskId)
        if (status.state === 'success') {
          const url = JSON.parse(status.resultJson).resultUrls?.[0]
          if (!url) throw new Error(`No image URL returned for ${r2Key}`)
          const res = await fetch(url)
          const raw = Buffer.from(await res.arrayBuffer())
          const processed = asPng
            ? await sharp(raw)
                .resize(800, 800, { fit: 'cover', position: 'attention' })
                .png()
                .toBuffer()
            : await sharp(raw)
                .resize(960, 540, { fit: 'cover', position: 'attention' })
                .jpeg({ quality: 88 })
                .toBuffer()
          fs.writeFileSync(localPath, processed)
          downloaded = true
          break
        }
        if (status.state === 'failed' || status.state === 'fail') {
          throw new Error(`Image task failed for ${r2Key}: ${status.failMsg}`)
        }
        console.log(`⏳ WAIT image ${r2Key} (${taskId}): ${status.state}`)
        await new Promise((r) => setTimeout(r, 4000))
      }
      if (!downloaded) {
        throw new Error(`Timeout waiting for image ${r2Key} (${taskId})`)
      }
    }

    fs.copyFileSync(localPath, publicCopyPath)
    await uploadBufferToR2({
      key: r2Key,
      body: fs.readFileSync(localPath),
      contentType: asPng ? 'image/png' : 'image/jpeg',
    })
    const publicUrl = `${r2Host}/${r2Key}`
    console.log(`✅ READY ${publicUrl}`)
    return publicUrl
  }

  // 1. Generate 4 sample cover images via google/nano-banana
  await Promise.all(
    sampleData.samples
      .filter((s) => Boolean(s.imageKey && s.imagePrompt))
      .map(async (s) => {
        const key = s.imageKey!
        const localPath = path.join(root, key)
        const publicCopyPath = path.join(process.cwd(), 'public/images', key)
        const taskFile = path.join(
          root,
          `nb_${key.replace(/\//g, '_')}.task.json`
        )
        let taskId = ''
        if (!fs.existsSync(localPath)) {
          taskId = fs.existsSync(taskFile)
            ? JSON.parse(fs.readFileSync(taskFile, 'utf8')).taskId
            : await images.createPromptOnlyTask(
                s.imagePrompt!,
                '1:1',
                'google/nano-banana'
              )
          fs.writeFileSync(taskFile, JSON.stringify({ taskId }))
        }
        await pollAndSaveImage(taskId, localPath, publicCopyPath, key, false)
      })
  )

  // 2. Two-phase Use Case Before/After pairs (google/nano-banana -> google/nano-banana-edit)
  await Promise.all(
    (sampleData.useCases || []).map(async (u) => {
      // Phase 1: Before image (text-to-image via google/nano-banana)
      const beforeLocal = path.join(root, u.beforeKey)
      const beforePublic = path.join(
        process.cwd(),
        'public/images',
        u.beforeKey
      )
      const beforeTaskFile = path.join(
        root,
        `nb_${u.beforeKey.replace(/\//g, '_')}.task.json`
      )
      let beforeTaskId = ''
      if (!fs.existsSync(beforeLocal)) {
        beforeTaskId = fs.existsSync(beforeTaskFile)
          ? JSON.parse(fs.readFileSync(beforeTaskFile, 'utf8')).taskId
          : await images.createPromptOnlyTask(
              u.beforePrompt,
              '1:1',
              'google/nano-banana'
            )
        fs.writeFileSync(
          beforeTaskFile,
          JSON.stringify({ taskId: beforeTaskId })
        )
      }
      const beforeR2Url = await pollAndSaveImage(
        beforeTaskId,
        beforeLocal,
        beforePublic,
        u.beforeKey,
        true
      )

      // Phase 2: After image (image-to-image via google/nano-banana-edit using beforeR2Url)
      const afterLocal = path.join(root, u.afterKey)
      const afterPublic = path.join(process.cwd(), 'public/images', u.afterKey)
      const afterTaskFile = path.join(
        root,
        `nb_${u.afterKey.replace(/\//g, '_')}.task.json`
      )
      let afterTaskId = ''
      if (!fs.existsSync(afterLocal)) {
        afterTaskId = fs.existsSync(afterTaskFile)
          ? JSON.parse(fs.readFileSync(afterTaskFile, 'utf8')).taskId
          : await images.createTask(
              u.afterPrompt,
              beforeR2Url,
              '1:1',
              'google/nano-banana-edit'
            )
        fs.writeFileSync(afterTaskFile, JSON.stringify({ taskId: afterTaskId }))
      }
      await pollAndSaveImage(
        afterTaskId,
        afterLocal,
        afterPublic,
        u.afterKey,
        true
      )
    })
  )

  // Save updated durations back to src/data/game-sound-samples.json
  fs.writeFileSync(
    path.join(process.cwd(), 'src/data/game-sound-samples.json'),
    JSON.stringify(sampleData, null, 2) + '\n'
  )
  console.log('🎉 All game-sound-generator showcase samples uploaded to R2!')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
