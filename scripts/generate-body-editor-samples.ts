/**
 * Generate additional before/after gallery samples for the Body Editor page.
 *
 * body-editor is NOT a preset-based page, so it is not covered by
 * scripts/generate-preset-images.ts. Its gallery reads
 * `showcases/body-editor/samples/{N}-before.webp` and `{N}-after.webp`.
 *
 * Pipeline per sample:
 *   1. text-to-image  -> a natural full-body "before" photo (9:16)
 *   2. upload before -> R2 (also gives the edit API a public URL)
 *   3. image-to-image -> subtle, natural body reshape "after"
 *   4. encode both to .webp and upload to R2 samples/
 *
 * Run: npx tsx scripts/generate-body-editor-samples.ts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const KIE_API_TOKEN = process.env.KIE_API_TOKEN || '';
const KIE_CALLBACK_URL = process.env.KIE_CALLBACK_URL || '';
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_BASE_URL = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev';

interface SampleConfig {
  index: number;
  beforePrompt: string;
  reshapePrompt: string;
}

// Diverse subjects, tasteful activewear, plain white studio (matches sample 1).
const SAMPLES: SampleConfig[] = [
  {
    index: 2,
    beforePrompt:
      'A full-length front-facing studio photograph of a young Latina woman in her late 20s standing straight with arms relaxed at her sides, wearing a fitted grey sports bra and matching high-waist leggings, white sneakers. Natural realistic body, neutral expression, hair tied back. Plain seamless white studio background, soft even lighting, sharp focus, head to toe visible. Photorealistic, 8K quality.',
    reshapePrompt:
      'Subtly refine and reshape the waistline and torso contours to look slightly slimmer and more toned. Maintain completely natural proportions, realistic skin, same identity, face, pose, outfit, background and lighting. Only gently enhance the body curves. The edit must look seamless and believable.',
  },
  {
    index: 3,
    beforePrompt:
      'A full-length front-facing studio photograph of a young athletic man in his early 30s standing straight with arms relaxed at his sides, wearing a fitted black tank top and grey athletic shorts, running shoes. Natural realistic average build, neutral expression, short hair. Plain seamless white studio background, soft even lighting, sharp focus, head to toe visible. Photorealistic, 8K quality.',
    reshapePrompt:
      'Subtly refine and reshape the torso and midsection to look slightly leaner and more defined. Maintain completely natural proportions, realistic skin, same identity, face, pose, outfit, background and lighting. Only gently enhance muscle definition and contours. The edit must look seamless and believable.',
  },
];

function assertEnv(): void {
  const missing = ['KIE_API_TOKEN', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
    .filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env: ${missing.join(', ')}`);
}

async function createTextToImageTask(prompt: string): Promise<string> {
  const res = await fetch(`${KIE_API_URL}/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KIE_API_TOKEN}` },
    body: JSON.stringify({
      model: 'google/nano-banana',
      callBackUrl: KIE_CALLBACK_URL,
      input: { prompt, output_format: 'png', image_size: '9:16' },
    }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== 200) throw new Error(`create t2i failed: ${res.status} ${JSON.stringify(json)}`);
  return json.data.taskId;
}

async function createImageEditTask(prompt: string, imageUrl: string): Promise<string> {
  const res = await fetch(`${KIE_API_URL}/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KIE_API_TOKEN}` },
    body: JSON.stringify({
      model: 'google/nano-banana-edit',
      callBackUrl: KIE_CALLBACK_URL,
      input: { prompt, image_urls: [imageUrl], output_format: 'png', image_size: '9:16' },
    }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== 200) throw new Error(`create edit failed: ${res.status} ${JSON.stringify(json)}`);
  return json.data.taskId;
}

async function waitForCompletion(taskId: string, maxAttempts = 60, intervalMs = 3000): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${KIE_API_URL}/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_TOKEN}` },
    });
    const json = await res.json();
    if (!res.ok || json.code !== 200) throw new Error(`status failed: ${res.status} ${JSON.stringify(json)}`);
    const { state, resultJson } = json.data;
    if (state === 'success') {
      const parsed = JSON.parse(resultJson);
      if (parsed.resultUrls?.length) return parsed.resultUrls[0];
      throw new Error('completed but no resultUrls');
    }
    if (state === 'failed') throw new Error(`task failed: ${taskId}`);
    process.stdout.write(`  polling ${taskId} (${i + 1}/${maxAttempts})...\r`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`task timeout: ${taskId}`);
}

function r2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

async function downloadToWebp(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const png = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  await sharp(png).webp({ quality: 88 }).toFile(destPath);
}

async function uploadWebp(client: S3Client, localPath: string, key: string): Promise<string> {
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fs.readFileSync(localPath),
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${R2_PUBLIC_BASE_URL}/${key}`;
}

async function main(): Promise<void> {
  assertEnv();
  const client = r2Client();
  const outDir = path.join('public', 'images', 'showcases', 'body-editor', 'samples');

  for (const s of SAMPLES) {
    console.log(`\n=== Sample ${s.index} ===`);

    // 1. before
    console.log('  generating before...');
    const beforeTask = await createTextToImageTask(s.beforePrompt);
    const beforeUrl = await waitForCompletion(beforeTask);
    const beforeLocal = path.join(outDir, `${s.index}-before.webp`);
    await downloadToWebp(beforeUrl, beforeLocal);
    const beforeKey = `showcases/body-editor/samples/${s.index}-before.webp`;
    const beforePublic = await uploadWebp(client, beforeLocal, beforeKey);
    console.log(`  before -> ${beforePublic}`);

    // 2. after (reshape the before via edit API; needs a public URL)
    console.log('  generating after (reshape)...');
    const afterTask = await createImageEditTask(s.reshapePrompt, beforePublic);
    const afterUrl = await waitForCompletion(afterTask);
    const afterLocal = path.join(outDir, `${s.index}-after.webp`);
    await downloadToWebp(afterUrl, afterLocal);
    const afterKey = `showcases/body-editor/samples/${s.index}-after.webp`;
    const afterPublic = await uploadWebp(client, afterLocal, afterKey);
    console.log(`  after  -> ${afterPublic}`);
  }

  console.log('\nAll body-editor samples generated.');
}

main().catch((e) => { console.error('\nERROR:', e); process.exit(1); });
