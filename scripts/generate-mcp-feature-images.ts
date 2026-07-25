/**
 * One-off: generate the 4 marketing "feature" images for the MCP/CLI/Skill
 * landing pages via KIE text-to-image, upload to R2, print the public URLs.
 *
 * Run: npx tsx scripts/generate-mcp-feature-images.ts
 * Then paste the printed URLs into McpConnectClient's FEATURES array.
 */
import 'dotenv/config';
import { KIEImageService } from '../src/lib/kie-api/kie-image-service';
import { uploadImageToR2 } from '../src/lib/r2';

interface FeatureImage {
  key: string;
  prompt: string;
}

const FEATURES: FeatureImage[] = [
  {
    key: 'scene',
    prompt:
      'Cinematic wide establishing shot, moody volumetric lighting, epic storytelling atmosphere, film grain, dramatic color grade, no text, no watermark, ultra detailed',
  },
  {
    key: 'batch',
    prompt:
      'A neat grid montage of many small cinematic film frames, varied scenes and colors, contact-sheet layout, clean modern aesthetic, no text, no watermark',
  },
  {
    key: 'thumbnail',
    prompt:
      'Bold vibrant YouTube thumbnail style graphic, high contrast, punchy saturated colors, dramatic subject, eye-catching composition, no text, no watermark',
  },
  {
    key: 'video',
    prompt:
      'A sleek faceless creator video still, cinematic vertical composition, warm cinematic lighting, atmospheric, professional color grade, no text, no watermark',
  },
];

async function main() {
  const kie = new KIEImageService();
  const results: Record<string, string> = {};

  for (const f of FEATURES) {
    console.log(`\n🎨 Generating "${f.key}"...`);
    const taskId = await kie.createPromptOnlyTask(f.prompt, '1:1', 'google/nano-banana');
    const kieUrl = await kie.waitForTaskCompletion(taskId, 40, 2000);
    const resp = await fetch(kieUrl);
    if (!resp.ok) throw new Error(`download failed ${resp.status}`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    const url = await uploadImageToR2(buffer, `mcp-feature-${f.key}.png`, 'image/png');
    results[f.key] = url;
    console.log(`✅ ${f.key}: ${url}`);
  }

  console.log('\n=== ALL FEATURE IMAGE URLS ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error('Generation failed:', e);
  process.exit(1);
});
