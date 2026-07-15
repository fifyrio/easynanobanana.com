/**
 * Glowria App Logo Generator
 *
 * Generates app icon concepts for the Glowria skincare-routine app using the
 * KIE API (google/nano-banana, 1:1). Brand identity sourced from
 * app-factory/00-Idea_Pool/My_Projects/Glowria/DESIGN.md:
 *   - Brand gradient: Lavender #A855F7 -> Rose #E8567F
 *   - Vibe: editorial beauty magazine, warm, intimate, "your beauty editor"
 *
 * Usage:
 *   npx tsx scripts/generate-glowria-logo.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const KIE_API_TOKEN = process.env.KIE_API_TOKEN || '';
const KIE_CALLBACK_URL = process.env.KIE_CALLBACK_URL || '';

const OUT_DIR =
  '/Volumes/Extended/ext-docs/app-factory/00-Idea_Pool/My_Projects/Glowria/logo';

interface Concept {
  fileName: string;
  prompt: string;
}

const SHARED =
  'iOS app icon, full-bleed square format with sharp 90-degree corners, ' +
  'NO rounded corners, background fills the entire frame edge to edge, ' +
  '(Apple applies the corner mask automatically — keep corners square). ' +
  'Centered single mark, flat vector, no text, no letters, no words, ' +
  'premium App Store quality, clean negative space, crisp edges, ' +
  'subtle soft inner glow, smooth lavender-to-rose gradient ' +
  '(#A855F7 to #E8567F), editorial beauty-tech aesthetic, high resolution.';

const CONCEPTS: Concept[] = [
  {
    fileName: 'glowria-icon-radiant-petal.png',
    prompt:
      'A minimalist abstract glowing petal forming a soft radiant bloom, ' +
      'symbolizing skin glow and renewal, gentle light burst at the center. ' +
      SHARED,
  },
  {
    fileName: 'glowria-icon-glow-droplet.png',
    prompt:
      'A luminous dewdrop with a soft radial glow halo, evoking dewy hydrated ' +
      'skin and freshness, single elegant shape on a warm ivory-tinted background. ' +
      SHARED,
  },
  {
    fileName: 'glowria-icon-sunburst-face.png',
    prompt:
      'An abstract radiant sunburst made of soft rounded rays expanding from a ' +
      'glowing core, symbolizing radiant skin and confidence, balanced symmetrical ' +
      'composition. ' +
      SHARED,
  },
  {
    fileName: 'glowria-icon-monogram-g.png',
    prompt:
      'An elegant abstract spiral mark resembling a soft letter G formed by a ' +
      'single continuous glowing ribbon, editorial and refined, on a clean ' +
      'gradient field. ' +
      SHARED,
  },
];

async function createTask(prompt: string): Promise<string> {
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
      input: { prompt, output_format: 'png', image_size: '1:1' },
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
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${CONCEPTS.length} Glowria logo concepts -> ${OUT_DIR}\n`);
  for (const c of CONCEPTS) {
    try {
      console.log(`▶ ${c.fileName}`);
      const taskId = await createTask(c.prompt);
      const url = await waitForCompletion(taskId);
      const dest = path.join(OUT_DIR, c.fileName);
      await downloadImage(url, dest);
      console.log(`  ✓ saved ${dest}`);
    } catch (err) {
      console.error(`  ✗ ${c.fileName}: ${(err as Error).message}`);
    }
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
