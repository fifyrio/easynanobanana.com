/**
 * Glowria Onboarding + Paywall Before/After Skin Image Generator
 *
 * Generates real-looking before/after skin transformation comparison images
 * for the Glowria onboarding flow and paywall screens using the KIE API
 * (google/nano-banana). Each image is a single split-screen composite:
 * a "before" face (dull, uneven, concerns visible) on one side and an
 * "after" face (radiant, smooth, even) on the other — the same subject.
 *
 * Output saved beside the Glowria UI HTML files so they can be referenced
 * via relative `assets/...` paths.
 *
 * Usage:
 *   npx tsx scripts/generate-glowria-skin-images.ts
 *   npx tsx scripts/generate-glowria-skin-images.ts --only skin-ba-1
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const KIE_API_TOKEN = process.env.KIE_API_TOKEN || '';
const KIE_CALLBACK_URL = process.env.KIE_CALLBACK_URL || '';

const OUT_DIR =
  '/Volumes/Extended/ext-docs/app-factory/00-Idea_Pool/My_Projects/Glowria/UI/assets';

type ImageSize = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

interface SkinImage {
  fileName: string;
  imageSize: ImageSize;
  prompt: string;
}

// Shared photographic direction: editorial beauty, real skin, clear split.
const SHARED =
  'A single photo split exactly down the vertical center into two halves, ' +
  'BEFORE on the left and AFTER on the right, showing the SAME woman so the ' +
  'transformation is believable. Clean thin vertical divider line down the ' +
  'middle. Editorial beauty photography, soft natural window light, warm ivory ' +
  'tones, realistic skin texture with visible pores, photorealistic, high ' +
  'resolution, no text, no watermark, no labels printed on the image.';

const IMAGES: SkinImage[] = [
  {
    // Onboarding slide 1 — "Your skin, understood."
    fileName: 'skin-ba-1.png',
    imageSize: '3:4',
    prompt:
      'Close-up beauty portrait of a young woman facing camera. LEFT (before): ' +
      'dull, tired skin with redness, uneven tone, visible blemishes and dark ' +
      'spots, flat lighting. RIGHT (after): the same woman with clear, even, ' +
      'radiant glowing skin, healthy hydrated complexion, soft luminous glow. ' +
      SHARED,
  },
  {
    // Onboarding slide 2 — "Track real change."
    fileName: 'skin-ba-2.png',
    imageSize: '3:4',
    prompt:
      'Close-up cheek and jawline beauty shot of a woman. LEFT (before): rough ' +
      'skin texture, enlarged pores, slight acne and dullness, uneven tone. ' +
      'RIGHT (after): the same area looking smooth, refined, even-toned and ' +
      'plump with a soft dewy finish. ' +
      SHARED,
  },
  {
    // Onboarding slide 3 — "Build your ritual."
    fileName: 'skin-ba-3.png',
    imageSize: '3:4',
    prompt:
      'Editorial beauty portrait of a woman with a calm expression. LEFT ' +
      '(before): dehydrated, lackluster skin, fine lines, tired under-eyes. ' +
      'RIGHT (after): the same woman with luminous, well-rested, deeply ' +
      'hydrated glowing skin and a healthy natural radiance. ' +
      SHARED,
  },
  {
    // Paywall full — hero before/after, aspect 4:3 container.
    fileName: 'skin-ba-paywall.png',
    imageSize: '4:3',
    prompt:
      'Striking beauty before-and-after of a woman. LEFT (before): skin with ' +
      'visible concerns — redness, uneven texture, dark spots, dullness. RIGHT ' +
      '(after): the same woman with flawless, radiant, even and glowing skin, ' +
      'visibly healthier and brighter. Premium skincare-result look. ' +
      SHARED,
  },
  {
    // Paywall half-sheet — blurred scan background, aspect 3:4 portrait.
    fileName: 'skin-ba-scan.png',
    imageSize: '3:4',
    prompt:
      'Close-up of a woman cheek and skin surface for a skin-analysis app. ' +
      'LEFT (before): rough, congested, uneven skin with concerns. RIGHT ' +
      '(after): the same skin looking clear, smooth, refined and radiant. ' +
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
  const onlyArg = process.argv.indexOf('--only');
  const only = onlyArg !== -1 ? process.argv[onlyArg + 1] : null;
  const targets = only
    ? IMAGES.filter((i) => i.fileName.replace(/\.png$/, '') === only)
    : IMAGES;

  if (targets.length === 0) {
    throw new Error(`No image matched --only "${only}"`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${targets.length} Glowria before/after images -> ${OUT_DIR}\n`);

  for (const img of targets) {
    try {
      console.log(`▶ ${img.fileName} (${img.imageSize})`);
      const taskId = await createTask(img.prompt, img.imageSize);
      const url = await waitForCompletion(taskId);
      const dest = path.join(OUT_DIR, img.fileName);
      await downloadImage(url, dest);
      console.log(`  ✓ saved ${dest}`);
    } catch (err) {
      console.error(`  ✗ ${img.fileName}: ${(err as Error).message}`);
    }
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
