/**
 * Resumable sample generator for /flux-3-image-klein showcase assets.
 * Generates real 1K images via KIE's `flux-3/klein-text-to-image` and `flux-3/klein-edit-image`,
 * converts them to optimized WebP/JPEG, and uploads them to Cloudflare R2.
 *
 * Usage:
 *   npx tsx scripts/generate-flux-klein-samples.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import sharp from 'sharp'
import sampleData from '../src/data/flux-3-image-klein-samples.json'

dotenv.config({ path: '.env.local' })
dotenv.config()

const root = path.join(process.cwd(), 'temp/flux-klein-rollout')
const r2Host = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev'

async function main() {
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(sampleData, null, 2))
    return
  }

  if (!process.env.KIE_API_TOKEN) {
    throw new Error('KIE_API_TOKEN missing in environment')
  }

  fs.mkdirSync(root, { recursive: true })
  const { KIEImageService } = await import('../src/lib/kie-api/kie-image-service')
  const { uploadBufferToR2 } = await import('../src/lib/r2')
  const images = new KIEImageService()

  async function runKieTask(key: string, create: () => Promise<string>): Promise<Buffer> {
    const safeName = key.replace(/\//g, '_')
    const taskFile = path.join(root, `${safeName}.task.json`)
    const taskId = fs.existsSync(taskFile)
      ? JSON.parse(fs.readFileSync(taskFile, 'utf8')).taskId
      : await create()
    fs.writeFileSync(taskFile, JSON.stringify({ taskId }))

    for (let attempt = 0; attempt < 90; attempt++) {
      let status: Awaited<ReturnType<typeof images.getTaskStatus>>
      try {
        status = await images.getTaskStatus(taskId)
      } catch (pollErr) {
        console.warn(`⚠️ Transient poll error for ${key} (${taskId}), retrying...`, pollErr instanceof Error ? pollErr.message : pollErr)
        await new Promise((r) => setTimeout(r, 4000))
        continue
      }
      if (status.state === 'success') {
        const url = JSON.parse(status.resultJson).resultUrls?.[0]
        if (!url) throw new Error(`No result URL for ${key}`)
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Download failed for ${key}: ${res.status}`)
        return Buffer.from(await res.arrayBuffer())
      }
      if (status.state === 'failed' || status.state === 'fail') {
        throw new Error(`KIE task failed for ${key}: ${status.failMsg || status.state}`)
      }
      console.log(`⏳ WAIT ${key} (${taskId}): ${status.state}`)
      await new Promise((r) => setTimeout(r, 4000))
    }
    throw new Error(`Timeout waiting for ${key} (${taskId})`)
  }

  async function ensureAsset(
    key: string,
    contentType: string,
    buildBuffer: () => Promise<Buffer>
  ): Promise<string> {
    const localPath = path.join(root, key)
    fs.mkdirSync(path.dirname(localPath), { recursive: true })
    if (!fs.existsSync(localPath)) {
      const buf = await buildBuffer()
      fs.writeFileSync(localPath, buf)
    }
    await uploadBufferToR2({
      key,
      body: fs.readFileSync(localPath),
      contentType,
    })
    console.log(`✅ READY ${r2Host}/${key}`)
    return `${r2Host}/${key}`
  }

  // 1. Generate before (text-to-image) and after (edit-image) for each showcase item
  for (const item of sampleData.samples) {
    const beforePublicUrl = await ensureAsset(item.beforeKey, 'image/webp', async () => {
      const raw = await runKieTask(item.beforeKey, () =>
        images.createFluxKleinTask({
          prompt: item.basePrompt,
          aspectRatio: item.aspectRatio as '3:4',
          resolution: '1K',
          outputFormat: 'png',
          enhancePrompt: true,
        })
      )
      return sharp(raw).webp({ quality: 88 }).toBuffer()
    })

    await ensureAsset(item.afterKey, 'image/webp', async () => {
      const raw = await runKieTask(item.afterKey, () =>
        images.createFluxKleinTask({
          prompt: item.prompt,
          imageUrls: [beforePublicUrl],
          aspectRatio: item.aspectRatio as '3:4',
          resolution: '1K',
          outputFormat: 'png',
          enhancePrompt: item.enhancePrompt,
        })
      )
      return sharp(raw).webp({ quality: 88 }).toBuffer()
    })
  }

  // 2. Generate 1200x630 OG image using flux-3/klein-text-to-image
  const ogKey = 'showcases/flux-3-image-klein/feature/og-image.jpg'
  await ensureAsset(ogKey, 'image/jpeg', async () => {
    const raw = await runKieTask(ogKey, () =>
      images.createFluxKleinTask({
        prompt: sampleData.heroPrompt,
        aspectRatio: '16:9',
        resolution: '1K',
        outputFormat: 'png',
        enhancePrompt: true,
      })
    )
    return sharp(raw)
      .resize(1200, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 90 })
      .toBuffer()
  })

  console.log('🎉 All FLUX 3 Image Klein samples generated and uploaded to R2!')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
