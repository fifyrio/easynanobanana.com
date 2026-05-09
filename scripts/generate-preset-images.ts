/**
 * Preset Image Generator (v2 - Consistent Face)
 *
 * Generates display images for AI image effect preset pages using the KIE API.
 * All presets for a page share the SAME base face — each preset is an image-to-image
 * transformation of that base, matching how the actual product works.
 *
 * Two-phase workflow:
 *   Phase 1: Generate (or supply) a base portrait via text-to-image
 *   Phase 2: Transform the base into each preset via image-to-image editing
 *
 * Usage:
 *   npx tsx scripts/generate-preset-images.ts --page ai-makeup
 *   npx tsx scripts/generate-preset-images.ts --page ai-makeup --base-image ./my-photo.jpg
 *   npx tsx scripts/generate-preset-images.ts --page ai-age-filter --preset "Baby"
 *   npx tsx scripts/generate-preset-images.ts --page all --dry-run
 *   npx tsx scripts/generate-preset-images.ts --page ai-beard-filter --upload --force
 *
 * Flags:
 *   --page <type>           Page type: ai-age-filter | ai-beard-filter | ai-makeup | ai-fat-filter | ai-headshot-generator | all
 *   --base-image <path|url> Use an existing image as base instead of generating one
 *   --preset <name>         Generate only a specific preset by name
 *   --dry-run               Show prompts without calling API
 *   --force                 Regenerate even if image already exists
 *   --upload                Upload generated images to R2 after generation
 *   --ratio <ratio>         Override aspect ratio (default: 1:1)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ===== Types =====

interface BasePreset {
  displaySrc: string;
  referenceSrc: string;
  fileName: string;
  name: string;
}

interface AgePreset extends BasePreset {
  age: string;
}

type PageType = 'ai-age-filter' | 'ai-beard-filter' | 'ai-makeup' | 'ai-fat-filter' | 'ai-headshot-generator';

// ===== KIE API Config =====

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const KIE_API_TOKEN = process.env.KIE_API_TOKEN || '';
const KIE_CALLBACK_URL = process.env.KIE_CALLBACK_URL || '';

// ===== R2 Config =====

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_BASE_URL = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev';

// ===== Paths =====

const PROJECT_ROOT = path.resolve(__dirname, '..');

function getPresetJsonPath(pageType: PageType): string {
  return path.join(PROJECT_ROOT, `src/data/${pageType}-presets.json`);
}

function getLocalImageDir(pageType: PageType): string {
  return path.join(PROJECT_ROOT, `public/images/showcases/${pageType}/preset`);
}

function getBaseImagePath(pageType: PageType): string {
  return path.join(getLocalImageDir(pageType), '_base.png');
}

function getFeatureDir(pageType: PageType): string {
  return path.join(PROJECT_ROOT, `public/images/showcases/${pageType}/feature`);
}

// ===== Base Portrait Prompts =====

function getBasePortraitPrompt(pageType: PageType): string {
  const common = `Studio lighting, neutral gray background, high-quality portrait photography, realistic skin texture, natural expression, front-facing, shoulders visible. Photorealistic, 8K quality.`;

  switch (pageType) {
    case 'ai-makeup':
      return `A professional beauty portrait photo of a young woman in her mid-20s with completely bare face, no makeup at all. Clean natural skin, natural brows, natural lip color. Hair pulled back neatly. ${common}`;
    case 'ai-beard-filter':
      return `A professional headshot portrait photo of a clean-shaven young man in his late 20s. No facial hair at all, smooth face, strong jawline, short neat hair. ${common}`;
    case 'ai-age-filter':
      return `A professional headshot portrait photo of a person in their mid-20s with a neutral, timeless look. Clear skin, natural features, short neat hair. ${common}`;
    case 'ai-fat-filter':
      return `A professional full-body portrait photo of a person with an average build in their mid-20s, standing naturally. Medium height and weight, wearing a fitted plain white t-shirt and jeans. Visible from head to mid-thigh. ${common}`;
    case 'ai-headshot-generator':
      return `A casual selfie photo of a young professional in their late 20s. Slightly messy hair, wearing a plain casual t-shirt. Taken with a phone camera, slightly uneven lighting, casual indoor background. Natural skin, no retouching. Photorealistic, 8K quality.`;
  }
}

// ===== Transformation Prompts (image-to-image) =====

function buildTransformPrompt(pageType: PageType, preset: BasePreset | AgePreset): string {
  switch (pageType) {
    case 'ai-age-filter':
      return buildAgeTransformPrompt(preset as AgePreset);
    case 'ai-beard-filter':
      return buildBeardTransformPrompt(preset);
    case 'ai-makeup':
      return buildMakeupTransformPrompt(preset);
    case 'ai-fat-filter':
      return buildFatFilterTransformPrompt(preset);
    case 'ai-headshot-generator':
      return buildHeadshotTransformPrompt(preset);
  }
}

function buildAgeTransformPrompt(preset: AgePreset): string {
  const ageMap: Record<string, string> = {
    'Baby': 'Transform this person into a baby approximately 2 years old. Make the face round and chubby, with big bright eyes, soft baby skin, tiny nose, and an innocent expression. Keep the same identity features recognizable.',
    'Child': 'Transform this person into a young child approximately 5 years old. Make the face rounder and smaller, with youthful smooth skin, bright curious eyes, and a happy gentle expression. Keep the same identity features recognizable.',
    'Teenager': 'Transform this person into a teenager approximately 15 years old. Make the face slightly rounder with youthful clear skin, natural adolescent features, and a confident expression. Keep the same identity features recognizable.',
    'Young Adult': 'Keep this person looking like a young adult approximately 25 years old. Maintain clear smooth skin, natural vibrant features, and a confident expression. Keep the same identity.',
    'Middle Aged': 'Age this person to look approximately 45 years old. Add subtle wrinkles around the eyes and forehead, slight sagging around the jawline, some gray hair at the temples. Keep the same identity features recognizable.',
    'Senior': 'Age this person to look approximately 65 years old. Add pronounced wrinkles, deeper nasolabial folds, graying hair, slightly thinner face, age spots. Keep the same identity features recognizable.',
    'Elderly': 'Age this person to look approximately 80 years old. Add deep wrinkles and age spots, white hair, thinner face with prominent bone structure, wise gentle expression. Keep the same identity features recognizable.',
  };

  return ageMap[preset.name] || `Transform this person to look approximately ${preset.age?.replace('~', '')} years old (${preset.name}). Keep the same identity features recognizable.`;
}

function buildBeardTransformPrompt(preset: BasePreset): string {
  const beardMap: Record<string, string> = {
    'Clean Shaven': 'Keep this man completely clean-shaven with no facial hair at all. Smooth face, no stubble, no beard, no mustache. Maintain the same identity and expression.',
    'Stubble': 'Add realistic light stubble to this man\'s face. Short 2-3 day beard growth, even shadow across the jaw, chin, and upper lip. Keep the same identity and expression.',
    'Goatee': 'Add a classic goatee to this man. Hair on the chin and a connected mustache only, cheeks remain clean-shaven. Natural beard texture. Keep the same identity and expression.',
    'Full Beard': 'Add a full thick beard to this man covering the entire lower face. Well-groomed, natural beard texture, medium length. Keep the same identity and expression.',
    'Van Dyke': 'Add a Van Dyke beard to this man. A pointed goatee with a separate mustache, cheeks clean-shaven. Neatly groomed. Keep the same identity and expression.',
    'Mutton Chops': 'Add mutton chops to this man. Thick sideburns extending down to the jawline, chin clean-shaven, no mustache. Keep the same identity and expression.',
    'Handlebar Mustache': 'Add a prominent handlebar mustache to this man with curled upward ends. No beard, chin and cheeks clean. Keep the same identity and expression.',
    'Soul Patch': 'Add a small soul patch below this man\'s lower lip. The rest of the face remains clean-shaven. Keep the same identity and expression.',
    'Circle Beard': 'Add a circle beard to this man. A round goatee connected to a mustache forming a circle around the mouth, cheeks clean. Keep the same identity and expression.',
    'Balbo': 'Add a Balbo beard to this man. Mustache and chin beard but no sideburns, with a disconnected style. Keep the same identity and expression.',
  };

  return beardMap[preset.name] || `Add a ${preset.name} beard style to this man. Keep the same identity and expression.`;
}

function buildMakeupTransformPrompt(preset: BasePreset): string {
  const makeupMap: Record<string, string> = {
    'Natural': 'Apply a natural barely-there makeup look to this woman. Light foundation for even skin tone, subtle pink blush, neutral lip tint, light mascara. The makeup should be barely noticeable. Keep the same identity and expression.',
    'Glam': 'Apply a full glamorous makeup look to this woman. Bold shimmery eye shadow, defined arched brows, contoured and highlighted cheeks, glossy pink lips, long dramatic lashes. Keep the same identity and expression.',
    'Smokey Eye': 'Apply a dramatic smokey eye makeup to this woman. Dark blended eye shadow transitioning from deep charcoal to lighter tones, winged black liner, volumized lashes, nude lip. Keep the same identity and expression.',
    'Korean Glass Skin': 'Apply Korean glass skin makeup to this woman. Dewy luminous translucent-looking skin, gradient coral lip tint, soft peachy blush, minimal natural eye makeup, glossy dewy finish all over. Keep the same identity and expression.',
    'Bridal': 'Apply elegant bridal makeup to this woman. Soft pink and gold tones on the eyes, defined curled lashes, rosy glowing cheeks, classic rose lip color. Radiant and romantic. Keep the same identity and expression.',
    'Gothic': 'Apply dramatic gothic makeup to this woman. Dark black lipstick, heavy dark smokey eye shadow, pale porcelain-like foundation, sharp dark contour. Dramatic and bold. Keep the same identity and expression.',
    'No Makeup': 'Remove all makeup from this woman completely. Show clean natural skin with visible pores and natural skin tone variations. No foundation, no eye makeup, no lip color. Completely bare fresh face. Keep the same identity and expression.',
    'Contour & Highlight': 'Apply dramatic contour and highlight makeup to this woman. Sculpted contour along the jawline and cheekbones, bright highlight on nose bridge, brow bone, and top of cheekbones. Defined face structure with natural lip. Keep the same identity and expression.',
    'Sunset Eye': 'Apply a warm sunset eye makeup look to this woman. Vibrant gradient eye shadow in orange, pink, and gold tones blended together, warm-toned peach blush, glossy nude lip. Keep the same identity and expression.',
    'Red Carpet': 'Apply Hollywood red carpet makeup to this woman. Defined cat eye with winged liner, bold classic red lip, luminous dewy skin, sculpted sharp brows. Polished and camera-ready. Keep the same identity and expression.',
  };

  return makeupMap[preset.name] || `Apply a ${preset.name} makeup look to this woman. Keep the same identity and expression.`;
}

function buildFatFilterTransformPrompt(preset: BasePreset): string {
  const fatMap: Record<string, string> = {
    'Slim': 'Transform this person to have a slim body type. Narrow waist, lean arms, visible collarbone, slender build overall. The clothes should fit loosely. Keep the same identity, face, clothing, and background.',
    'Fit': 'Transform this person to have a fit athletic body type. Toned arms, defined shoulders, flat stomach, muscular but lean physique. The clothes should fit snugly showing a toned shape. Keep the same identity, face, clothing, and background.',
    'Average': 'Keep this person with an average, normal body type. Medium build, neither thin nor overweight, natural proportions. No changes needed to body shape. Keep the same identity, face, clothing, and background.',
    'Chubby': 'Transform this person to have a chubby body type. Rounder face, thicker arms, soft belly, wider midsection, fuller cheeks. The clothes should fit tighter. Keep the same identity, face, clothing, and background.',
    'Heavy': 'Transform this person to have a heavy, overweight body type. Much wider midsection, large belly, thick arms, double chin, round face. The clothes should stretch and fit very tightly. Keep the same identity, face, clothing, and background.',
    'Plus Size': 'Transform this person to have a plus-size body type. Very large body overall, wide hips and shoulders, round face, thick limbs, prominent belly. The clothes should look stretched. Keep the same identity, face, clothing, and background.',
    'Muscular': 'Transform this person to have a muscular bodybuilder body type. Very large defined muscles, broad shoulders, thick neck, big arms, wide chest. The t-shirt should look tight around the muscles. Keep the same identity, face, clothing, and background.',
    'Skinny': 'Transform this person to have a very skinny, underweight body type. Very thin arms, narrow shoulders, visible bone structure, gaunt appearance. The clothes should hang loosely. Keep the same identity, face, clothing, and background.',
  };

  return fatMap[preset.name] || `Transform this person to have a ${preset.name} body type. Keep the same identity, face, clothing, and background.`;
}

function buildHeadshotTransformPrompt(preset: BasePreset): string {
  const headshotMap: Record<string, string> = {
    'Corporate': 'Transform this casual photo into a polished corporate headshot. Dark navy or charcoal suit with a crisp white shirt, professional studio lighting, clean solid gray background. Confident yet approachable expression. Keep the same identity and facial features.',
    'LinkedIn': 'Transform this casual photo into a professional LinkedIn headshot. Smart business casual attire, bright clean background, natural warm lighting. Friendly approachable smile. Keep the same identity and facial features.',
    'Creative': 'Transform this casual photo into a creative professional headshot. Stylish modern outfit, artistic colorful gradient background, dramatic side lighting with creative color tones. Confident expression. Keep the same identity and facial features.',
    'Executive': 'Transform this casual photo into a premium executive portrait. Expensive dark suit with tie, rich dark background with subtle warm lighting, authoritative yet trustworthy expression. High-end professional photography look. Keep the same identity and facial features.',
    'Startup': 'Transform this casual photo into a tech startup headshot. Casual hoodie or t-shirt, modern minimalist background, bright even lighting, relaxed genuine smile. Silicon Valley tech vibe. Keep the same identity and facial features.',
    'Real Estate': 'Transform this casual photo into a real estate agent headshot. Professional blazer, warm inviting smile, bright clean background with warm tones, confident and trustworthy look. Keep the same identity and facial features.',
    'Medical': 'Transform this casual photo into a medical professional headshot. White lab coat over business attire, clean clinical blue-white background, trustworthy caring expression, professional medical photography. Keep the same identity and facial features.',
    'Academic': 'Transform this casual photo into an academic professional headshot. Tweed blazer or cardigan with open collar shirt, warm scholarly atmosphere, bookish background with muted tones, intellectual confident expression. Keep the same identity and facial features.',
    'Outdoor': 'Transform this casual photo into a natural outdoor portrait headshot. Blurred green nature background with golden hour bokeh, natural sunlight, smart casual outfit, relaxed natural smile. Keep the same identity and facial features.',
    'Studio Classic': 'Transform this casual photo into a classic studio portrait headshot. Traditional studio setup with solid dark or light backdrop, even professional lighting, neutral clean shirt or blouse, timeless professional look. Keep the same identity and facial features.',
  };

  return headshotMap[preset.name] || `Transform this casual photo into a professional ${preset.name} style headshot. Keep the same identity and facial features.`;
}

// ===== KIE API Functions =====

async function createPromptOnlyTask(
  prompt: string,
  imageRatio: '9:16' | '1:1' = '1:1'
): Promise<string> {
  if (!KIE_API_TOKEN) {
    throw new Error('KIE_API_TOKEN is not set in environment');
  }

  const response = await fetch(`${KIE_API_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIE_API_TOKEN}`,
    },
    body: JSON.stringify({
      model: 'google/nano-banana',
      callBackUrl: KIE_CALLBACK_URL,
      input: {
        prompt,
        output_format: 'png',
        image_size: imageRatio,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KIE API failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  if (result.code !== 200) {
    throw new Error(`KIE API error: ${result.message || 'Unknown error'}`);
  }

  return result.data.taskId;
}

async function createImageEditTask(
  prompt: string,
  imageUrl: string,
  imageRatio: '9:16' | '1:1' = '1:1'
): Promise<string> {
  if (!KIE_API_TOKEN) {
    throw new Error('KIE_API_TOKEN is not set in environment');
  }

  const response = await fetch(`${KIE_API_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIE_API_TOKEN}`,
    },
    body: JSON.stringify({
      model: 'google/nano-banana-edit',
      callBackUrl: KIE_CALLBACK_URL,
      input: {
        prompt,
        image_urls: [imageUrl],
        output_format: 'png',
        image_size: imageRatio,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KIE edit API failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  if (result.code !== 200) {
    throw new Error(`KIE edit API error: ${result.message || 'Unknown error'}`);
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

    if (!response.ok) {
      throw new Error(`KIE status query failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(`KIE status error: ${result.msg}`);
    }

    const { state, resultJson } = result.data;

    if (state === 'success') {
      const parsed = JSON.parse(resultJson);
      if (parsed.resultUrls?.length > 0) {
        return parsed.resultUrls[0];
      }
      throw new Error('Task completed but no result URLs');
    }

    if (state === 'failed') {
      throw new Error(`KIE task failed: ${taskId}`);
    }

    process.stdout.write(`  Polling ${taskId} (${i + 1}/${maxAttempts})...\r`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`KIE task timeout: ${taskId}`);
}

async function downloadImage(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
}

// ===== R2 Upload =====

function getR2Client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured in environment');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadToR2(localPath: string, r2Key: string): Promise<string> {
  const client = getR2Client();
  const fileBuffer = fs.readFileSync(localPath);

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${R2_PUBLIC_BASE_URL}/${r2Key}`;
}

/**
 * Upload a local image to R2 and return its public URL.
 * Used to make the base image accessible to the KIE edit API.
 */
async function uploadBaseToR2(localPath: string, pageType: PageType): Promise<string> {
  const r2Key = `showcases/${pageType}/preset/_base.png`;
  return uploadToR2(localPath, r2Key);
}

// ===== Preset Loading =====

function loadPresets(pageType: PageType): BasePreset[] {
  const jsonPath = getPresetJsonPath(pageType);
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const keyMap: Record<PageType, string> = {
    'ai-age-filter': 'age',
    'ai-beard-filter': 'beard',
    'ai-makeup': 'makeup',
    'ai-fat-filter': 'bodyTypes',
    'ai-headshot-generator': 'styles',
  };

  return raw[keyMap[pageType]] || [];
}

// ===== Phase 1: Generate or Load Base Image =====

async function ensureBaseImage(
  pageType: PageType,
  baseImageArg: string | undefined,
  ratio: '9:16' | '1:1',
  dryRun: boolean
): Promise<string> {
  const baseImagePath = getBaseImagePath(pageType);

  // User supplied a base image
  if (baseImageArg) {
    if (baseImageArg.startsWith('http')) {
      console.log(`  Using remote base image: ${baseImageArg}`);
      return baseImageArg;
    }
    // Local file — copy to preset dir and upload to R2
    const absPath = path.resolve(baseImageArg);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Base image not found: ${absPath}`);
    }
    fs.mkdirSync(path.dirname(baseImagePath), { recursive: true });
    fs.copyFileSync(absPath, baseImagePath);
    console.log(`  Copied base image to: ${baseImagePath}`);

    // Upload to R2 so KIE API can access it
    const publicUrl = await uploadBaseToR2(baseImagePath, pageType);
    console.log(`  Base image uploaded to R2: ${publicUrl}`);
    return publicUrl;
  }

  // Check if base image already exists locally
  if (fs.existsSync(baseImagePath)) {
    console.log(`  Base image already exists: ${baseImagePath}`);
    // Upload to R2 to get a public URL for KIE API
    const publicUrl = await uploadBaseToR2(baseImagePath, pageType);
    console.log(`  Base image URL: ${publicUrl}`);
    return publicUrl;
  }

  if (dryRun) {
    const prompt = getBasePortraitPrompt(pageType);
    console.log(`  [DRY-RUN] Would generate base portrait:`);
    console.log(`  PROMPT: ${prompt.substring(0, 120)}...`);
    return 'https://example.com/dry-run-base.png';
  }

  // Generate base portrait via text-to-image
  console.log(`  Generating base portrait for ${pageType}...`);
  const prompt = getBasePortraitPrompt(pageType);
  console.log(`  Prompt: ${prompt.substring(0, 100)}...`);

  const taskId = await createPromptOnlyTask(prompt, ratio);
  console.log(`  Base task ID: ${taskId}`);

  const resultUrl = await waitForCompletion(taskId);
  console.log(`\n  Base image generated: ${resultUrl}`);

  // Download locally
  await downloadImage(resultUrl, baseImagePath);
  console.log(`  Base image saved: ${baseImagePath}`);

  // Upload to R2 so KIE edit API can access it
  const publicUrl = await uploadBaseToR2(baseImagePath, pageType);
  console.log(`  Base image uploaded to R2: ${publicUrl}`);

  return publicUrl;
}

// ===== Phase 2: Transform Base into Each Preset =====

async function generateForPage(
  pageType: PageType,
  options: {
    baseImage?: string;
    presetName?: string;
    dryRun: boolean;
    force: boolean;
    upload: boolean;
    ratio: '9:16' | '1:1';
  }
): Promise<void> {
  console.log(`\n========================================`);
  console.log(`  Generating presets for: ${pageType}`);
  console.log(`  Mode: Consistent face (image-to-image)`);
  console.log(`========================================\n`);

  // Phase 1: Ensure base image exists
  console.log(`[Phase 1] Preparing base image...`);
  const baseImageUrl = await ensureBaseImage(pageType, options.baseImage, options.ratio, options.dryRun);
  console.log();

  // Phase 2: Generate each preset from the base
  console.log(`[Phase 2] Generating preset transformations...\n`);

  const presets = loadPresets(pageType);
  const imageDir = getLocalImageDir(pageType);
  fs.mkdirSync(imageDir, { recursive: true });

  const filtered = options.presetName
    ? presets.filter((p) => p.name === options.presetName)
    : presets;

  if (filtered.length === 0) {
    console.log(`No presets found${options.presetName ? ` matching "${options.presetName}"` : ''}`);
    return;
  }

  console.log(`Found ${filtered.length} preset(s) to process\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const preset of filtered) {
    const localPath = path.join(imageDir, preset.fileName);
    const prompt = buildTransformPrompt(pageType, preset);

    console.log(`--- ${preset.name} ---`);

    if (!options.force && fs.existsSync(localPath)) {
      console.log(`  SKIP: ${preset.fileName} already exists (use --force to regenerate)`);
      skipCount++;

      if (options.upload) {
        const r2Key = `showcases/${pageType}/preset/${preset.fileName}`;
        try {
          const publicUrl = await uploadToR2(localPath, r2Key);
          console.log(`  UPLOADED: ${publicUrl}`);
        } catch (err) {
          console.error(`  UPLOAD FAILED: ${err}`);
        }
      }
      continue;
    }

    if (options.dryRun) {
      console.log(`  BASE: ${baseImageUrl}`);
      console.log(`  TRANSFORM: ${prompt.substring(0, 120)}...`);
      console.log(`  OUTPUT: ${localPath}`);
      console.log();
      continue;
    }

    try {
      console.log(`  Creating image-to-image task...`);
      console.log(`  Transform: ${prompt.substring(0, 80)}...`);
      const taskId = await createImageEditTask(prompt, baseImageUrl, options.ratio);
      console.log(`  Task ID: ${taskId}`);

      console.log(`  Waiting for completion...`);
      const resultUrl = await waitForCompletion(taskId);
      console.log(`\n  Result: ${resultUrl}`);

      console.log(`  Downloading to ${preset.fileName}...`);
      await downloadImage(resultUrl, localPath);
      console.log(`  SAVED: ${localPath}`);

      if (options.upload) {
        const r2Key = `showcases/${pageType}/preset/${preset.fileName}`;
        try {
          const publicUrl = await uploadToR2(localPath, r2Key);
          console.log(`  UPLOADED: ${publicUrl}`);
        } catch (err) {
          console.error(`  UPLOAD FAILED: ${err}`);
        }
      }

      successCount++;
      console.log();

      // Pause between requests to avoid rate limiting
      if (filtered.indexOf(preset) < filtered.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error(`  ERROR: ${err}`);
      errorCount++;
      console.log();
    }
  }

  console.log(`\n--- Summary for ${pageType} ---`);
  console.log(`  Base image: ${baseImageUrl}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log();
}

// ===== Phase 3 (optional): Generate Case/Showcase Images =====

/**
 * Case images for the "Why People Love" benefit cards.
 * Each page has 3 cards. Each case image is a new person with a transformation effect.
 * The images need to look different from the preset thumbnails for visual variety.
 */

interface CaseConfig {
  fileName: string;
  basePrompt: string;
  transformPreset: string;
}

function getCaseConfigs(pageType: PageType): CaseConfig[] {
  switch (pageType) {
    case 'ai-age-filter':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional portrait of a smiling young Asian woman in her late 20s with long black hair, wearing a casual white sweater. Natural lighting, warm tone, soft background. Photorealistic, 8K.',
          transformPreset: 'Elderly',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional portrait of a young Black man in his early 30s with short hair, wearing a blue shirt. Bright smile, studio lighting, clean background. Photorealistic, 8K.',
          transformPreset: 'Child',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional portrait of a young Latina woman in her mid-20s with wavy brown hair, wearing a light dress. Outdoor natural light, bokeh background. Photorealistic, 8K.',
          transformPreset: 'Middle Aged',
        },
      ];
    case 'ai-beard-filter':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional portrait of a clean-shaven young man in his late 20s with brown hair, wearing a navy suit. Confident expression, studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Stubble',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional portrait of a clean-shaven young Black man in his early 30s with short curly hair, wearing a casual shirt. Friendly smile, warm lighting. Photorealistic, 8K.',
          transformPreset: 'Goatee',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional portrait of a clean-shaven young man in his mid-20s with blonde hair, wearing a t-shirt. Relaxed expression, natural light, outdoor background. Photorealistic, 8K.',
          transformPreset: 'Full Beard',
        },
      ];
    case 'ai-makeup':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional portrait of a young East Asian woman in her early 20s with no makeup, long straight black hair, wearing a white top. Clean skin, natural light, soft background. Photorealistic, 8K.',
          transformPreset: 'Korean Glass Skin',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional portrait of a young Black woman in her mid-20s with no makeup, natural curly hair, wearing a simple blouse. Beautiful natural skin, studio lighting. Photorealistic, 8K.',
          transformPreset: 'Red Carpet',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional portrait of a young Caucasian woman in her early 20s with no makeup, light brown hair, wearing a casual sweater. Fresh face, warm natural light. Photorealistic, 8K.',
          transformPreset: 'Smokey Eye',
        },
      ];
    case 'ai-fat-filter':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional full-body portrait of a young Asian woman in her late 20s with average build, wearing a fitted blue dress. Standing naturally, visible from head to mid-thigh. Natural lighting, clean background. Photorealistic, 8K.',
          transformPreset: 'Chubby',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional full-body portrait of a young Black man in his early 30s with average build, wearing a casual grey t-shirt and jeans. Standing naturally, visible from head to mid-thigh. Studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Muscular',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional full-body portrait of a young Latina woman in her mid-20s with average build, wearing a white blouse and black pants. Standing naturally, visible from head to mid-thigh. Warm natural light, soft background. Photorealistic, 8K.',
          transformPreset: 'Slim',
        },
      ];
    case 'ai-headshot-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A casual selfie of a young Asian woman in her mid-20s with long black hair, wearing a simple t-shirt. Phone camera quality, indoor lighting, messy background. Photorealistic, 8K.',
          transformPreset: 'Corporate',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A casual selfie of a young Black man in his early 30s with short hair, wearing a casual hoodie. Phone camera, slightly blurry, uneven lighting. Photorealistic, 8K.',
          transformPreset: 'LinkedIn',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A casual selfie of a young Caucasian woman in her late 20s with brown hair, wearing a sweater. Phone camera, natural indoor light, cluttered background. Photorealistic, 8K.',
          transformPreset: 'Creative',
        },
      ];
  }
}

function getCasesDir(pageType: PageType): string {
  return path.join(PROJECT_ROOT, `public/images/showcases/${pageType}/cases`);
}

async function generateCaseImages(
  pageType: PageType,
  options: {
    dryRun: boolean;
    force: boolean;
    upload: boolean;
    ratio: '9:16' | '1:1';
  }
): Promise<void> {
  console.log(`\n========================================`);
  console.log(`  Generating case images for: ${pageType}`);
  console.log(`========================================\n`);

  const casesDir = getCasesDir(pageType);
  fs.mkdirSync(casesDir, { recursive: true });

  const caseConfigs = getCaseConfigs(pageType);
  const presets = loadPresets(pageType);

  let successCount = 0;
  let errorCount = 0;

  for (const config of caseConfigs) {
    const beforePath = path.join(casesDir, config.fileName.replace('.png', '-before.png'));
    const afterPath = path.join(casesDir, config.fileName.replace('.png', '-after.png'));

    console.log(`--- ${config.fileName} (transform: ${config.transformPreset}) ---`);

    // Check if both exist
    if (!options.force && fs.existsSync(beforePath) && fs.existsSync(afterPath)) {
      console.log(`  SKIP: already exists (use --force to regenerate)`);
      if (options.upload) {
        for (const [suffix, lPath] of [['before', beforePath], ['after', afterPath]]) {
          const baseName = config.fileName.replace('.png', '');
          const r2Key = `showcases/${pageType}/cases/${baseName}-${suffix}.png`;
          try {
            const url = await uploadToR2(lPath, r2Key);
            console.log(`  UPLOADED: ${url}`);
          } catch (err) {
            console.error(`  UPLOAD FAILED: ${err}`);
          }
        }
      }
      continue;
    }

    if (options.dryRun) {
      console.log(`  [DRY-RUN] Before: ${config.basePrompt.substring(0, 100)}...`);
      console.log(`  [DRY-RUN] After: transform with "${config.transformPreset}" preset`);
      console.log(`  OUTPUT: ${beforePath}`);
      console.log(`  OUTPUT: ${afterPath}\n`);
      continue;
    }

    try {
      // Step 1: Generate case "before" portrait
      console.log(`  Generating before image...`);
      const beforeTaskId = await createPromptOnlyTask(config.basePrompt, options.ratio);
      console.log(`  Task ID: ${beforeTaskId}`);
      const beforeResultUrl = await waitForCompletion(beforeTaskId);
      console.log(`\n  Before generated: ${beforeResultUrl}`);
      await downloadImage(beforeResultUrl, beforePath);
      console.log(`  SAVED: ${beforePath}`);

      // Upload before to R2 so KIE can access it
      const baseName = config.fileName.replace('.png', '');
      const beforeR2Key = `showcases/${pageType}/cases/${baseName}-before.png`;
      const beforePublicUrl = await uploadToR2(beforePath, beforeR2Key);
      console.log(`  UPLOADED: ${beforePublicUrl}`);

      // Step 2: Transform into "after"
      const preset = presets.find((p) => p.name === config.transformPreset);
      if (!preset) {
        console.error(`  ERROR: Preset "${config.transformPreset}" not found`);
        errorCount++;
        continue;
      }

      const transformPrompt = buildTransformPrompt(pageType, preset);
      console.log(`  Generating after image (${config.transformPreset})...`);
      const afterTaskId = await createImageEditTask(transformPrompt, beforePublicUrl, options.ratio);
      console.log(`  Task ID: ${afterTaskId}`);
      const afterResultUrl = await waitForCompletion(afterTaskId);
      console.log(`\n  After generated: ${afterResultUrl}`);
      await downloadImage(afterResultUrl, afterPath);
      console.log(`  SAVED: ${afterPath}`);

      if (options.upload) {
        const afterR2Key = `showcases/${pageType}/cases/${baseName}-after.png`;
        const afterPublicUrl = await uploadToR2(afterPath, afterR2Key);
        console.log(`  UPLOADED: ${afterPublicUrl}`);
      }

      successCount++;
      console.log();

      // Pause between cases
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`  ERROR: ${err}`);
      errorCount++;
      console.log();
    }
  }

  console.log(`\n--- Case summary for ${pageType} ---`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors:  ${errorCount}\n`);
}

// ===== Phase 4 (optional): Generate Before/After Demo Images =====

/** Which preset to use as the "after" demo for each page */
const DEMO_AFTER_PRESET: Record<PageType, string> = {
  'ai-makeup': 'Glam',
  'ai-beard-filter': 'Full Beard',
  'ai-age-filter': 'Senior',
  'ai-fat-filter': 'Heavy',
  'ai-headshot-generator': 'Executive',
};

/** Demo base portrait prompts — different person from preset base for variety */
function getDemoBasePrompt(pageType: PageType): string {
  const common = `Studio lighting, neutral gray background, high-quality portrait photography, realistic skin texture, natural warm smile, front-facing, shoulders visible. Photorealistic, 8K quality.`;

  switch (pageType) {
    case 'ai-makeup':
      return `A professional beauty portrait photo of a young woman in her early 20s with completely bare face, no makeup. Long dark hair, warm brown eyes, clear natural skin, friendly smile. ${common}`;
    case 'ai-beard-filter':
      return `A professional headshot portrait photo of a clean-shaven young man in his early 30s. No facial hair, strong jawline, dark hair, blue eyes, friendly smile. ${common}`;
    case 'ai-age-filter':
      return `A professional headshot portrait photo of a young woman in her mid-20s. Clear skin, bright eyes, brown hair, natural features, warm smile. ${common}`;
    case 'ai-fat-filter':
      return `A professional full-body portrait photo of a young man in his late 20s with average build, wearing a fitted navy t-shirt and khaki pants. Standing naturally, visible from head to mid-thigh, warm smile. ${common}`;
    case 'ai-headshot-generator':
      return `A casual phone selfie of a young woman in her early 30s with dark hair, wearing a casual grey sweater. Taken indoors, uneven lighting, messy living room background. Natural look, no makeup. Photorealistic, 8K quality.`;
  }
}

async function generateDemoImages(
  pageType: PageType,
  options: {
    dryRun: boolean;
    force: boolean;
    upload: boolean;
    ratio: '9:16' | '1:1';
  }
): Promise<void> {
  console.log(`\n========================================`);
  console.log(`  Generating Before/After demo for: ${pageType}`);
  console.log(`========================================\n`);

  const featureDir = getFeatureDir(pageType);
  fs.mkdirSync(featureDir, { recursive: true });

  const beforePath = path.join(featureDir, 'before.png');
  const afterPath = path.join(featureDir, 'after.png');

  // Check if both exist already
  if (!options.force && fs.existsSync(beforePath) && fs.existsSync(afterPath)) {
    console.log(`  SKIP: before.png and after.png already exist (use --force to regenerate)`);

    if (options.upload) {
      for (const [file, localPath] of [['before.png', beforePath], ['after.png', afterPath]]) {
        const r2Key = `showcases/${pageType}/feature/${file}`;
        try {
          const url = await uploadToR2(localPath, r2Key);
          console.log(`  UPLOADED: ${url}`);
        } catch (err) {
          console.error(`  UPLOAD FAILED: ${err}`);
        }
      }
    }
    return;
  }

  // Step 1: Generate demo "before" portrait
  const demoPrompt = getDemoBasePrompt(pageType);

  if (options.dryRun) {
    console.log(`  [DRY-RUN] Before image:`);
    console.log(`  PROMPT: ${demoPrompt.substring(0, 120)}...`);
    console.log(`  OUTPUT: ${beforePath}`);
    const afterPreset = DEMO_AFTER_PRESET[pageType];
    console.log(`\n  [DRY-RUN] After image (preset: ${afterPreset}):`);
    console.log(`  TRANSFORM: (image-to-image from before)`);
    console.log(`  OUTPUT: ${afterPath}`);
    return;
  }

  let beforeUrl: string;

  if (!options.force && fs.existsSync(beforePath)) {
    console.log(`  Before image already exists, reusing...`);
    beforeUrl = await uploadToR2(beforePath, `showcases/${pageType}/feature/before.png`);
    console.log(`  Before URL: ${beforeUrl}`);
  } else {
    console.log(`  Generating demo before portrait...`);
    console.log(`  Prompt: ${demoPrompt.substring(0, 100)}...`);

    const taskId = await createPromptOnlyTask(demoPrompt, options.ratio);
    console.log(`  Task ID: ${taskId}`);

    const resultUrl = await waitForCompletion(taskId);
    console.log(`\n  Before image generated: ${resultUrl}`);

    await downloadImage(resultUrl, beforePath);
    console.log(`  SAVED: ${beforePath}`);

    // Upload before to R2
    beforeUrl = await uploadToR2(beforePath, `showcases/${pageType}/feature/before.png`);
    console.log(`  UPLOADED: ${beforeUrl}`);
  }

  // Step 2: Generate demo "after" by transforming before with a representative preset
  const afterPresetName = DEMO_AFTER_PRESET[pageType];
  const presets = loadPresets(pageType);
  const afterPreset = presets.find((p) => p.name === afterPresetName);

  if (!afterPreset) {
    console.error(`  ERROR: Demo preset "${afterPresetName}" not found in ${pageType} presets`);
    return;
  }

  console.log(`\n  Generating demo after image (preset: ${afterPresetName})...`);
  const transformPrompt = buildTransformPrompt(pageType, afterPreset);
  console.log(`  Transform: ${transformPrompt.substring(0, 80)}...`);

  const afterTaskId = await createImageEditTask(transformPrompt, beforeUrl, options.ratio);
  console.log(`  Task ID: ${afterTaskId}`);

  const afterResultUrl = await waitForCompletion(afterTaskId);
  console.log(`\n  After image generated: ${afterResultUrl}`);

  await downloadImage(afterResultUrl, afterPath);
  console.log(`  SAVED: ${afterPath}`);

  if (options.upload) {
    const url = await uploadToR2(afterPath, `showcases/${pageType}/feature/after.png`);
    console.log(`  UPLOADED: ${url}`);
  }

  console.log(`\n  Demo images complete for ${pageType}!`);
}

// ===== Main =====

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const getArgValue = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };

  const pageArg = getArgValue('--page');
  const baseImage = getArgValue('--base-image');
  const presetName = getArgValue('--preset');
  const ratio = (getArgValue('--ratio') || '1:1') as '9:16' | '1:1';
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const upload = args.includes('--upload');
  const demo = args.includes('--demo');
  const cases = args.includes('--cases');

  if (!pageArg) {
    console.log('Preset Image Generator v2 (Consistent Face)\n');
    console.log('Usage: npx tsx scripts/generate-preset-images.ts --page <type> [options]\n');
    console.log('Page types: ai-age-filter | ai-beard-filter | ai-makeup | ai-fat-filter | ai-headshot-generator | all\n');
    console.log('Options:');
    console.log('  --base-image <path|url>  Use existing image as base (skip generation)');
    console.log('  --preset <name>          Generate only a specific preset');
    console.log('  --demo                   Generate before/after demo images for the page hero');
    console.log('  --cases                  Generate case showcase images for benefit cards');
    console.log('  --dry-run                Show prompts without calling API');
    console.log('  --force                  Regenerate even if image exists');
    console.log('  --upload                 Upload to R2 after generation');
    console.log('  --ratio <ratio>          Aspect ratio: 1:1 or 9:16 (default: 1:1)');
    console.log('\nWorkflow:');
    console.log('  1. Generates (or uses supplied) base portrait per page type');
    console.log('  2. Transforms base into each preset via image-to-image editing');
    console.log('  3. All presets share the same face, like the real product');
    console.log('  --demo generates before.png + after.png in feature/ directory');
    console.log('  --cases generates case-1/2/3 before+after pairs in cases/ directory');
    process.exit(1);
  }

  if (!dryRun && !KIE_API_TOKEN) {
    console.error('ERROR: KIE_API_TOKEN environment variable is required');
    console.error('Set it in .env.local or export it before running');
    process.exit(1);
  }

  const options = { baseImage, presetName, dryRun, force, upload, ratio };
  const demoOptions = { dryRun, force, upload, ratio };
  const allPages: PageType[] = ['ai-age-filter', 'ai-beard-filter', 'ai-makeup', 'ai-fat-filter', 'ai-headshot-generator'];

  if (pageArg === 'all') {
    for (const page of allPages) {
      if (demo) {
        await generateDemoImages(page, demoOptions);
      } else if (cases) {
        await generateCaseImages(page, demoOptions);
      } else {
        await generateForPage(page, options);
      }
    }
  } else if (allPages.includes(pageArg as PageType)) {
    if (demo) {
      await generateDemoImages(pageArg as PageType, demoOptions);
    } else if (cases) {
      await generateCaseImages(pageArg as PageType, demoOptions);
    } else {
      await generateForPage(pageArg as PageType, options);
    }
  } else {
    console.error(`Unknown page type: ${pageArg}`);
    console.error(`Valid types: ${allPages.join(' | ')} | all`);
    process.exit(1);
  }

  console.log('All done!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
