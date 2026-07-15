/**
 * Glowria Routine Step Use-Case Image Generator
 *
 * Generates soft-photorealistic "how to use" images for each routine step type
 * (cleanse, toner, serum, …) shown on the Glowria routine step detail page.
 * Uses the KIE API (google/nano-banana), same pattern as
 * generate-glowria-skin-images.ts.
 *
 * Output saved directly into the Glowria Flutter assets so steps can reference
 * `assets/images/routine/<kind>.png`.
 *
 * Usage:
 *   npx tsx scripts/generate-glowria-routine-images.ts
 *   npx tsx scripts/generate-glowria-routine-images.ts --only serum
 *   npx tsx scripts/generate-glowria-routine-images.ts --dry-run
 *   npx tsx scripts/generate-glowria-routine-images.ts --force
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const KIE_API_TOKEN = process.env.KIE_API_TOKEN || '';
const KIE_CALLBACK_URL = process.env.KIE_CALLBACK_URL || '';

const OUT_DIR = '/Volumes/Extended/ext-docs/glowria/assets/images/routine';

type ImageSize = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

interface StepImage {
  // canonical step "kind" — matches RoutineStep image asset name
  kind: string;
  imageSize: ImageSize;
  prompt: string;
}

// Shared photographic direction: soft editorial skincare, real skin, calm.
const SHARED =
  'Soft photorealistic close-up, editorial skincare photography, clean minimal ' +
  'background in warm beige and ivory tones, soft natural window light, realistic ' +
  'skin texture, calm spa-like mood, shallow depth of field, high resolution, ' +
  'no text, no watermark, no labels, no UI.';

const IMAGES: StepImage[] = [
  {
    kind: 'cleanse',
    imageSize: '4:3',
    prompt:
      'A woman gently massaging a creamy milky facial cleanser onto her damp ' +
      'cheeks with both hands, light foam, fresh and clean. ' +
      SHARED,
  },
  {
    kind: 'toner',
    imageSize: '4:3',
    prompt:
      'A woman sweeping a soft cotton pad with hydrating toner across her cheek, ' +
      'droplets of clear toner, refreshed glowing skin. ' +
      SHARED,
  },
  {
    kind: 'serum',
    imageSize: '4:3',
    prompt:
      'A glass dropper releasing a few drops of clear glossy serum onto a ' +
      'woman fingertips, about to press it into her skin, dewy luminous look. ' +
      SHARED,
  },
  {
    kind: 'moisturizer',
    imageSize: '4:3',
    prompt:
      'A woman pressing a dollop of rich white moisturizer cream onto her cheek ' +
      'with fingertips, smooth hydrated skin, soft and plump. ' +
      SHARED,
  },
  {
    kind: 'sunscreen',
    imageSize: '4:3',
    prompt:
      'A woman applying a stripe of light sunscreen lotion across her cheek and ' +
      'blending it in, bright airy daylight, healthy protected skin. ' +
      SHARED,
  },
  {
    kind: 'makeup_remover',
    imageSize: '4:3',
    prompt:
      'A woman holding a cotton pad soaked with micellar cleansing water gently ' +
      'against her closed eye to remove makeup, calm and gentle. ' +
      SHARED,
  },
  {
    kind: 'exfoliate',
    imageSize: '4:3',
    prompt:
      'A woman sweeping a cotton pad with clear chemical exfoliant across her ' +
      'forehead and cheek, smooth refined skin, gentle weekly treatment. ' +
      SHARED,
  },
  {
    kind: 'retinol',
    imageSize: '4:3',
    prompt:
      'A woman applying a pea-size amount of night serum to her cheek in warm ' +
      'dim evening light, cozy nighttime skincare mood, restorative. ' +
      SHARED,
  },
  {
    kind: 'treatment',
    imageSize: '4:3',
    prompt:
      'A woman pressing a targeted treatment serum into her skin with fingertips, ' +
      'focused calm expression, clear balanced complexion. ' +
      SHARED,
  },
  {
    kind: 'eyecare',
    imageSize: '4:3',
    prompt:
      'A close-up of a woman gently tapping a small amount of eye cream under her ' +
      'eye with her ring finger, delicate under-eye care, soft and smooth. ' +
      SHARED,
  },
];

async function createTask(prompt: string, imageSize: ImageSize): Promise<string> {
  if (!KIE_API_TOKEN) throw new Error('KIE_API_TOKEN is not set in environment');
  const response = await fetch(`${KIE_API_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIE_API_TOKEN}`,
    },
    body: JSON.stringify({
      model: 'google/nano-banana',
      callBackUrl: KIE_CALLBACK_URL,
      input: { prompt, output_format: 'png', image_size: imageSize },
    }),
  });
  if (!response.ok) {
    throw new Error(`KIE API failed: ${response.status} ${await response.text()}`);
  }
  const result = await response.json();
  if (result.code !== 200) {
    throw new Error(`KIE API error: ${result.message || 'Unknown error'}`);
  }
  return result.data.taskId;
}

async function waitForCompletion(
  taskId: string,
  maxAttempts = 60,
  intervalMs = 3000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${KIE_API_URL}/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_TOKEN}` },
    });
    if (!response.ok) throw new Error(`KIE status query failed: ${response.status}`);
    const result = await response.json();
    if (result.code !== 200) throw new Error(`KIE status error: ${result.msg}`);
    const { state, resultJson } = result.data;
    if (state === 'success') {
      const parsed = JSON.parse(resultJson);
      if (parsed.resultUrls?.length > 0) return parsed.resultUrls[0];
      throw new Error('Task completed but no result URLs');
    }
    if (state === 'failed') throw new Error(`KIE task failed: ${taskId}`);
    process.stdout.write(`  Polling ${taskId} (${i + 1}/${maxAttempts})...\r`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`KIE task timeout: ${taskId}`);
}

async function downloadImage(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const onlyIdx = args.indexOf('--only');
  const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  const targets = only ? IMAGES.filter((i) => i.kind === only) : IMAGES;
  if (targets.length === 0) throw new Error(`No step matched --only "${only}"`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${targets.length} routine step images -> ${OUT_DIR}\n`);

  for (const img of targets) {
    const dest = path.join(OUT_DIR, `${img.kind}.png`);

    if (dryRun) {
      console.log(`▶ ${img.kind} (${img.imageSize})\n  ${img.prompt}\n`);
      continue;
    }
    if (!force && fs.existsSync(dest)) {
      console.log(`• ${img.kind}: exists, skip (use --force to regen)`);
      continue;
    }

    try {
      console.log(`▶ ${img.kind} (${img.imageSize})`);
      const taskId = await createTask(img.prompt, img.imageSize);
      const url = await waitForCompletion(taskId);
      await downloadImage(url, dest);
      console.log(`  ✓ saved ${dest}`);
    } catch (err) {
      console.error(`  ✗ ${img.kind}: ${(err as Error).message}`);
    }
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
