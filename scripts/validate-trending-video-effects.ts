/** Small, resumable Rumpelstiltskin/Bulin showcase experiment.
 * --dry-run prints the manifest; --bulin-only limits generation to the candidate.
 * Local assets and task IDs survive interruption; reruns upload without buying again.
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import dotenv from 'dotenv'
import sharp from 'sharp'
import data from '../src/data/ai-rumpelstiltskin-presets.json'

dotenv.config({ path: '.env.local' })
dotenv.config()

const root = path.join(process.cwd(), 'temp/keyword-rollout')
const host = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'
const bulinPrompt = 'Use the uploaded image as the identity reference for one fictional adult performer. Keep the same face, hairstyle and outfit. One continuous four-second waist-up shot of an energetic street freestyle performance outside a red-lit restaurant at night. The performer bounces gently to an original dembow beat and makes one short rhythmic gesture with the right hand, then lowers it. Keep both hands anatomically natural and the face stable. Softly blurred fictional adults in the background remain distinct. Slight handheld camera movement, no cuts, no duplicated lead, no text or logos. Audio: an original instrumental dembow rhythm and quiet crowd ambience, no recognizable song, no lyrics and no voice imitation.'
const subjects = [
  { id: 'tiptoe-dance', effect: 'ai-rumpelstiltskin', scene: 'A fictional adult man aged 35 with curly auburn hair, wearing a burgundy waistcoat, cream shirt, dark trousers and leather shoes. Full body, both shoes visible, centered on a clear wooden floor in a candlelit timber room. Photorealistic fairy-tale cinema, no text or logos.', prompt: data.presets[0].prompt, audio: false },
  { id: 'woman', effect: 'ai-rumpelstiltskin', scene: 'A fictional adult woman aged 35 with curly dark hair, wearing a moss green jacket, cream blouse, dark trousers and brown leather shoes. Full body, both shoes visible, centered on a clear wooden floor in a candlelit timber room. Photorealistic fairy-tale cinema, no text or logos.', prompt: data.presets[0].prompt, audio: false },
  { id: 'robot', effect: 'ai-rumpelstiltskin', scene: 'An original friendly stylized 3D robot with a cream face, round eyes, burgundy jacket, two articulated legs and two large leather shoes. Full body, both shoes visible, on a clear wooden floor in a candlelit timber room. No text or logos.', prompt: data.presets[0].prompt, audio: false },
  { id: 'freestyle', effect: 'bulin-47-validation', scene: 'A fictional adult man aged 30, short dark curly hair, wearing a teal shirt, waist-up with both hands visible, red-lit restaurant exterior at night, softly blurred distinct adults behind. Natural cinematic photography, no celebrity likeness, no text or logos.', prompt: bulinPrompt, audio: true },
]

async function main() {
  const targets = process.argv.includes('--bulin-only') ? subjects.slice(-1) : subjects
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(targets.map(s => ({ ...s, image: `showcases/${s.effect}/input/${s.id}.jpg`, video: `showcases/${s.effect}/demo/${s.id}.mp4`, duration: 4, resolution: '480p', aspectRatio: '9:16' })), null, 2))
    return
  }
  if (!process.env.KIE_API_TOKEN) throw new Error('KIE_API_TOKEN missing')
  fs.mkdirSync(root, { recursive: true })
  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const { KIEVideoService } = await import('../src/lib/kie-api/kie-video-service')
  const { uploadBufferToR2 } = await import('../src/lib/r2')
  const images = new KIEImageService()
  const videos = new KIEVideoService()

  async function generated(key: string, create: () => Promise<string>, video: boolean) {
    const taskFile = path.join(root, `${key.replace(/\//g, '_')}.task.json`)
    const taskId = fs.existsSync(taskFile) ? JSON.parse(fs.readFileSync(taskFile, 'utf8')).taskId : await create()
    fs.writeFileSync(taskFile, JSON.stringify({ taskId }))
    for (let attempt = 0; attempt < 180; attempt++) {
      const status = video ? await videos.getTaskStatus(taskId) : await images.getTaskStatus(taskId)
      if (status.state === 'success') {
        const url = JSON.parse(status.resultJson).resultUrls?.[0]
        if (!url) throw new Error(`No result for ${key}`)
        const result = await fetch(url)
        if (!result.ok) throw new Error(`Download ${key}: ${result.status}`)
        return Buffer.from(await result.arrayBuffer())
      }
      if (['fail', 'failed'].includes(status.state)) throw new Error(`Failed ${key}: ${'failMsg' in status ? status.failMsg : 'failed'}; inspect saved task before retrying`)
      console.log(`WAIT ${key}: ${status.state}`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    throw new Error(`Timeout ${key}; rerun to resume saved task`)
  }

  async function asset(key: string, contentType: string, create: () => Promise<Buffer>) {
    const local = path.join(root, key)
    fs.mkdirSync(path.dirname(local), { recursive: true })
    if (!fs.existsSync(local)) fs.writeFileSync(local, await create())
    await uploadBufferToR2({ key, body: fs.readFileSync(local), contentType })
    console.log(`READY ${key}`)
    return local
  }

  const outcomes = await Promise.allSettled(targets.map(async s => {
    const prefix = `showcases/${s.effect}`
    const input = `${prefix}/input/${s.id}.jpg`
    await asset(input, 'image/jpeg', async () => {
      const raw = await generated(input, async () => {
        const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
          method: 'POST', headers: { Authorization: `Bearer ${process.env.KIE_API_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'nano-banana-2-1', input: { prompt: s.scene, aspect_ratio: '9:16', resolution: '1K', output_format: 'jpg' } }),
        })
        const result = await response.json()
        if (!response.ok || result.code !== 200 || !result.data?.taskId) throw new Error(`Image submission failed: ${result.msg}`)
        return result.data.taskId
      }, false)
      return sharp(raw).jpeg({ quality: 90 }).toBuffer()
    })
    const video = await asset(`${prefix}/demo/${s.id}.mp4`, 'video/mp4', () => generated(`${s.effect}-${s.id}`, () => videos.createSeedanceTask({
      prompt: s.prompt, referenceImageUrls: [`${host}/${input}`], duration: 4, resolution: '480p', aspectRatio: '9:16', generateAudio: s.audio,
    }), true))
    await asset(`${prefix}/demo/${s.id}.jpg`, 'image/jpeg', async () => {
      const poster = path.join(root, `${s.effect}-${s.id}-poster.jpg`)
      execFileSync('ffmpeg', ['-y', '-i', video, '-frames:v', '1', poster], { stdio: 'ignore' })
      return fs.readFileSync(poster)
    })
  }))
  const failed = outcomes.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
  for (const result of failed) console.error(result.reason)
  if (failed.length) throw new Error(`${failed.length} sample(s) failed; rerun to resume saved tasks`)
  if (!process.argv.includes('--bulin-only')) {
    await asset('showcases/ai-rumpelstiltskin/feature/og-image.jpg', 'image/jpeg', () => sharp(path.join(root, 'showcases/ai-rumpelstiltskin/demo/tiptoe-dance.jpg'))
      .resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 90 }).toBuffer())
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
