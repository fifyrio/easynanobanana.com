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
 *   --page <type>           Page type: ai-age-filter | ai-beard-filter | ai-makeup | ai-fat-filter | ai-headshot-generator | ai-hug | ai-smile-filter | ai-skin-color | all
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

type PageType = 'ai-age-filter' | 'ai-beard-filter' | 'ai-makeup' | 'ai-fat-filter' | 'ai-headshot-generator' | 'ai-hug' | 'ai-smile-filter' | 'ai-skin-color' | 'ai-eye-color' | 'ai-baby-generator' | 'ai-photo-colorizer' | 'ai-face-shape' | 'ai-vintage-photo-booth' | 'ai-photo-to-sketch' | 'ai-photo-to-cartoon' | 'ai-ascii-art-generator' | 'ai-muscle-generator' | 'ai-open-eyes' | 'ai-pet-portrait' | 'ai-personal-color' | 'ai-perler-bead-pattern' | 'ai-punch-hole-effect' | 'ai-tattoo-generator' | 'ai-sticker-generator' | 'ai-logo-generator' | 'ai-meme-generator' | 'ai-face-animator' | 'ai-glow-up-test' | 'ai-outfit-change' | 'ai-alter-ego' | 'ai-virality-predictor' | 'ai-attractiveness-test' | 'ai-comic-frame' | 'ai-bug-identifier';

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
    case 'ai-hug':
      return `A professional portrait photo of a young woman in her mid-20s standing alone with arms relaxed at her sides. Wearing a casual outfit, warm smile, full body visible from head to waist. ${common}`;
    case 'ai-smile-filter':
      return `A professional headshot portrait photo of a young woman in her mid-20s with a completely neutral, expressionless face. No smile, no frown, relaxed mouth closed. Natural clear skin, light makeup, hair pulled back. ${common}`;
    case 'ai-skin-color':
      return `A professional headshot portrait photo of a young woman in her mid-20s with medium skin tone. Natural clear skin, minimal makeup, hair pulled back neatly. Neutral pleasant expression. ${common}`;
    case 'ai-eye-color':
      return `A professional close-up headshot portrait photo of a young woman in her mid-20s with natural brown eyes. Clear sharp focus on the eyes, natural makeup, hair framing the face. Neutral pleasant expression, looking directly at camera. ${common}`;
    case 'ai-baby-generator':
      return `A professional studio portrait photo of an adorable baby with a neutral pleasant expression. Soft baby skin, round face, big bright eyes, cute tiny nose. Wrapped in a soft white blanket. Studio lighting, clean white background. Photorealistic, 8K quality.`;
    case 'ai-photo-colorizer':
      return `A vintage black-and-white portrait photograph from the 1950s of a young woman in her mid-20s. Classic hairstyle, wearing a collared blouse, pearl necklace. Soft studio lighting, neutral background. The photo is entirely in grayscale with no color. High-quality vintage photograph, 8K.`;
    case 'ai-face-shape':
      return `A professional headshot portrait photo of a young woman in her mid-20s with a naturally oval face shape. Clear skin, minimal makeup, hair pulled back neatly to fully expose facial contours. Neutral pleasant expression, front-facing. ${common}`;
    case 'ai-vintage-photo-booth':
      return `A professional portrait photo of a young woman in her mid-20s with natural clear skin, light makeup, warm smile. Wearing a casual modern outfit. Modern color photography, clean sharp image, good lighting, neutral background. Photorealistic, 8K quality.`;
    case 'ai-photo-to-sketch':
      return `A professional portrait photo of a young woman in her mid-20s with natural clear skin, warm smile, long dark hair. Wearing a casual white blouse. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-photo-to-cartoon':
      return `A professional portrait photo of a young woman in her mid-20s with natural clear skin, warm smile, long wavy brown hair. Wearing a casual light pink top. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-ascii-art-generator':
      return `A professional portrait photo of a young woman in her mid-20s with natural clear skin, bright smile, shoulder-length dark hair. Wearing a casual grey sweater. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-muscle-generator':
      return `A full-body photograph of a young man in his mid-20s with average build, wearing a fitted black tank top and grey athletic shorts. Standing naturally with arms at sides, visible from head to mid-thigh. Neutral expression, clean gym background. Photorealistic, 8K quality.`;
    case 'ai-open-eyes':
      return `A close-up portrait photo of a young woman in her mid-20s with her eyes closed or squinting. Natural skin, long dark hair, wearing a casual top. Eyes are clearly shut or half-closed. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-pet-portrait':
      return `A cute golden retriever dog sitting and looking directly at the camera with a friendly happy expression. Clear well-lit pet photography, clean simple background, sharp focus on the dog's face. Natural fur texture, bright eyes, tongue slightly out. Professional pet portrait photography, high quality, 8K.`;
    case 'ai-personal-color':
      return `A professional portrait photo of a young woman in her mid-20s with warm olive skin, dark brown wavy hair, brown eyes. Wearing a neutral white top. Clean sharp modern photograph, good natural lighting, neutral gray background. No makeup, natural skin showing true undertone. Photorealistic, 8K quality.`;
    case 'ai-perler-bead-pattern':
      return `A cute golden retriever puppy sitting and looking at the camera with a happy expression. Clear well-lit pet photography, clean white background, sharp focus. Bright eyes, fluffy fur. Professional photography, high quality, 8K.`;
    case 'ai-punch-hole-effect':
      return `A professional portrait photo of a young woman with clear skin and natural makeup, looking at the camera with a gentle smile. Clean well-lit studio photograph on a plain light gray background. High quality, sharp focus, centered composition.`;
    case 'ai-tattoo-generator':
      return `A young woman with clear skin wearing a sleeveless white tank top, showing her bare arms and shoulders. She is looking at the camera with a confident expression. Clean well-lit studio photograph on a plain light gray background. High quality, sharp focus, centered composition. No existing tattoos on her skin.`;
    case 'ai-sticker-generator':
      return `A cute golden retriever puppy sitting and looking at the camera with a happy expression and tongue out. Clear well-lit photograph on a plain white background. High quality, sharp focus, centered composition.`;
    case 'ai-logo-generator':
      return `A simple black silhouette of a running horse on a plain white background. Clean vector-style illustration, centered composition, high contrast. Suitable as a base for logo design transformation.`;
    case 'ai-meme-generator':
      return `A young man with a surprised expression looking directly at the camera, mouth slightly open in shock. Clear well-lit photograph on a plain light background. High quality, sharp focus, centered composition. Expressive face suitable for meme creation.`;
    case 'ai-face-animator':
      return 'A young woman with a neutral calm expression looking directly at the camera. Natural skin, no makeup, simple plain background. Clear well-lit professional portrait photo, head and shoulders visible, photorealistic.';
    case 'ai-glow-up-test':
      return 'A young woman with clear skin and neutral expression looking directly at the camera. Natural lighting, no makeup, hair pulled back, simple plain white background. Professional beauty portrait photo, head and shoulders visible, photorealistic high resolution.';
    case 'ai-outfit-change':
      return 'A young woman standing in a relaxed pose wearing a plain white t-shirt and simple blue jeans. Full body visible from head to mid-thigh. Clean neutral background, natural lighting, photorealistic fashion photography style.';
    case 'ai-alter-ego':
      return 'A young woman with natural appearance, no makeup, hair down, wearing a plain white t-shirt. Neutral expression looking at camera. Clean white background, natural soft lighting, professional portrait photo, head and shoulders, photorealistic.';
    case 'ai-virality-predictor':
      return 'A young woman with bright smile taking a casual selfie-style photo. Natural makeup, colorful background, good lighting. Upper body visible, looking at camera with engaging expression. Photorealistic social media photo style.';
    case 'ai-attractiveness-test':
      return 'A young woman with clear skin and natural appearance looking directly at the camera. Neutral expression, no makeup, hair down naturally. Clean white background, natural soft lighting, professional portrait photo, head and shoulders visible, photorealistic high resolution.';
    case 'ai-comic-frame':
      return 'A neutral professional portrait photo of a young woman with clear features, light makeup, straight medium-length brown hair, white background, facing camera, shoulders visible, even studio lighting.';
    case 'ai-bug-identifier':
      return `A close-up macro photo of a ladybug on a green leaf, sharp focus, natural lighting, detailed texture, clean background, professional nature photography style.`;
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
    case 'ai-hug':
      return buildHugTransformPrompt(preset);
    case 'ai-smile-filter':
      return buildSmileFilterTransformPrompt(preset);
    case 'ai-skin-color':
      return buildSkinColorTransformPrompt(preset);
    case 'ai-eye-color':
      return buildEyeColorTransformPrompt(preset);
    case 'ai-baby-generator':
      return buildBabyTransformPrompt(preset);
    case 'ai-photo-colorizer':
      return buildPhotoColorizerTransformPrompt(preset);
    case 'ai-face-shape':
      return buildFaceShapeTransformPrompt(preset);
    case 'ai-vintage-photo-booth':
      return buildVintagePhotoBoothTransformPrompt(preset);
    case 'ai-photo-to-sketch':
      return buildPhotoToSketchTransformPrompt(preset);
    case 'ai-photo-to-cartoon':
      return buildPhotoToCartoonTransformPrompt(preset);
    case 'ai-ascii-art-generator':
      return buildAsciiArtTransformPrompt(preset);
    case 'ai-muscle-generator':
      return buildMuscleTransformPrompt(preset);
    case 'ai-open-eyes':
      return buildOpenEyesTransformPrompt(preset);
    case 'ai-pet-portrait':
      return buildPetPortraitTransformPrompt(preset);
    case 'ai-personal-color':
      return buildPersonalColorTransformPrompt(preset);
    case 'ai-perler-bead-pattern':
      return buildPerlerBeadTransformPrompt(preset);
    case 'ai-punch-hole-effect':
      return buildPunchHoleTransformPrompt(preset);
    case 'ai-tattoo-generator':
      return buildTattooTransformPrompt(preset);
    case 'ai-sticker-generator':
      return buildStickerTransformPrompt(preset);
    case 'ai-logo-generator':
      return buildLogoTransformPrompt(preset);
    case 'ai-meme-generator':
      return buildMemeTransformPrompt(preset);
    case 'ai-face-animator':
      return buildFaceAnimatorTransformPrompt(preset);
    case 'ai-glow-up-test':
      return buildGlowUpTestTransformPrompt(preset);
    case 'ai-outfit-change':
      return buildOutfitChangeTransformPrompt(preset);
    case 'ai-alter-ego':
      return buildAlterEgoTransformPrompt(preset);
    case 'ai-virality-predictor':
      return buildViralityPredictorTransformPrompt(preset.name);
    case 'ai-attractiveness-test':
      return buildAttractivenessTestTransformPrompt(preset.name);
    case 'ai-comic-frame':
      return buildComicFrameTransformPrompt(preset.name);
    case 'ai-bug-identifier':
      return buildBugIdentifierTransformPrompt(preset.name);
  }
}

function buildBugIdentifierTransformPrompt(presetName: string): string {
  const bugMap: Record<string, string> = {
    'Species ID': "Add annotated overlay with species name 'Coccinella septempunctata (Seven-spot Ladybird)', family 'Coccinellidae', order 'Coleoptera', confidence score bar showing 97%, classification labels with arrows pointing to key features, clean semi-transparent info panel.",
    'Danger Assessment': "Add color-coded danger assessment overlay with green 'HARMLESS' badge, safety rating bar at 95% safe, beneficial insect icon, no-bite indicator, semi-transparent safety panel with clear labels.",
    'Spider Analysis': "Transform the base image to show a spider instead, add spider-specific analysis overlay with 'Non-venomous' label, web type 'Orb weaver', size classification, identification feature labels.",
    'Bite Analysis': "Add bite analysis overlay showing 'No significant bite risk' label, mild irritation warning, symptom severity scale at LOW, first aid tips panel, semi-transparent medical info overlay.",
    'Pest Control': "Add pest control overlay with 'Beneficial - Do NOT eliminate' badge in green, garden helper classification, natural pest control agent label, management recommendation panel.",
    'Garden Friend': "Add garden impact overlay with large 'GARDEN HERO' badge in green, pollinator status, aphid control rating bar, ecosystem benefit score, beneficial insect certification label.",
    'Life Cycle': "Add lifecycle analysis overlay with 'Adult Stage' identification badge, approximate lifespan bar, lifecycle diagram showing egg→larva→pupa→adult with current stage highlighted, development annotations.",
    'Habitat Info': "Add habitat information overlay with geographic range 'Worldwide', preferred environment 'Gardens, meadows, forests', seasonal activity chart, temperature preference range, mini habitat map outline.",
  };

  return bugMap[presetName] || `Transform this bug photo into a ${presetName} analysis image with annotated overlay and detailed identification info.`;
}

function buildAttractivenessTestTransformPrompt(presetName: string): string {
  const attractivenessMap: Record<string, string> = {
    'Overall Score': "Transform this portrait into an AI attractiveness analysis result image. Enhance with flawless skin and perfect lighting. Add a semi-transparent dark overlay panel showing 'Attractiveness Score: 91/100' with score bars for Beauty: 93%, Symmetry: 89%, Skin Quality: 94%, Features: 88%. Add thin golden annotation lines pointing to facial features with notes like 'Well-defined bone structure' and 'Clear radiant complexion'. Modern sleek infographic with gold and white text on dark overlay.",
    'Face Symmetry': "Transform this portrait into an AI face symmetry analysis image. Add a vertical center line and horizontal guide lines across the face showing symmetry measurements. Add a semi-transparent overlay showing 'Symmetry Score: 92/100' with metrics for Left-Right Balance: 94%, Eye Alignment: 91%, Nose Center: 93%, Lip Symmetry: 90%. Add thin cyan geometric annotation lines highlighting symmetry points with measurement notes. Clean clinical blue and white infographic style.",
    'Golden Ratio': "Transform this portrait into a golden ratio beauty analysis image. Overlay golden spiral and phi grid lines on the face showing mathematical proportions. Add a semi-transparent panel showing 'Golden Ratio Score: 89/100' with metrics for Facial Proportions: 91%, Eye Spacing: 87%, Nose-Lip Ratio: 90%, Forehead-Chin: 88%. Add thin gold geometric lines showing phi measurements. Elegant mathematical gold and cream infographic aesthetic.",
    'Celebrity Match': "Transform this portrait into a celebrity match analysis image. Enhance the person to look their most glamorous and photogenic. Add a semi-transparent overlay showing 'Star Quality Score: 94/100' with metrics for Star Power: 96%, Red Carpet: 93%, Photogenic: 95%, Charisma: 92%. Add thin silver annotation lines with notes like 'Hollywood-grade features' and 'Camera-ready bone structure'. Luxurious silver and black entertainment infographic.",
    'Personality Vibe': "Transform this portrait into a personality vibe analysis image. Enhance with warm approachable lighting and a slight natural smile. Add a semi-transparent overlay showing 'Personality Score: 93/100' with metrics for Confidence: 95%, Humor: 91%, Intelligence: 94%, Warmth: 92%. Add thin warm orange annotation lines with notes like 'High confidence aura' and 'Approachable warmth'. Warm orange and cream personality infographic style.",
    'Age & Youth': "Transform this portrait into an age and youth analysis image. Enhance with youthful glowing skin and vibrant appearance. Add a semi-transparent overlay showing 'Youth Score: 95/100' with metrics for Skin Age: 22, Vitality: 96%, Elasticity: 94%, Radiance: 95%. Add thin green annotation lines with notes like 'Exceptional skin elasticity' and 'Youthful glow detected'. Fresh green and white health infographic style.",
    'Photogenic Score': "Transform this portrait into a photogenic score analysis image. Enhance with perfect studio lighting, ideal angles, and camera-ready appearance. Add a semi-transparent overlay showing 'Photogenic Score: 93/100' with metrics for Camera Appeal: 95%, Light Response: 92%, Angle Score: 94%, Expression: 91%. Add thin purple annotation lines with notes like 'Natural camera presence' and 'Optimal light reflection'. Sleek purple and white photography infographic.",
    'First Impression': "Transform this portrait into a first impression analysis image. Enhance with warm confident appearance and trustworthy expression. Add a semi-transparent overlay showing 'First Impression: 92/100' with metrics for Approachability: 95%, Trustworthiness: 93%, Charisma: 90%, Confidence: 91%. Add thin teal annotation lines with notes like 'Strong approachable presence' and 'High trust factor'. Professional teal and white social infographic style.",
  };

  return attractivenessMap[presetName] || `Transform this portrait into an AI attractiveness analysis image for ${presetName} with a score overlay and detailed metrics.`;
}

function buildComicFrameTransformPrompt(presetName: string): string {
  const comicFrameMap: Record<string, string> = {
    'Superhero': 'Transform into a superhero comic panel with cape, mask, city skyline background, bold ink outlines, cel-shading, action pose, "POW!" speech bubble, vibrant colors.',
    'Adventure': 'Transform into an adventure comic panel with jungle ruins background, explorer outfit, bold ink outlines, cel-shading, treasure map, "WOW!" text.',
    'Romance': 'Transform into a romance comic panel with soft pink/purple tones, sparkles, hearts, elegant outfit, dreamy background, "LOVE" text bubble.',
    'Horror': 'Transform into a horror comic panel with dark eerie lighting, shadows, torn clothing, haunted mansion background, bold ink outlines, "AAAH!" text.',
    'Space': 'Transform into a space comic panel with galaxy/stars background, astronaut suit, spaceship, bold ink outlines, cel-shading, "ZOOM!" text.',
    'Fantasy': 'Transform into a fantasy comic panel with enchanted forest, magical robes, glowing staff, dragons in background, bold ink outlines, "MAGIC!" text.',
    'Detective Noir': 'Transform into a film noir detective comic panel with trenchcoat, fedora hat, rainy city night, dramatic shadows, bold ink outlines, black and white with selective color.',
    'Western': 'Transform into a western comic panel with desert/saloon background, cowboy hat, leather vest, tumbleweed, bold ink outlines, "BANG!" text.',
  };

  return comicFrameMap[presetName] || `Transform this portrait into a ${presetName} comic panel with bold ink outlines, cel-shading, and comic book style.`;
}

function buildViralityPredictorTransformPrompt(presetName: string): string {
  const viralityMap: Record<string, string> = {
    'TikTok Viral': "Transform this photo into a TikTok viral content analysis image. Enhance with trendy vibrant filters and dramatic lighting. Add a semi-transparent dark overlay panel showing 'Virality Score: 94/100' with metrics for Hook Strength: 96%, Scroll Stop: 93%, Engagement: 95%, Share Potential: 92%. Add thin neon pink annotation lines pointing to features with notes like 'Strong hook element' and 'High scroll-stop factor'. TikTok-style neon pink and cyan infographic aesthetic.",
    'Instagram Worthy': "Transform this photo into an Instagram-optimized content analysis image. Apply warm golden hour filter with perfect color grading. Add a semi-transparent overlay showing 'IG Score: 92/100' with metrics for Aesthetic: 95%, Likability: 91%, Save Rate: 93%, Reach Potential: 89%. Add thin rose gold annotation lines with notes like 'Feed-worthy composition' and 'High save potential'. Elegant rose gold and white Instagram aesthetic.",
    'YouTube Thumbnail': "Transform this photo into a YouTube thumbnail analysis image. Make it eye-catching with high contrast, saturated colors, and dramatic expression enhancement. Add a semi-transparent overlay showing 'CTR Score: 95/100' with metrics for Click Appeal: 97%, Curiosity Gap: 94%, Visual Impact: 96%, Thumbnail Rank: 93%. Add bold red and white annotation lines with notes like 'Maximum click appeal' and 'Strong curiosity trigger'. YouTube red and white bold infographic style.",
    'Twitter/X Viral': "Transform this photo into a Twitter/X viral content analysis image. Apply a slightly edgy meme-friendly filter. Add a semi-transparent overlay showing 'Repost Score: 91/100' with metrics for Shareability: 94%, Quote Potential: 89%, Ratio Risk: Low, Engagement: 92%. Add thin blue annotation lines with notes like 'High repost potential' and 'Quote tweet magnet'. Twitter blue and dark theme infographic style.",
    'LinkedIn Pro': "Transform this photo into a LinkedIn professional viral content analysis. Apply polished professional lighting and corporate-friendly color grading. Add a semi-transparent overlay showing 'Authority Score: 93/100' with metrics for Professionalism: 96%, Thought Leader: 91%, Connection Rate: 94%, Impression: 92%. Add thin navy blue annotation lines with notes like 'Executive presence' and 'Authority positioning'. LinkedIn navy and white professional infographic.",
    'Clickbait King': "Transform this photo into an extreme clickbait analysis image. Enhance with over-the-top dramatic lighting, exaggerated expression, and attention-grabbing visual effects. Add a semi-transparent overlay showing 'Clickbait Score: 98/100' with metrics for Shock Value: 99%, FOMO Trigger: 97%, Curiosity: 98%, Click Rate: 96%. Add bold yellow and red annotation lines with notes like 'MAXIMUM SHOCK VALUE' and 'Impossible to ignore'. Tabloid-style yellow and red bold infographic.",
    'Aesthetic Feed': "Transform this photo into a curated aesthetic feed analysis image. Apply soft pastel color grading with dreamy film-like tones. Add a semi-transparent overlay showing 'Aesthetic Score: 95/100' with metrics for Visual Harmony: 97%, Color Palette: 94%, Mood: 96%, Feed Cohesion: 93%. Add thin lavender annotation lines with notes like 'Perfect color harmony' and 'Dreamy mood lighting'. Soft pastel lavender and cream aesthetic infographic.",
    'Trending Meme': "Transform this photo into a trending meme format analysis image. Apply meme-style enhancement with bold white impact font text overlay. Add a semi-transparent overlay showing 'Meme Score: 93/100' with metrics for Relatability: 96%, Template Fit: 91%, Share Factor: 94%, Comment Bait: 92%. Add bold white annotation lines with notes like 'Highly relatable format' and 'Peak meme potential'. Meme-style white and black bold infographic with humor.",
  };

  return viralityMap[presetName] || `Transform this photo into a ${presetName} viral content analysis image with a score overlay and engagement metrics.`;
}

function buildAlterEgoTransformPrompt(preset: BasePreset): string {
  const alterEgoMap: Record<string, string> = {
    'Vogue Editorial': "Transform this person into a high-fashion Vogue magazine editorial cover star. Apply flawless professional makeup with dramatic smokey eyes and sculpted cheekbones. Style hair in a sleek editorial updo. Dress in a couture designer outfit with structured shoulders. Add professional studio lighting with dramatic shadows. Luxurious fashion photography aesthetic. Keep the same person's face recognizable.",
    'Greek God': "Transform this person into a Greek god or goddess from classical mythology. Drape them in flowing white and gold ancient Greek robes and toga. Add a golden laurel crown on their head. Apply ethereal glowing skin with soft golden light. Set against a marble temple background with columns and blue sky. Classical sculpture aesthetic. Keep the same person's face recognizable.",
    '90s Supermodel': "Transform this person into an iconic 1990s runway supermodel. Style with bold defined eyebrows, natural glowing skin, nude glossy lips. Add voluminous blow-dried hair. Dress in a minimalist 90s slip dress or power blazer. Clean studio backdrop with warm golden lighting. 90s fashion photography aesthetic with slight film grain. Keep the same person's face recognizable.",
    'Old Hollywood': "Transform this person into a glamorous Old Hollywood movie star from the 1940s-1950s. Apply classic red lips, winged eyeliner, and porcelain skin. Style hair in elegant vintage finger waves or soft curls. Dress in a sophisticated black evening gown with diamonds. Black and white portrait with dramatic chiaroscuro lighting. Golden age cinema aesthetic. Keep the same person's face recognizable.",
    '80s Pop Icon': "Transform this person into a bold 1980s pop music icon. Apply vibrant neon makeup with bright eyeshadow and bold blush. Style hair in a big teased voluminous hairstyle with hairspray. Dress in a flashy sequined jacket with shoulder pads and statement jewelry. Add neon pink and blue lighting with MTV-era stage background. 80s glam rock aesthetic. Keep the same person's face recognizable.",
    'Vampire': "Transform this person into an elegant aristocratic vampire. Apply pale porcelain skin, dark smokey eyes with deep red accents, blood-red lips. Style hair in sleek dark flowing locks. Dress in a luxurious Victorian gothic black velvet outfit with lace collar. Set in a dark candlelit castle interior with gothic arched windows. Cinematic dark romance aesthetic with moody shadows. Keep the same person's face recognizable.",
    'Cyberpunk': "Transform this person into a cyberpunk character from a futuristic dystopia. Add glowing neon circuit tattoos on skin, cybernetic implants near the temple. Apply futuristic makeup with neon blue and purple accents. Style with an edgy asymmetric haircut with neon-colored streaks. Dress in a high-tech leather jacket with LED strips. Set against a rain-soaked neon cityscape background. Blade Runner aesthetic. Keep the same person's face recognizable.",
    'Renaissance Portrait': "Transform this person into a subject of a Renaissance oil painting portrait. Apply soft luminous skin in the style of Vermeer or Raphael. Style hair in an elaborate braided arrangement with pearls woven in. Dress in ornate rich velvet and silk Renaissance clothing with gold embroidery and a jeweled necklace. Painted in classical oil painting style with warm Baroque lighting and dark background. Old master painting aesthetic. Keep the same person's face recognizable.",
  };

  return alterEgoMap[preset.name] || `Transform this person into a ${preset.name} alter ego. Keep the same person's face recognizable.`;
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

function buildHugTransformPrompt(preset: BasePreset): string {
  const hugMap: Record<string, string> = {
    'Warm Embrace': 'Transform this image to show the subject in a warm, heartfelt embrace with another person. Both people have their arms gently wrapped around each other, faces close together with genuine smiles. Natural, tender moment. Keep the subject\'s identity and clothing.',
    'Bear Hug': 'Transform this image to show the subject being swept up in a big, tight bear hug by another person. Arms wrapped firmly around each other, lifted slightly, joyful expression. Energetic and loving. Keep the subject\'s identity and clothing.',
    'Side Hug': 'Transform this image to show the subject in a casual side hug with another person. One arm around each other\'s shoulder, standing side by side, both smiling naturally. Friendly and comfortable. Keep the subject\'s identity and clothing.',
    'Back Hug': 'Transform this image to show the subject being hugged from behind by another person. Arms wrapped around the waist from behind, both looking content and happy. Intimate and protective. Keep the subject\'s identity and clothing.',
    'Romantic': 'Transform this image to show the subject in a romantic, loving embrace with a partner. Foreheads touching or close together, gentle hold, soft loving expressions. Romantic and intimate atmosphere. Keep the subject\'s identity and clothing.',
    'Group Hug': 'Transform this image to show the subject in a cheerful group hug with 2-3 other people. Everyone has arms around each other, laughing and smiling. Warm, joyful group moment. Keep the subject\'s identity and clothing.',
    'Playful': 'Transform this image to show the subject in a playful, fun hug with another person. Laughing, maybe being spun around or squeezed tightly with exaggerated joy. Energetic and happy. Keep the subject\'s identity and clothing.',
    'Comforting': 'Transform this image to show the subject being held in a comforting, soothing embrace by another person. Gentle arms around shoulders, head resting on the other\'s shoulder. Tender and supportive. Keep the subject\'s identity and clothing.',
  };

  return hugMap[preset.name] || `Transform this image to show the subject in a ${preset.name} style hug with another person. Keep the subject's identity and clothing.`;
}

function buildSmileFilterTransformPrompt(preset: BasePreset): string {
  const smileMap: Record<string, string> = {
    'Natural Smile': 'Add a natural, genuine Duchenne smile to this person. Slight upturned corners of the mouth, gentle crinkle around the eyes, relaxed cheeks. The smile should look effortless and authentic. Keep the same identity and features.',
    'Big Grin': 'Transform this person to have a big, wide grin showing all teeth. Mouth open wide in a joyful expression, cheeks raised high, eyes squinting with happiness. Enthusiastic and infectious smile. Keep the same identity and features.',
    'Subtle Smirk': 'Add a subtle, asymmetric smirk to this person. One corner of the mouth slightly raised, knowing expression, hint of amusement. Mysterious and confident. Keep the same identity and features.',
    'Closed Lip': 'Add a warm closed-lip smile to this person. Lips pressed together gently curving upward, soft expression, pleasant and polite. No teeth showing. Keep the same identity and features.',
    'Teeth Showing': 'Add a bright teeth-showing smile to this person. Upper teeth visible, lips parted naturally, cheerful and photogenic expression. Classic portrait smile. Keep the same identity and features.',
    'Dimple Smile': 'Add a charming dimple smile to this person. Visible dimples on both cheeks, sweet genuine smile, warm eyes. The dimples should be prominent and natural-looking. Keep the same identity and features.',
    'Shy Smile': 'Add a shy, bashful smile to this person. Slight downward tilt of the head, small modest smile, gentle and reserved expression, hint of blush on cheeks. Endearing and demure. Keep the same identity and features.',
    'Confident Smile': 'Add a strong, confident smile to this person. Broad balanced smile, direct eye contact, raised chin, self-assured and commanding expression. Professional and poised. Keep the same identity and features.',
  };

  return smileMap[preset.name] || `Add a ${preset.name} expression to this person. Keep the same identity and features.`;
}

function buildSkinColorTransformPrompt(preset: BasePreset): string {
  const skinColorMap: Record<string, string> = {
    'Fair': 'Transform this person\'s skin to a fair, light complexion with cool pink undertones. Very light skin that appears naturally pale. Maintain natural skin texture, freckles if present, and all facial features. Keep the same identity, expression, hair, and clothing.',
    'Light': 'Transform this person\'s skin to a light complexion with warm peachy undertones. Light skin with a subtle warm glow. Maintain natural skin texture and all facial features. Keep the same identity, expression, hair, and clothing.',
    'Medium': 'Transform this person\'s skin to a medium olive complexion with neutral warm undertones. Mediterranean or mixed-heritage skin tone. Maintain natural skin texture and all facial features. Keep the same identity, expression, hair, and clothing.',
    'Tan': 'Transform this person\'s skin to a sun-kissed golden tan complexion. Warm bronzed skin as if naturally tanned. Maintain natural skin texture and all facial features. Keep the same identity, expression, hair, and clothing.',
    'Caramel': 'Transform this person\'s skin to a warm caramel brown complexion with golden undertones. Rich warm brown skin tone. Maintain natural skin texture and all facial features. Keep the same identity, expression, hair, and clothing.',
    'Brown': 'Transform this person\'s skin to a medium-dark brown complexion with warm undertones. Natural brown skin tone. Maintain natural skin texture and all facial features. Keep the same identity, expression, hair, and clothing.',
    'Dark Brown': 'Transform this person\'s skin to a rich dark brown complexion with deep warm undertones. Deep brown skin with natural radiance. Maintain natural skin texture and all facial features. Keep the same identity, expression, hair, and clothing.',
    'Deep': 'Transform this person\'s skin to a very deep, dark complexion with cool blue-black undertones. Very dark skin with natural sheen and highlights. Maintain natural skin texture and all facial features. Keep the same identity, expression, hair, and clothing.',
    'Porcelain': 'Transform this person\'s skin to an ultra-fair porcelain complexion. Very pale, luminous, almost translucent-looking skin with minimal undertones. Flawless and doll-like. Maintain all facial features. Keep the same identity, expression, hair, and clothing.',
  };

  return skinColorMap[preset.name] || `Transform this person's skin to a ${preset.name} complexion. Keep the same identity, expression, hair, and clothing.`;
}

function buildEyeColorTransformPrompt(preset: BasePreset): string {
  const eyeColorMap: Record<string, string> = {
    'Blue': 'Change this person\'s eye color to a vivid bright blue. Clear blue irises with natural light reflections, visible pupil, realistic iris texture. Keep everything else identical — same face, skin, expression, hair, clothing, background.',
    'Green': 'Change this person\'s eye color to a rich emerald green. Vivid green irises with natural light reflections, visible pupil, realistic iris texture and patterns. Keep everything else identical.',
    'Brown': 'Change this person\'s eye color to a warm natural brown. Rich brown irises with golden flecks, natural light reflections, realistic depth. Keep everything else identical.',
    'Hazel': 'Change this person\'s eye color to hazel — a mix of green and golden brown. Multi-toned irises with green outer ring and golden brown center, natural light reflections. Keep everything else identical.',
    'Gray': 'Change this person\'s eye color to a cool silver-gray. Pale gray irises with subtle blue undertones, natural light reflections, striking and distinctive. Keep everything else identical.',
    'Amber': 'Change this person\'s eye color to a warm golden amber. Striking amber-gold irises with honey-like warmth, natural light reflections, wolf-like appearance. Keep everything else identical.',
    'Violet': 'Change this person\'s eye color to a striking violet-purple. Deep purple irises with natural light reflections, vivid and unique color. Keep everything else identical.',
    'Honey': 'Change this person\'s eye color to a light honey golden-brown. Warm translucent honey-colored irises with golden highlights, natural light reflections. Keep everything else identical.',
    'Ice Blue': 'Change this person\'s eye color to a pale icy light blue. Very light, almost white-blue irises with crystalline clarity, natural light reflections. Striking and piercing. Keep everything else identical.',
    'Dark Brown': 'Change this person\'s eye color to a deep dark brown, almost black. Very dark brown irises with barely visible iris patterns, natural light reflections. Keep everything else identical.',
  };

  return eyeColorMap[preset.name] || `Change this person's eye color to ${preset.name}. Keep everything else identical.`;
}

function buildPhotoToSketchTransformPrompt(preset: BasePreset): string {
  const sketchMap: Record<string, string> = {
    'Pencil Sketch': 'Convert this photo into a realistic graphite pencil sketch drawing on white paper. Use detailed pencil strokes with natural shading, hatching, and cross-hatching techniques. Show visible pencil texture and paper grain. The result should look like a hand-drawn pencil artwork. Keep composition identical.',
    'Line Drawing': 'Convert this photo into a clean, minimal line drawing. Use thin, precise continuous lines with minimal shading. Focus on contours and outlines, capturing essential features with elegant simplicity. Black lines on white background. Keep composition identical.',
    'Ink Art': 'Convert this photo into a bold ink brush artwork. Use expressive black ink strokes with varying thickness, splatter effects, and dynamic brush marks. Mix of fine detail lines and bold sweeping strokes. Traditional ink wash painting feel. Keep composition identical.',
    'Charcoal': 'Convert this photo into a dramatic charcoal drawing on textured paper. Use rich dark charcoal tones with smudged blending, deep shadows, and bright highlights. Visible charcoal texture and grain. Moody, atmospheric quality. Keep composition identical.',
    'Pastel Drawing': 'Convert this photo into a soft pastel color drawing. Use gentle, blended pastel colors with a powdery texture, soft edges, and dreamy quality. Warm, muted tones with visible pastel strokes on textured paper. Keep composition identical.',
    'Colored Pencil': 'Convert this photo into a vibrant colored pencil artwork. Use visible colored pencil strokes with layered colors, cross-hatching technique, and rich saturated hues. Detailed and precise with a hand-crafted quality. Keep composition identical.',
    'Watercolor': 'Convert this photo into a flowing watercolor painting. Use transparent washes of color with soft edges, gentle color bleeding, wet-on-wet effects, and visible paper texture. Light, airy, and luminous quality. Keep composition identical.',
    'Oil Painting': 'Convert this photo into a rich oil painting. Use thick, visible brushstrokes with impasto technique, rich saturated colors, dramatic lighting, and a textured canvas feel. Classical painting quality with depth and dimension. Keep composition identical.',
  };

  return sketchMap[preset.name] || `Convert this photo into a ${preset.name} artwork. Keep composition identical.`;
}

function buildOpenEyesTransformPrompt(preset: BasePreset): string {
  const eyeMap: Record<string, string> = {
    'Natural Open': 'Open this person\'s eyes to a natural, relaxed open position. Eyes should look naturally open as in a normal portrait, with a calm and comfortable gaze. Natural eye shape and size, realistic iris and pupil. Keep everything else identical.',
    'Wide Awake': 'Open this person\'s eyes wide, fully alert and awake. Eyes should be noticeably wide open with white visible around the iris, creating an energized and attentive look. Keep everything else identical.',
    'Bright Eyes': 'Open this person\'s eyes with bright, vibrant, well-lit appearance. Eyes should be naturally open with enhanced brightness, vivid iris color, and strong catchlights that make the eyes look luminous and alive. Keep everything else identical.',
    'Gentle Gaze': 'Open this person\'s eyes with a soft, gentle, relaxed gaze. Eyes should be comfortably open with a warm, kind expression. Slightly relaxed eyelids creating a serene and approachable look. Keep everything else identical.',
    'Confident Look': 'Open this person\'s eyes with a strong, confident, direct stare. Eyes should be firmly open with an intense, focused gaze looking straight at the camera. Conveying determination and self-assurance. Keep everything else identical.',
    'Doe Eyes': 'Open this person\'s eyes to appear large, round, and innocent-looking. Eyes should be wide and rounded with enlarged iris appearance, creating a youthful, doe-eyed effect. Sweet and endearing expression. Keep everything else identical.',
    'Sleepy Fix': 'Subtly fix this person\'s half-closed or drowsy eyes. Open them just slightly more to look naturally awake but still relaxed, as if they just woke up pleasantly. Minimal change, very natural correction. Keep everything else identical.',
    'Sparkling': 'Open this person\'s eyes with bright sparkle and catchlights. Eyes should be naturally open with enhanced specular highlights, giving a dazzling, sparkling appearance. Eyes should look lively and captivating with multiple catchlight reflections. Keep everything else identical.',
  };

  return eyeMap[preset.name] || `Open this person's eyes in a ${preset.name} style. Keep everything else identical.`;
}

function buildPetPortraitTransformPrompt(preset: BasePreset): string {
  const styleMap: Record<string, string> = {
    'Oil Painting': 'Transform this pet photo into a classic oil painting portrait. Rich textured brush strokes, warm color palette with deep shadows and golden highlights, traditional canvas texture visible. Impasto technique with thick paint layers. Classical portrait composition, dramatic lighting reminiscent of Old Masters paintings. Preserve the pet\'s distinctive features and expression.',
    'Watercolor': 'Transform this pet photo into a delicate watercolor painting. Soft translucent washes of color blending into each other, visible paper texture, gentle color bleeds at edges. Light and airy feel with white paper showing through. Subtle wet-on-wet technique with flowing organic shapes. Preserve the pet\'s distinctive features and expression.',
    'Disney Style': 'Transform this pet photo into a Disney/Pixar 3D animated character. Large expressive glossy eyes, smooth stylized fur, vivid saturated colors, warm soft lighting. Cute and endearing character design with exaggerated adorable features. High-quality 3D render, Disney animation studio quality. Preserve the pet\'s distinctive features.',
    'Studio Ghibli': 'Transform this pet photo into a Studio Ghibli hand-drawn anime style illustration. Soft pastel colors, gentle watercolor-like rendering, delicate line work. Warm natural lighting, dreamy atmospheric quality typical of Hayao Miyazaki films. Hand-painted feel with visible brush texture. Preserve the pet\'s distinctive features.',
    'Royal Portrait': 'Transform this pet photo into a regal royal portrait. Dress the pet in ornate royal costume with crown, jewels, medals, and rich velvet robes. Classical portrait painting style with dramatic lighting, dark rich background with gold accents. Noble dignified pose, Renaissance royal court aesthetic. Preserve the pet\'s face and expression.',
    'Pop Art': 'Transform this pet photo into Andy Warhol-inspired pop art. Bold flat areas of bright neon saturated colors, strong black outlines, high contrast, screen-print aesthetic. Vibrant color blocks with halftone dot patterns. Graphic and stylized with a fun, iconic pop culture feel. Preserve the pet\'s distinctive features.',
    'Pencil Sketch': 'Transform this pet photo into a detailed pencil sketch drawing. Fine graphite lines with careful cross-hatching for shading, visible paper texture, range from light delicate strokes to dark bold lines. Realistic proportions with artistic hand-drawn quality. Monochrome graphite on white paper. Preserve the pet\'s distinctive features.',
    'Renaissance': 'Transform this pet photo into a Renaissance masterpiece painting. Rich oil paint colors, chiaroscuro lighting with dramatic shadows, classical composition. Style of Leonardo da Vinci or Raphael with sfumato technique, warm earth tones, and masterful light rendering. Museum-quality fine art portrait. Preserve the pet\'s distinctive features.',
  };

  return styleMap[preset.name] || `Transform this pet photo into a ${preset.name} artistic style portrait. Preserve the pet's distinctive features and expression.`;
}

function buildPerlerBeadTransformPrompt(preset: BasePreset): string {
  const beadMap: Record<string, string> = {
    'Classic Grid': 'Convert this photo into a classic perler bead pattern. Create a visible grid of small circular beads arranged in neat rows and columns. Each bead is a single solid color, faithfully reproducing the original image colors. Clear grid lines between beads, uniform bead size, realistic plastic bead texture. The pattern should look like an actual perler bead craft project on a pegboard.',
    'Mini Beads': 'Convert this photo into a high-resolution mini perler bead pattern. Use very small, fine-detail beads for maximum image resolution and detail. Tiny circular beads in a dense grid pattern, allowing for smoother color transitions and finer details. Realistic mini bead texture, tight grid spacing.',
    'Pastel Palette': 'Convert this photo into a perler bead pattern using only soft pastel colors. Light pink, baby blue, mint green, lavender, peach, cream, soft yellow beads. Visible circular bead grid pattern, gentle and dreamy color palette. Each bead is a single pastel shade.',
    'Neon Glow': 'Convert this photo into a perler bead pattern using bright neon and fluorescent colors. Hot pink, electric blue, lime green, bright orange, vivid yellow, neon purple beads. Visible circular bead grid, vibrant and eye-catching. Each bead glows with intense saturated color against a dark background.',
    'Monochrome': 'Convert this photo into a monochrome perler bead pattern using only black, white, and shades of gray beads. Visible circular bead grid, high contrast grayscale pixel art. Each bead is a single shade from pure white to pure black.',
    'Earth Tones': 'Convert this photo into a perler bead pattern using natural earth tone colors. Terracotta, olive green, brown, tan, rust, cream, forest green, burnt sienna beads. Visible circular bead grid with warm, natural color palette.',
    'Rainbow': 'Convert this photo into a perler bead pattern using full rainbow spectrum colors. Vibrant red, orange, yellow, green, blue, indigo, violet beads. Visible circular bead grid, colorful and joyful. Each bead is a bright, saturated rainbow shade.',
    'Vintage': 'Convert this photo into a perler bead pattern using muted vintage retro colors. Dusty rose, sage green, mustard yellow, faded denim blue, burnt orange, cream, mauve beads. Visible circular bead grid with nostalgic, retro color palette.',
  };

  return beadMap[preset.name] || `Convert this photo into a perler bead pattern in ${preset.name} style. Show individual circular beads in a grid pattern.`;
}

function buildPunchHoleTransformPrompt(preset: BasePreset): string {
  const punchHoleMap: Record<string, string> = {
    'Circle Cutout': 'Transform this photo into a creative punch hole effect composition. Place the subject\'s portrait inside a large circular cutout in the center. The surrounding area should be a solid pastel blue overlay layer. The circular hole should have clean crisp edges revealing the original photo underneath. Scrapbook-style layered design with subtle shadow around the cutout edge.',
    'Heart Cutout': 'Transform this photo into a punch hole effect with a large heart-shaped cutout in the center. The photo is revealed through the heart shape. The surrounding overlay layer should be soft pink color. Clean crisp edges on the heart cutout with a slight drop shadow. Romantic scrapbook aesthetic, layered paper design.',
    'Star Cutout': 'Transform this photo into a punch hole effect with a large five-pointed star cutout in the center. The photo is visible through the star shape. The overlay surrounding area uses a gradient from warm orange to golden yellow. Sharp clean edges on the star cutout with dimensional shadow effect. Creative collage style.',
    'Diamond Cutout': 'Transform this photo into a punch hole effect with a large diamond/rhombus shaped cutout rotated 45 degrees in the center. The photo shows through the diamond shape. The surrounding overlay is a deep navy blue solid color. Clean geometric edges with subtle shadow. Minimalist modern design aesthetic.',
    'Multi Holes': 'Transform this photo into a creative multi-hole punch effect. Create 5-7 smaller circular cutouts scattered across the image at different sizes, each revealing portions of the original photo underneath. The overlay layer should be a mint green solid color. Each hole has clean edges with subtle shadows. Playful scrapbook collage aesthetic.',
    'Stripe Overlay': 'Transform this photo into a punch hole effect with horizontal striped overlay pattern. Alternating stripes of white and coral pink cover the image, with a large circular cutout in the center revealing the full photo. The stripes should be evenly spaced and the cutout has clean edges. Trendy modern layered design.',
    'Torn Paper': 'Transform this photo into a torn paper punch hole effect. Create an irregular torn paper edge revealing the photo underneath, as if a white paper layer has been ripped away from the center. The torn edges should look realistic with slight curling and shadow. The paper overlay is white with subtle texture. Artistic mixed media collage style.',
    'Polaroid Frame': 'Transform this photo into a Polaroid-style punch hole frame effect. Place the subject inside a white Polaroid-style rectangular frame with wider bottom border. The background behind the Polaroid is a soft lavender color. The frame has realistic paper texture and slight shadow. Vintage instant camera aesthetic, clean and nostalgic.',
  };

  return punchHoleMap[preset.name] || `Transform this photo into a ${preset.name} punch hole effect. Keep composition identical.`;
}

function buildTattooTransformPrompt(preset: BasePreset): string {
  const tattooMap: Record<string, string> = {
    'Minimalist': 'Add a minimalist tattoo design on the person\'s upper arm. Clean thin black lines, simple geometric shapes and small symbols. Delicate minimal aesthetic with subtle placement. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.',
    'Traditional': 'Add a traditional American style tattoo on the person\'s upper arm. Bold black outlines, limited color palette with red, green, yellow and blue fills. Classic old school tattoo motifs like roses, anchors, or eagles. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.',
    'Realism': 'Add a photorealistic tattoo design on the person\'s upper arm. Highly detailed shading and depth creating a 3D lifelike appearance. Could be a portrait, animal, or nature scene with incredible detail. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.',
    'Blackwork': 'Add a bold blackwork tattoo on the person\'s upper arm. Heavy solid black ink fill with tribal or geometric patterns. Dense dark coverage with negative space creating intricate designs. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.',
    'Watercolor': 'Add a watercolor style tattoo on the person\'s upper arm. Soft color splashes and painterly brushstroke effects with no hard outlines. Vibrant flowing colors bleeding naturally like watercolor paint on paper. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.',
    'Japanese': 'Add a Japanese irezumi style tattoo on the person\'s upper arm. Traditional Japanese motifs like koi fish, dragons, waves, or cherry blossoms. Bold outlines with rich colors and flowing composition following the body contour. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.',
    'Geometric': 'Add a geometric tattoo design on the person\'s upper arm. Sacred geometry patterns, mandalas, or precise symmetrical shapes. Clean precise lines forming complex mathematical patterns. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.',
    'Fine Line': 'Add a fine line tattoo on the person\'s upper arm. Extremely delicate thin single-needle lines creating detailed micro tattoo designs. Intricate small-scale artwork with precise linework. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.',
  };

  return tattooMap[preset.name] || `Add a ${preset.name} style tattoo on the person's upper arm. The tattoo should look realistic as if freshly inked on skin. Keep the rest of the photo unchanged.`;
}

function buildMemeTransformPrompt(preset: BasePreset): string {
  const memeMap: Record<string, string> = {
    'Classic Meme': "Transform this photo into a classic internet meme format. Add large bold white Impact font text with thick black outlines at the top and bottom of the image. Top text says 'WHEN YOU REALIZE' and bottom text says 'IT WAS ALL A DREAM'. Classic meme layout with the photo as background. Iconic internet meme aesthetic.",
    'Deep Fried': 'Transform this photo into a deep fried meme style. Extremely over-saturated colors, heavy JPEG compression artifacts, excessive brightness and contrast. Add random crying laughing emojis, lens flares, and red eye glow effects scattered across the image. Grainy distorted deep fried meme aesthetic with nuclear color intensity.',
    'Drakeposting': 'Transform this photo into a Drake meme style split panel layout. Create two panels stacked vertically. Top panel shows the person with a dismissive disapproving gesture with a red X overlay. Bottom panel shows the same person with an approving pointing gesture with a green check overlay. Classic Drake meme format with clean panel borders.',
    'Distracted BF': 'Transform this photo into an exaggerated distracted boyfriend meme style. Add dramatic comic-style reaction effects with exaggerated wide eyes and shocked expression. Add motion blur lines, dramatic lighting, and comedic emphasis arrows pointing at the subject. Over-the-top dramatic meme reaction aesthetic.',
    'Wojak': 'Transform this photo into a Wojak meme illustration style. Convert the person into a simple line-drawn Wojak face with minimal detail. Black outline on white background, characteristic Wojak features with simple dot eyes and basic expression lines. Clean internet meme illustration style similar to the classic Wojak/Feels Guy format.',
    'Cursed Image': 'Transform this photo into a cursed image meme style. Apply dark eerie low-quality aesthetic with heavy noise, motion blur, and unsettling color grading. Greenish dark tint, VHS-like scan lines, low resolution distortion. Creepy unsettling cursed image aesthetic that looks like it was captured on a 2005 flip phone at 3am.',
    'Wholesome': 'Transform this photo into a wholesome meme style. Apply soft warm pastel color filter with gentle glow. Add cute sparkle effects, small floating hearts, and a subtle rainbow light leak overlay. Warm golden soft lighting with dreamy wholesome aesthetic. The overall mood should feel cozy, heartwarming, and pure.',
    'Comic Panel': "Transform this photo into a comic book panel style meme. Apply bold black outlines, halftone dot pattern shading, and vibrant pop art colors. Add a speech bubble with 'OMG!' text and comic-style action lines radiating from the subject. Bold comic book aesthetic with Ben-Day dots and dramatic composition.",
  };

  return memeMap[preset.name] || `Transform this photo into a ${preset.name} meme style.`;
}

function buildFaceAnimatorTransformPrompt(preset: BasePreset): string {
  const faceAnimatorMap: Record<string, string> = {
    'Big Smile': 'Transform this person\'s expression to a wide natural happy smile showing teeth, eyes slightly squinting with joy, raised cheeks. Keep everything else the same.',
    'Surprised': 'Transform this person\'s expression to look extremely surprised with eyes wide open, raised eyebrows high, mouth open in shock. Keep everything else the same.',
    'Winking': 'Transform this person\'s expression to a playful wink with one eye closed, slight smirk on lips, flirty confident look. Keep everything else the same.',
    'Laughing': 'Transform this person\'s expression to hearty open-mouth laughter, eyes squinting, cheeks raised high, genuine belly laugh expression. Keep everything else the same.',
    'Angry': 'Transform this person\'s expression to look angry with deeply furrowed brows, intense glaring eyes, clenched jaw, tense facial muscles. Keep everything else the same.',
    'Sad': 'Transform this person\'s expression to look deeply sad with downturned mouth corners, sorrowful teary eyes, drooping eyebrows, melancholy expression. Keep everything else the same.',
    'Singing': 'Transform this person\'s expression to look like they are singing passionately with mouth wide open mid-song, expressive face, dramatic vocal expression. Keep everything else the same.',
    'Pouting': 'Transform this person\'s expression to a cute pouty duck-face with pushed out lips, slightly squished cheeks, playful exaggerated pout. Keep everything else the same.',
  };

  return faceAnimatorMap[preset.name] || `Transform this person's expression to a ${preset.name} expression. Keep everything else the same.`;
}

function buildGlowUpTestTransformPrompt(preset: BasePreset): string {
  const glowUpMap: Record<string, string> = {
    'Overall Glow Up': "Transform this portrait into a professional AI beauty analysis result image. Enhance the person's appearance with flawless glowing skin, perfect lighting, and subtle makeup. Add a semi-transparent dark overlay panel on the left side showing 'Glow Up Potential Score: 92/100' at the top, with score bars for Skin: 95%, Facial Structure: 88%, Styling Potential: 94%, Expression Energy: 90%. Add thin golden annotation lines from facial features to short text descriptions. Modern sleek infographic aesthetic with gold and white text on dark overlay.",
    'Skin Analysis': "Transform this portrait into an AI skin analysis result image. Enhance the skin to look flawless and radiant with perfect clarity. Add a semi-transparent overlay panel showing 'Skin Analysis Score: 94/100' with detailed score bars for Clarity: 96%, Texture: 92%, Radiance: 95%, Evenness: 93%. Add thin annotation lines pointing to skin areas with analysis notes like 'High skin clarity' and 'Even skin tone'. Clean medical-aesthetic infographic style with teal and white text.",
    'Facial Structure': "Transform this portrait into an AI facial structure analysis result image. Enhance facial features to look perfectly sculpted with defined cheekbones and jawline. Add a semi-transparent overlay showing 'Facial Structure Score: 91/100' with score bars for Symmetry: 93%, Proportions: 89%, Jawline: 92%, Cheekbones: 90%. Add thin geometric annotation lines highlighting facial landmarks and bone structure points. Clean clinical infographic style with blue and white text.",
    'Celebrity Glow': "Transform this portrait into a Hollywood celebrity glow-up analysis image. Apply glamorous red carpet level enhancement with perfect skin, dramatic eyes, and styled hair. Add a semi-transparent overlay showing 'Celebrity Glow Score: 96/100' with score bars for Star Quality: 97%, Glamour: 95%, Photogenic: 96%, Style: 94%. Add golden annotation lines pointing to features with notes like 'Red carpet ready eyes' and 'Camera-perfect angles'. Luxurious gold and black infographic aesthetic.",
    'K-Beauty Glow': "Transform this portrait into a K-beauty analysis result image. Apply Korean beauty glass skin effect with dewy luminous skin, soft gradient lips, and subtle eye enhancement. Add a semi-transparent overlay showing 'K-Beauty Score: 93/100' with score bars for Glass Skin: 96%, Dewy Glow: 94%, Softness: 92%, Luminosity: 91%. Add thin pastel pink annotation lines with notes like 'Glass skin texture' and 'Natural dewy finish'. Soft pink and white Korean aesthetic infographic.",
    'Natural Beauty': "Transform this portrait into a natural beauty analysis result image. Apply minimal subtle enhancement preserving natural features with clean clear skin and bright eyes. Add a semi-transparent overlay showing 'Natural Beauty Score: 90/100' with score bars for Authenticity: 95%, Skin Health: 88%, Natural Glow: 91%, Confidence: 89%. Add thin green annotation lines with notes like 'Naturally radiant complexion'. Clean organic green and white infographic style.",
    'Red Carpet': "Transform this portrait into a red carpet glamour analysis image. Apply full glamorous transformation with dramatic smokey eyes, contoured cheeks, and perfect styling. Add a semi-transparent overlay showing 'Red Carpet Score: 95/100' with score bars for Glamour: 97%, Elegance: 94%, Drama: 93%, Impact: 96%. Add thin silver annotation lines with notes like 'High-impact eye definition' and 'Sculpted contours'. Luxurious silver and black infographic aesthetic.",
    'Fresh & Youthful': "Transform this portrait into a fresh and youthful beauty analysis image. Apply youthful enhancement with bright dewy skin, rosy cheeks, and sparkling eyes. Add a semi-transparent overlay showing 'Youth & Vitality Score: 94/100' with score bars for Freshness: 96%, Vitality: 93%, Radiance: 95%, Energy: 92%. Add thin light blue annotation lines with notes like 'Youthful skin elasticity' and 'Vibrant energy glow'. Fresh bright blue and white infographic style.",
  };

  return glowUpMap[preset.name] || `Transform this portrait into a ${preset.name} AI beauty analysis result image with score overlay panel, annotation lines, and infographic style metrics.`;
}

function buildOutfitChangeTransformPrompt(preset: BasePreset): string {
  const outfitMap: Record<string, string> = {
    'Business Formal': "Change this person's outfit to a professional business formal look. Replace clothing with a tailored dark navy blazer over a crisp white dress shirt, fitted charcoal dress pants, and polished black leather shoes. Add a thin leather belt. Keep the same person, face, hair, and pose exactly the same. Photorealistic fashion photography.",
    'Streetwear': "Change this person's outfit to trendy streetwear style. Replace clothing with an oversized graphic hoodie in gray, baggy cargo pants, chunky white sneakers, and a baseball cap worn backwards. Add a crossbody bag. Keep the same person, face, hair, and pose exactly the same. Photorealistic street fashion photography.",
    'Elegant Evening': "Change this person's outfit to an elegant evening gown look. Replace clothing with a stunning floor-length black satin evening dress with a subtle side slit, delicate gold jewelry, and strappy heeled sandals. Keep the same person, face, hair, and pose exactly the same. Photorealistic luxury fashion photography.",
    'Athleisure': "Change this person's outfit to sporty athleisure wear. Replace clothing with a fitted crop top sports bra, high-waisted black yoga leggings, a lightweight zip-up track jacket in pastel pink, and white running shoes. Keep the same person, face, hair, and pose exactly the same. Photorealistic activewear photography.",
    'Smart Casual': "Change this person's outfit to a smart casual look. Replace clothing with a well-fitted tan blazer over a relaxed navy blue crew neck t-shirt, slim-fit light wash jeans, and clean white leather sneakers. Add a minimalist watch. Keep the same person, face, hair, and pose exactly the same. Photorealistic fashion photography.",
    'Bohemian': "Change this person's outfit to bohemian style. Replace clothing with a flowing floral maxi skirt, a loose off-shoulder cream blouse, layered gold necklaces, woven sandals, and a wide-brimmed straw hat. Keep the same person, face, hair, and pose exactly the same. Photorealistic boho fashion photography.",
    'Y2K Fashion': "Change this person's outfit to Y2K fashion style. Replace clothing with a colorful butterfly crop top, low-rise flared jeans, chunky platform shoes, tinted sunglasses, and butterfly hair clips. Bright bold colors and early 2000s aesthetic. Keep the same person, face, hair, and pose exactly the same. Photorealistic retro fashion photography.",
    'Korean Fashion': "Change this person's outfit to Korean fashion style. Replace clothing with an oversized soft beige knit sweater, wide-leg cream trousers, minimalist white sneakers, and a small crossbody leather bag. Soft muted color palette, clean minimalist K-fashion aesthetic. Keep the same person, face, hair, and pose exactly the same. Photorealistic Korean street fashion photography.",
  };

  return outfitMap[preset.name] || `Change this person's outfit to ${preset.name} style. Keep the same person, face, hair, and pose exactly the same. Photorealistic fashion photography.`;
}

function buildLogoTransformPrompt(preset: BasePreset): string {
  const logoMap: Record<string, string> = {
    'Minimalist': 'Transform this image into a minimalist logo design. Clean simple lines, flat solid colors, no gradients or shadows. Reduce to essential shapes with maximum negative space. Professional corporate minimalist aesthetic on clean white background.',
    'Vintage Badge': 'Transform this image into a vintage badge logo design. Circular or shield emblem frame with ornate borders and banner ribbons. Retro typography style, distressed texture, classic color palette of dark brown, cream, and gold. Old-school badge emblem aesthetic on white background.',
    'Gradient Modern': 'Transform this image into a modern gradient logo design. Smooth flowing gradients with vibrant contemporary colors transitioning from purple to blue to teal. Sleek modern shapes with clean edges. Professional tech startup aesthetic on white background.',
    'Monogram': 'Transform this image into an elegant monogram logo design. Stylized interlocking letters or initials with sophisticated serif or script typography. Luxurious gold or black color scheme with refined elegant details. Premium brand monogram aesthetic on white background.',
    'Mascot': 'Transform this image into a mascot logo design. Friendly illustrated character with bold outlines and vibrant colors. Cartoon-style mascot with expressive features and dynamic pose. Fun approachable brand mascot aesthetic on white background.',
    'Geometric': 'Transform this image into a geometric abstract logo design. Clean precise geometric shapes like triangles, hexagons, and circles forming an abstract mark. Bold solid colors with mathematical precision and symmetry. Modern abstract geometric logo aesthetic on white background.',
    'Hand Drawn': 'Transform this image into a hand-drawn artisan logo design. Organic hand-sketched lines with natural imperfections and charming character. Ink pen or brush stroke aesthetic with rustic crafted feel. Artisan handmade brand logo on white background.',
    'Neon': 'Transform this image into a neon sign logo design. Glowing neon tube light effect with bright vibrant colors against a dark background. Electric glow with light bloom and subtle reflections. Retro neon sign aesthetic with hot pink, electric blue, or green glow on dark navy or black background.',
  };

  return logoMap[preset.name] || `Transform this image into a ${preset.name} logo design on white background.`;
}

function buildStickerTransformPrompt(preset: BasePreset): string {
  const stickerMap: Record<string, string> = {
    'Kawaii': 'Transform this photo into a kawaii Japanese sticker style illustration. Cute chibi proportions with oversized head and big sparkly eyes. Soft pastel colors, rounded shapes, and adorable expression. White die-cut sticker border around the character. Clean sticker aesthetic on white background.',
    'Cartoon': 'Transform this photo into a cartoon sticker illustration. Bold black outlines, vibrant flat colors, exaggerated features and expressions. Classic animated cartoon style with clean vector-like rendering. White die-cut sticker border. Clean sticker aesthetic on white background.',
    '3D Puffy': 'Transform this photo into a 3D puffy sticker style. Inflated rounded glossy appearance like a plastic puffy sticker. Shiny reflective surface with soft shadows and volumetric depth. Cute 3D rendered character with smooth surfaces. White die-cut sticker border on white background.',
    'Pixel Art': 'Transform this photo into a pixel art sticker style. Blocky retro 8-bit video game aesthetic with visible square pixels. Limited color palette with crisp pixel edges. Nostalgic retro gaming style character. White die-cut sticker border on white background.',
    'Watercolor': 'Transform this photo into a watercolor sticker illustration. Soft delicate brushstrokes with gentle color washes and natural paint bleeding effects. Light artistic watercolor painting style. Subtle and elegant with pastel tones. White die-cut sticker border on white background.',
    'Flat Design': 'Transform this photo into a flat design sticker illustration. Modern minimalist style with clean geometric shapes, no gradients or shadows. Bold solid colors with simplified forms. Contemporary graphic design aesthetic. White die-cut sticker border on white background.',
    'Doodle': 'Transform this photo into a hand-drawn doodle sticker style. Playful sketchy marker or pen lines with casual imperfect strokes. Fun whimsical doodle aesthetic with loose artistic style. Black ink outlines with optional color fills. White die-cut sticker border on white background.',
    'Emoji': 'Transform this photo into an emoji-style sticker. Round face with exaggerated expressive facial features. Bold simple shapes with bright yellow skin tone and vivid colors. Classic emoji aesthetic with oversized eyes and mouth. White die-cut sticker border on white background.',
  };

  return stickerMap[preset.name] || `Transform this photo into a ${preset.name} sticker style illustration. White die-cut sticker border on white background.`;
}

function buildPersonalColorTransformPrompt(preset: BasePreset): string {
  const colorMap: Record<string, string> = {
    'Spring Warm': `Create a professional personal color analysis report image for this person. Layout: Left side shows the person's photo. Right side shows the analysis report. Title: "Best Season: Spring Warm" with subtitle "Warm, Bright, Clear". Display three horizontal metric bars: Warmth 78/100 (warm orange bar), Contrast 52/100 (medium gray bar), Clarity 75/100 (teal bar). "Best Colors" palette section with 6 color swatches: coral, peach, warm pink, golden yellow, turquoise, warm green — each labeled. "Neutrals" row: ivory, camel, warm beige, light brown swatches. "Accents" row: salmon, tangerine, apple green, light gold swatches. Bottom section: brief styling tip text recommending warm bright colors and gold jewelry. Clean modern infographic layout, white background, professional typography, organized grid sections.`,
    'Spring Light': `Create a professional personal color analysis report image for this person. Layout: Left side shows the person's photo. Right side shows the analysis report. Title: "Best Season: Spring Light" with subtitle "Warm, Light, Delicate". Display three horizontal metric bars: Warmth 68/100, Contrast 28/100, Clarity 62/100. "Best Colors" palette with 6 swatches: light peach, soft coral, butter yellow, mint green, light aqua, blush pink — each labeled. "Neutrals" row: cream, soft taupe, light sand, pale camel. "Accents" row: apricot, light turquoise, soft lavender, champagne gold. Bottom: styling tip recommending soft warm pastels and delicate gold jewelry. Clean modern infographic layout, white background, professional typography.`,
    'Summer Cool': `Create a professional personal color analysis report image for this person. Layout: Left side shows the person's photo. Right side shows the analysis report. Title: "Best Season: Summer Cool" with subtitle "Cool, Soft, Muted". Display three horizontal metric bars: Warmth 25/100, Contrast 45/100, Clarity 38/100. "Best Colors" palette with 6 swatches: dusty rose, soft mauve, powder blue, sage green, lavender, slate blue — each labeled. "Neutrals" row: soft white, dove gray, blue-gray, cocoa. "Accents" row: raspberry, periwinkle, muted teal, rose gold. Bottom: styling tip recommending cool muted tones and silver or rose gold jewelry. Clean modern infographic layout, white background, professional typography.`,
    'Summer Light': `Create a professional personal color analysis report image for this person. Layout: Left side shows the person's photo. Right side shows the analysis report. Title: "Best Season: Summer Light" with subtitle "Cool, Light, Soft". Display three horizontal metric bars: Warmth 22/100, Contrast 25/100, Clarity 42/100. "Best Colors" palette with 6 swatches: pastel pink, baby blue, soft lilac, light mint, rose, powder pink — each labeled. "Neutrals" row: soft white, light gray, pale blue-gray, misty mauve. "Accents" row: light plum, sky blue, soft aqua, silver. Bottom: styling tip recommending light cool pastels and delicate silver jewelry. Clean modern infographic layout, white background, professional typography.`,
    'Autumn Warm': `Create a professional personal color analysis report image for this person. Layout: Left side shows the person's photo. Right side shows the analysis report. Title: "Best Season: Autumn Warm" with subtitle "Warm, Rich, Earthy". Display three horizontal metric bars: Warmth 82/100, Contrast 55/100, Clarity 48/100. "Best Colors" palette with 6 swatches: terracotta, olive green, burnt orange, warm red, mustard yellow, teal — each labeled. "Neutrals" row: cream, caramel, chocolate brown, khaki. "Accents" row: copper, rust, forest green, antique gold. Bottom: styling tip recommending warm earthy tones and gold/copper jewelry. Clean modern infographic layout, white background, professional typography.`,
    'Autumn Deep': `Create a professional personal color analysis report image for this person. Layout: Left side shows the person's photo. Right side shows the analysis report. Title: "Best Season: Autumn Deep" with subtitle "Warm, Deep, Intense". Display three horizontal metric bars: Warmth 75/100, Contrast 78/100, Clarity 55/100. "Best Colors" palette with 6 swatches: deep olive, burgundy, dark teal, chocolate, burnt sienna, dark tomato red — each labeled. "Neutrals" row: dark chocolate, charcoal brown, deep camel, espresso. "Accents" row: bronze, dark coral, hunter green, antique brass. Bottom: styling tip recommending deep warm jewel tones and bronze/gold jewelry. Clean modern infographic layout, white background, professional typography.`,
    'Winter Cool': `Create a professional personal color analysis report image for this person. Layout: Left side shows the person's photo. Right side shows the analysis report. Title: "Best Season: Winter Cool" with subtitle "Cool, Bold, Clear". Display three horizontal metric bars: Warmth 18/100, Contrast 85/100, Clarity 88/100. "Best Colors" palette with 6 swatches: true red, royal blue, emerald green, hot pink, pure white, black — each labeled. "Neutrals" row: pure white, charcoal, navy, black. "Accents" row: fuchsia, electric blue, icy violet, platinum silver. Bottom: styling tip recommending bold high-contrast colors and silver/platinum jewelry. Clean modern infographic layout, white background, professional typography.`,
    'Winter Deep': `Create a professional personal color analysis report image for this person. Layout: Left side shows the person's photo. Right side shows the analysis report. Title: "Best Season: Winter Deep" with subtitle "Cool, Deep, Vivid". Display three horizontal metric bars: Warmth 15/100, Contrast 91/100, Clarity 82/100. "Best Colors" palette with 6 swatches: deep emerald, cobalt blue, raspberry, plum, true red, deep magenta — each labeled. "Neutrals" row: pure white, charcoal, ink navy, blue-gray. "Accents" row: icy pink, amethyst, blue-red, silver. Bottom: styling tip recommending deep jewel tones with high contrast and silver jewelry. Clean modern infographic layout, white background, professional typography.`,
  };

  return colorMap[preset.name] || `Create a personal color analysis report for this person in ${preset.name} season style. Include color palette swatches, metric bars, and styling tips. Clean modern infographic layout.`;
}

function buildMuscleTransformPrompt(preset: BasePreset): string {
  const muscleMap: Record<string, string> = {
    'Lean Fit': 'Transform this person\'s body to have a lean fit physique. Visible muscle definition with low body fat, toned arms, defined shoulders, visible but not bulky abs. Slim athletic build, natural looking. Keep the same face, clothing, pose, and background identical.',
    'Athletic': 'Transform this person\'s body to have an athletic muscular build. Well-developed balanced muscles, broad shoulders, defined arms and chest, visible abs, V-taper torso. Like a regular athlete or sports player. Keep the same face, clothing, pose, and background identical.',
    'Bodybuilder': 'Transform this person\'s body to have a massive bodybuilder physique. Extremely large, well-defined muscles throughout - huge arms, broad chest, massive shoulders, visible veins, competition-level muscle mass and definition. Very low body fat. Keep the same face, clothing, pose, and background identical.',
    'Swimmer': 'Transform this person\'s body to have a swimmer\'s physique. Broad shoulders with a narrow waist creating a pronounced V-taper, long lean muscles, defined back and shoulders, slim hips. Athletic and elongated build. Keep the same face, clothing, pose, and background identical.',
    'Strongman': 'Transform this person\'s body to have a strongman/powerlifter build. Very thick, powerful frame with massive muscles covered by a layer of bulk. Extremely broad shoulders, thick arms, barrel chest, powerful legs. Built for raw strength over aesthetics. Keep the same face, clothing, pose, and background identical.',
    'Fitness Model': 'Transform this person\'s body to have a fitness model physique. Aesthetically proportioned muscles with clear definition, visible six-pack abs, sculpted shoulders and arms, proportional chest. Low body fat with attractive muscle symmetry. Keep the same face, clothing, pose, and background identical.',
    'Slim': 'Transform this person\'s body to have a slim, thin physique. Minimal muscle mass, narrow shoulders, thin arms and legs, flat stomach. Ectomorph body type, lean without visible muscle definition. Keep the same face, clothing, pose, and background identical.',
    'Average': 'Transform this person\'s body to have an average, everyday physique. Normal proportions, moderate build, not particularly muscular or thin. Typical adult body without notable muscle definition. Natural and unremarkable build. Keep the same face, clothing, pose, and background identical.',
  };

  return muscleMap[preset.name] || `Transform this person's body to have a ${preset.name} physique. Keep the same face, clothing, pose, and background identical.`;
}

function buildAsciiArtTransformPrompt(preset: BasePreset): string {
  const asciiMap: Record<string, string> = {
    'Classic ASCII': 'Convert this photo into classic ASCII art made entirely of text characters like @, #, %, &, *, +, -, and dots on a black background. The portrait should be recognizable through varying density of ASCII characters for shading. Monochrome green or white characters on dark background. Keep composition identical.',
    'Dot Matrix': 'Convert this photo into a dot matrix print art style. Use densely packed small dots of varying sizes to create the image, like an old dot-matrix printer output. Black dots on white paper with visible dot grid pattern. Keep composition identical.',
    'Block Art': 'Convert this photo into Unicode block character art using solid block elements like █▓▒░. Use different density blocks to create shading and depth. Monochrome with gradient blocks from solid to light. Grid-like structured appearance. Keep composition identical.',
    'Emoji Mosaic': 'Convert this photo into an emoji mosaic artwork. The portrait should be composed entirely of small colorful emoji symbols and icons arranged in a grid to recreate the image. Each emoji chosen for its color to match the original pixel area. Vibrant and playful. Keep composition identical.',
    'Typewriter': 'Convert this photo into vintage typewriter text art on aged yellowed paper. Use typewriter characters with varying strike pressure for shading. Monospaced font characters, visible paper texture, slightly uneven ink impression. Nostalgic, analog feel. Keep composition identical.',
    'Matrix Code': 'Convert this photo into Matrix-style digital rain art. The portrait should be visible through cascading green Japanese/Latin characters on a black background. Glowing green text, digital rain effect, cyberpunk hacker aesthetic. Keep composition identical.',
    'Pixel Art': 'Convert this photo into retro pixel art with a visible low-resolution grid. Use large square pixels with limited color palette, like an 8-bit or 16-bit video game character portrait. Crisp pixel edges, nostalgic retro gaming aesthetic. Keep composition identical.',
    'Braille Pattern': 'Convert this photo into Unicode braille pattern art. Use braille dot characters (⠁⠃⠇⡇⣇⣿) of varying density to create a detailed portrait. Fine-grained dot pattern, monochrome white on dark background, high detail through braille character selection. Keep composition identical.',
  };

  return asciiMap[preset.name] || `Convert this photo into ${preset.name} text art style. Keep composition identical.`;
}

function buildPhotoToCartoonTransformPrompt(preset: BasePreset): string {
  const cartoonMap: Record<string, string> = {
    'Pixar 3D': 'Transform this photo into a Pixar/Disney 3D animated character. Smooth plastic-like skin, large expressive eyes, stylized proportions, vivid colors, soft ambient lighting. High-quality 3D render, Pixar animation studio style. Keep composition and identity recognizable.',
    'Anime': 'Transform this photo into a Japanese anime illustration. Large shiny eyes, small nose and mouth, smooth skin, vibrant hair colors, clean line art with cel-shading. Classic anime art style like Studio Ghibli or modern anime. Keep composition and identity recognizable.',
    'Comic Book': 'Transform this photo into a Western comic book illustration. Bold black outlines, flat bold colors, halftone dot shading, dramatic ink shadows. American superhero comic book art style with strong lines. Keep composition and identity recognizable.',
    'Chibi': 'Transform this photo into a cute chibi cartoon character. Oversized head roughly 1:1 ratio with body, huge adorable eyes, tiny body, simplified features, kawaii style. Colorful and cute Japanese chibi art style. Keep identity recognizable.',
    'Caricature': 'Transform this photo into an exaggerated caricature drawing. Humorously exaggerate distinctive facial features — enlarge the most prominent features while shrinking others. Colorful, expressive, hand-drawn caricature art style with fun proportions. Keep identity recognizable.',
    'Pop Art': 'Transform this photo into an Andy Warhol-inspired pop art portrait. Bold flat areas of bright saturated color, strong black outlines, high contrast, screen-print aesthetic. Vibrant neon colors, graphic and stylized. Keep composition and identity recognizable.',
    'Manga': 'Transform this photo into a black-and-white Japanese manga illustration. Clean precise ink lines, screen tone shading, expressive eyes, dramatic speed lines or tone patterns in background. Traditional manga panel art style. Keep composition and identity recognizable.',
    'Classic Cartoon': 'Transform this photo into a classic cartoon character style like Saturday morning cartoons. Simple rounded shapes, bold outlines, bright flat colors, exaggerated expressions, slightly oversized head. Fun, playful vintage cartoon aesthetic. Keep identity recognizable.',
  };

  return cartoonMap[preset.name] || `Transform this photo into a ${preset.name} cartoon style. Keep composition and identity recognizable.`;
}

function buildVintagePhotoBoothTransformPrompt(preset: BasePreset): string {
  const vintageMap: Record<string, string> = {
    'Classic B&W': 'Convert this photo into a classic black-and-white photograph. Remove all color, apply natural grayscale tones with rich contrast and full tonal range. Add subtle film grain texture. The result should look like a timeless professional B&W photo. Keep composition identical.',
    'Sepia Tone': 'Apply a warm sepia tone vintage effect to this photo. Convert to warm brown monochrome tones reminiscent of antique photographs from the early 1900s. Add subtle paper texture and slight vignetting. Keep composition identical.',
    '70s Film': 'Apply a 1970s film photography aesthetic to this photo. Warm faded colors with orange and golden tones, slightly washed-out highlights, muted shadows, and a nostalgic sun-drenched feel. Add subtle film grain. Keep composition identical.',
    'Polaroid': 'Apply a Polaroid instant camera aesthetic to this photo. Slightly washed-out, soft pastel-like colors with a warm cast, reduced contrast, and a dreamy quality typical of instant film. Slightly faded edges. Keep composition identical.',
    'Film Noir': 'Apply a dramatic film noir aesthetic to this photo. High-contrast black-and-white with deep shadows, bright highlights, dramatic lighting with strong chiaroscuro effect. Moody, cinematic atmosphere. Keep composition identical.',
    'VHS Retro': 'Apply a VHS video camera aesthetic to this photo. Slightly blurry soft focus, warm color cast, reduced sharpness, subtle horizontal scan line artifacts, slightly oversaturated reds and blues. 1980s-90s camcorder feel. Keep composition identical.',
    'Faded Vintage': 'Apply a faded vintage photograph effect to this photo. Heavily washed-out muted colors, reduced contrast and saturation, yellowed highlights, faded edges, as if the photo has aged decades. Old photograph stored in a drawer. Keep composition identical.',
    'Retro Pop': 'Apply a vibrant retro pop art aesthetic to this photo. Highly saturated bold colors, increased contrast, vivid warm tones with punchy reds, oranges and yellows. Energetic 1960s pop culture photography feel. Keep composition identical.',
  };

  return vintageMap[preset.name] || `Apply a ${preset.name} vintage photo filter to this image. Keep composition identical.`;
}

function buildFaceShapeTransformPrompt(preset: BasePreset): string {
  const shapeMap: Record<string, string> = {
    'Oval': 'Reshape this person\'s face to have a classic oval face shape. The face should be slightly longer than wide, with a gently rounded jawline, balanced cheekbones, and a smooth forehead. Proportional and symmetrical facial structure. Keep their identity, skin, expression, and features intact.',
    'Round': 'Reshape this person\'s face to have a round face shape. The face should be as wide as it is long, with full rounded cheeks, a soft curved jawline, and a wide hairline. Softer, fuller appearance. Keep their identity, skin, expression, and features intact.',
    'Square': 'Reshape this person\'s face to have a square face shape. The face should have a strong, angular jawline with sharp corners, wide forehead matching the jaw width, and flat cheekbones. Defined, angular structure. Keep their identity, skin, expression, and features intact.',
    'Heart': 'Reshape this person\'s face to have a heart face shape. The face should have a wide forehead that narrows down to a pointed, delicate chin. Prominent cheekbones, wider upper face, and a narrow lower face. Keep their identity, skin, expression, and features intact.',
    'Diamond': 'Reshape this person\'s face to have a diamond face shape. The face should have a narrow forehead and jawline with prominent, wide cheekbones as the widest point. Angular and striking facial structure. Keep their identity, skin, expression, and features intact.',
    'Oblong': 'Reshape this person\'s face to have an oblong face shape. The face should be noticeably longer than it is wide, with a tall forehead, long straight cheeks, and a slightly rounded jawline. Elongated, narrow structure. Keep their identity, skin, expression, and features intact.',
    'V-Shape': 'Reshape this person\'s face to have a V-shape face. The face should have a wider upper face that tapers dramatically to a slim, pointed chin. Sharp defined jawline narrowing to a V-point, high cheekbones. Slim and youthful appearance. Keep their identity, skin, expression, and features intact.',
    'Triangle': 'Reshape this person\'s face to have a triangle face shape. The face should have a narrow forehead that widens to a broad, strong jawline. The jaw is the widest part of the face, with less prominent cheekbones. Keep their identity, skin, expression, and features intact.',
  };

  return shapeMap[preset.name] || `Reshape this person's face to have a ${preset.name} face shape. Keep their identity, skin, expression, and features intact.`;
}

function buildPhotoColorizerTransformPrompt(preset: BasePreset): string {
  const colorMap: Record<string, string> = {
    'Natural Color': 'Colorize this black-and-white photograph with natural, realistic colors. Apply true-to-life skin tones, accurate clothing colors, and natural environment colors. The result should look like an authentic color photograph. Keep composition identical.',
    'Vintage Warm': 'Colorize this black-and-white photograph with warm vintage tones. Apply warm sepia-tinted colors with golden highlights, slightly faded warm hues reminiscent of 1970s color photography. Warm skin tones, amber highlights. Keep composition identical.',
    'Cool Tone': 'Colorize this black-and-white photograph with cool blue-tinted tones. Apply a modern cool color palette with blue shadows, desaturated cool skin tones, and a contemporary editorial feel. Keep composition identical.',
    'Vivid': 'Colorize this black-and-white photograph with vivid, highly saturated colors. Apply bold, vibrant colors with high saturation and strong contrast. Rich skin tones, bright clothing colors, vivid backgrounds. Keep composition identical.',
    'Pastel': 'Colorize this black-and-white photograph with soft pastel tones. Apply light, muted pastel colors — soft pinks, gentle blues, light lavenders. Dreamy, ethereal quality with low saturation. Keep composition identical.',
    'Golden Hour': 'Colorize this black-and-white photograph with warm golden hour lighting. Apply rich golden-orange tones as if shot during sunset — warm glowing skin, amber highlights, golden light wrapping around subjects. Keep composition identical.',
    'Cinema': 'Colorize this black-and-white photograph with cinematic color grading. Apply a teal-and-orange cinema look with crushed shadows, rich midtones, and dramatic contrast. Professional movie-like color palette. Keep composition identical.',
    'Classic Film': 'Colorize this black-and-white photograph with a classic analog film look. Apply colors reminiscent of Kodak Portra or Fuji Superia — slightly warm, gentle grain texture feel, natural but with characteristic film color rendering. Keep composition identical.',
  };

  return colorMap[preset.name] || `Colorize this black-and-white photograph with a ${preset.name} color style. Keep composition identical.`;
}

function buildBabyTransformPrompt(preset: BasePreset): string {
  const babyMap: Record<string, string> = {
    'Baby Boy': 'Transform this baby into an adorable baby boy. Cute round face, big bright eyes, tiny nose, soft baby skin. Dressed in a light blue onesie. Happy, healthy-looking baby boy with a gentle expression. Keep the same face shape and features.',
    'Baby Girl': 'Transform this baby into an adorable baby girl. Cute round face, big bright eyes, tiny nose, soft baby skin. Dressed in a light pink onesie with a small bow headband. Happy, healthy-looking baby girl with a gentle expression. Keep the same face shape and features.',
    'Newborn': 'Transform this baby into a tiny newborn baby, approximately 0-3 months old. Very small, delicate features, slightly wrinkled soft skin, eyes partially closed, peaceful sleeping expression. Wrapped snugly in a soft white swaddle blanket. Keep the same basic features.',
    'Toddler': 'Transform this baby into a cute toddler approximately 2-3 years old. Round cheeks, bright curious eyes, small teeth visible in a happy smile, slightly longer hair. Wearing a colorful casual outfit. Keep the same face shape and features recognizable.',
    'Cute Smile': 'Transform this baby to have the most adorable wide smile. Big bright eyes full of joy, rosy cheeks, tiny teeth showing, dimples, radiating pure happiness. Keep the same face shape and features.',
    'Sleeping Baby': 'Transform this baby into a peacefully sleeping baby. Eyes gently closed, serene calm expression, soft relaxed features, slightly parted lips. Wrapped in a cozy soft blanket. Keep the same face shape and features.',
    'Chubby Cheeks': 'Transform this baby to have extra chubby, round, pinchable cheeks. Very round plump face, adorable double chin, big bright eyes, tiny button nose. Radiating healthy cuteness. Keep the same basic features.',
    'Angel Face': 'Transform this baby into an angelic-looking baby. Soft glowing skin, bright innocent wide eyes, delicate features, gentle serene expression. Soft halo-like lighting around the head. Keep the same face shape and features.',
  };

  return babyMap[preset.name] || `Transform this baby to have a ${preset.name} appearance. Keep the same basic features.`;
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
    'ai-hug': 'hugs',
    'ai-smile-filter': 'smiles',
    'ai-skin-color': 'skinColors',
    'ai-eye-color': 'eyeColors',
    'ai-baby-generator': 'babies',
    'ai-photo-colorizer': 'colorStyles',
    'ai-face-shape': 'faceShapes',
    'ai-vintage-photo-booth': 'vintageStyles',
    'ai-photo-to-sketch': 'sketchStyles',
    'ai-photo-to-cartoon': 'cartoonStyles',
    'ai-ascii-art-generator': 'asciiStyles',
    'ai-muscle-generator': 'muscleStyles',
    'ai-open-eyes': 'eyeStyles',
    'ai-pet-portrait': 'petPortraitStyles',
    'ai-personal-color': 'personalColorStyles',
    'ai-perler-bead-pattern': 'perlerBeadStyles',
    'ai-punch-hole-effect': 'punchHoleStyles',
    'ai-tattoo-generator': 'tattooStyles',
    'ai-sticker-generator': 'stickerStyles',
    'ai-logo-generator': 'logoStyles',
    'ai-meme-generator': 'memeStyles',
    'ai-face-animator': 'expressions',
    'ai-glow-up-test': 'glowUpStyles',
    'ai-outfit-change': 'outfitStyles',
    'ai-alter-ego': 'alterEgoStyles',
    'ai-virality-predictor': 'viralityStyles',
    'ai-attractiveness-test': 'attractivenessStyles',
    'ai-comic-frame': 'comicFrameStyles',
    'ai-bug-identifier': 'bugAnalysisStyles',
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
    case 'ai-hug':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional portrait of a young Asian woman in her mid-20s standing alone with arms relaxed, wearing a casual white sweater, warm smile. Visible from head to waist. Natural lighting, clean background. Photorealistic, 8K.',
          transformPreset: 'Warm Embrace',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional portrait of a young Black man in his early 30s standing alone with arms at his sides, wearing a casual grey t-shirt, friendly smile. Visible from head to waist. Studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Group Hug',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional portrait of a young Latina woman in her late 20s standing alone, wearing a light blue dress, warm expression. Visible from head to waist. Soft natural light, bokeh background. Photorealistic, 8K.',
          transformPreset: 'Romantic',
        },
      ];
    case 'ai-smile-filter':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional headshot of a young Asian woman in her early 20s with a neutral expressionless face. No smile, relaxed mouth, long straight black hair, wearing a white blouse. Natural lighting, clean background. Photorealistic, 8K.',
          transformPreset: 'Big Grin',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional headshot of a young Black man in his late 20s with a neutral expressionless face. No smile, short hair, wearing a casual grey shirt. Studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Confident Smile',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional headshot of a young Caucasian woman in her mid-20s with a neutral expressionless face. No smile, light brown wavy hair, wearing a casual sweater. Warm natural light, soft background. Photorealistic, 8K.',
          transformPreset: 'Dimple Smile',
        },
      ];
    case 'ai-skin-color':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional headshot of a young Asian woman in her early 20s with medium skin tone, long straight black hair, wearing a white top. Natural lighting, clean background. Photorealistic, 8K.',
          transformPreset: 'Porcelain',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional headshot of a young Caucasian man in his late 20s with light skin tone, short brown hair, wearing a casual blue shirt. Studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Tan',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional headshot of a young Latina woman in her mid-20s with medium-tan skin tone, wavy dark brown hair, wearing a casual sweater. Warm natural light, soft background. Photorealistic, 8K.',
          transformPreset: 'Deep',
        },
      ];
    case 'ai-eye-color':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional headshot of a young Asian woman in her early 20s with dark brown eyes, long straight black hair, wearing a white blouse. Natural lighting, clean background. Photorealistic, 8K.',
          transformPreset: 'Blue',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional headshot of a young Black man in his late 20s with dark brown eyes, short cropped hair, wearing a casual grey shirt. Studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Green',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional headshot of a young Caucasian woman in her mid-20s with brown eyes, wavy auburn hair, wearing a casual sweater. Warm natural light, soft background. Photorealistic, 8K.',
          transformPreset: 'Amber',
        },
      ];
    case 'ai-baby-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional studio portrait of an adorable baby with soft skin, round face, big bright eyes, and a gentle smile. Wrapped in a soft white blanket, clean white background. Photorealistic, 8K.',
          transformPreset: 'Baby Boy',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional studio portrait of an adorable baby with soft skin, round face, big bright eyes, and a gentle smile. Wrapped in a soft white blanket, clean white background. Photorealistic, 8K.',
          transformPreset: 'Cute Smile',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional studio portrait of an adorable baby with soft skin, round face, big bright eyes, and a gentle smile. Wrapped in a soft white blanket, clean white background. Photorealistic, 8K.',
          transformPreset: 'Sleeping Baby',
        },
      ];
    case 'ai-photo-colorizer':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A vintage black-and-white photograph from the 1940s of a young couple standing together outdoors. The man in a suit, the woman in a dress. Trees and a park bench in the background. Entirely grayscale, no color. High-quality vintage photograph, 8K.',
          transformPreset: 'Natural Color',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A vintage black-and-white street photograph from the 1960s of a busy city street with cars, pedestrians, and storefronts. Urban scene, people walking on sidewalks. Entirely grayscale, no color. High-quality vintage photograph, 8K.',
          transformPreset: 'Cinema',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A vintage black-and-white family portrait from the 1950s. A family of four — parents and two children — sitting on a couch in a living room. Formal poses, classic attire. Entirely grayscale, no color. High-quality vintage photograph, 8K.',
          transformPreset: 'Vintage Warm',
        },
      ];
    case 'ai-face-shape':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional headshot portrait photo of a young Asian woman in her early 20s with a naturally round face. Clear skin, minimal makeup, hair pulled back. Neutral pleasant expression, front-facing. Studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'V-Shape',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional headshot portrait photo of a young Black man in his late 20s with a naturally oval face. Strong features, short hair, clean-shaven. Neutral pleasant expression, front-facing. Studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Square',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional headshot portrait photo of a young Latina woman in her mid-20s with a naturally square face. Long dark hair pulled back, clear skin. Neutral pleasant expression, front-facing. Studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Heart',
        },
      ];
    case 'ai-vintage-photo-booth':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A modern color photograph of a young Asian woman in her early 20s sitting at a cafe, holding a coffee cup, warm natural light, casual outfit. Sharp modern digital photo, vivid colors. Photorealistic, 8K quality.',
          transformPreset: 'Sepia Tone',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A modern color photograph of a young Black man in his late 20s standing outdoors in a park, wearing a leather jacket, confident smile. Bright daylight, sharp modern digital photo. Photorealistic, 8K quality.',
          transformPreset: '70s Film',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A modern color photograph of a young Latina woman in her mid-20s leaning against a brick wall in a city street, wearing a denim jacket. Urban scene, natural light. Sharp modern digital photo. Photorealistic, 8K quality.',
          transformPreset: 'Film Noir',
        },
      ];
    case 'ai-photo-to-sketch':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional portrait photo of a young Asian woman in her early 20s with long straight black hair, wearing a light blue blouse, gentle smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Charcoal',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional portrait photo of a young Black man in his late 20s with short hair, wearing a dark green henley shirt, confident expression. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Watercolor',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional portrait photo of a young Latina woman in her mid-20s with wavy brown hair, wearing a cream sweater, warm smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Oil Painting',
        },
      ];
    case 'ai-photo-to-cartoon':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional portrait photo of a young Asian woman in her early 20s with long straight black hair, wearing a white turtleneck, gentle smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Anime',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional portrait photo of a young Black man in his late 20s with short curly hair, wearing a maroon polo shirt, confident smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Comic Book',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional portrait photo of a young Latina woman in her mid-20s with wavy dark hair, wearing a yellow sundress, warm bright smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Classic Cartoon',
        },
      ];
    case 'ai-ascii-art-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional portrait photo of a young Asian woman in her early 20s with long straight black hair, wearing a red turtleneck, gentle smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Matrix Code',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional portrait photo of a young Black man in his late 20s with short hair and a goatee, wearing a white t-shirt, confident expression. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Pixel Art',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional portrait photo of a young Latina woman in her mid-20s with curly dark hair, wearing a denim jacket, warm bright smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Dot Matrix',
        },
      ];
    case 'ai-muscle-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A full-body photograph of a young Asian man in his early 20s with slim build, wearing a white tank top and grey shorts. Standing naturally, visible from head to mid-thigh. Clean gym background. Photorealistic, 8K quality.',
          transformPreset: 'Athletic',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A full-body photograph of a young Black woman in her late 20s with average build, wearing a purple sports bra and black leggings. Standing naturally, visible from head to mid-thigh. Clean gym background. Photorealistic, 8K quality.',
          transformPreset: 'Fitness Model',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A full-body photograph of a young Latino man in his mid-20s with average build, wearing a red tank top and black shorts. Standing naturally, visible from head to mid-thigh. Clean gym background. Photorealistic, 8K quality.',
          transformPreset: 'Strongman',
        },
      ];
    case 'ai-open-eyes':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A close-up portrait photo of a young Asian woman in her early 20s with her eyes squinting almost closed, long straight black hair, wearing a white blouse. Eyes barely open. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Bright Eyes',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A close-up portrait photo of a young Black man in his late 20s with his eyes closed, short hair, wearing a grey t-shirt. Eyes completely shut. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Wide Awake',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A close-up portrait photo of a young Latina woman in her mid-20s with drowsy half-closed eyes, wavy brown hair, wearing a cream sweater. Eyes drooping and half-shut. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Sparkling',
        },
      ];
    case 'ai-pet-portrait':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A cute small white Pomeranian dog sitting and looking at the camera with a happy expression, fluffy white fur, dark round eyes. Clear well-lit pet photography, clean simple background. Professional quality, 8K.',
          transformPreset: 'Disney Style',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A beautiful black cat with bright yellow eyes sitting elegantly and looking at the camera. Sleek shiny black fur, alert posture. Clear well-lit pet photography, clean simple background. Professional quality, 8K.',
          transformPreset: 'Royal Portrait',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A cute French Bulldog puppy with brindle coat sitting and looking at the camera with big round eyes and bat-like ears. Adorable expression. Clear well-lit pet photography, clean simple background. Professional quality, 8K.',
          transformPreset: 'Watercolor',
        },
      ];
    case 'ai-personal-color':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A close-up portrait photo of a young Asian woman in her early 20s with warm golden skin, dark brown eyes, black straight hair. Wearing a neutral white top. Clean sharp modern photograph, good natural lighting, neutral gray background. No makeup. Photorealistic, 8K quality.',
          transformPreset: 'Autumn Warm',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A close-up portrait photo of a young Black man in his late 20s with deep rich dark skin, dark brown eyes, short black hair. Wearing a neutral white t-shirt. Clean sharp modern photograph, good natural lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Winter Cool',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A close-up portrait photo of a young Caucasian woman in her mid-20s with fair light skin with pink undertones, light blue eyes, strawberry blonde hair. Wearing a neutral white blouse. Clean sharp modern photograph, good natural lighting, neutral gray background. No makeup. Photorealistic, 8K quality.',
          transformPreset: 'Summer Light',
        },
      ];
    case 'ai-perler-bead-pattern':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A beautiful red rose flower on a green stem against a clean white background. Clear photography, vibrant colors, sharp focus. Professional quality, 8K.',
          transformPreset: 'Rainbow',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A cute cartoon-style panda bear face illustration, simple black and white design with round eyes. Clean white background. Clear, simple graphic.',
          transformPreset: 'Monochrome',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A colorful tropical parrot bird perched on a branch, vivid green, red, blue, and yellow feathers. Clean white background, sharp focus. Professional wildlife photography, 8K.',
          transformPreset: 'Neon Glow',
        },
      ];
    case 'ai-punch-hole-effect':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman with long black hair and a warm smile wearing a white blouse. Clear studio portrait on plain background.',
          transformPreset: 'Heart Cutout',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A Black man with a beard and glasses wearing a dark turtleneck sweater. Professional headshot on plain background.',
          transformPreset: 'Star Cutout',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A young Latina woman with curly brown hair and bright eyes wearing a colorful scarf. Studio portrait on plain background.',
          transformPreset: 'Torn Paper',
        },
      ];
    case 'ai-tattoo-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman with long black hair wearing a strapless top showing her shoulders and upper back. Clear studio portrait on plain background. No existing tattoos.',
          transformPreset: 'Minimalist',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A muscular Black man with a shaved head wearing a sleeveless shirt showing his arms. Professional photo on plain background. No existing tattoos.',
          transformPreset: 'Blackwork',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A young Latina woman with wavy brown hair wearing a tank top showing her forearm. Studio portrait on plain background. No existing tattoos.',
          transformPreset: 'Watercolor',
        },
      ];
    case 'ai-sticker-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A smiling young Asian woman with long black hair taking a selfie. Clear portrait on plain background.',
          transformPreset: '3D Puffy',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A fluffy white Pomeranian dog with a happy expression. Clear photo on plain background.',
          transformPreset: 'Pixel Art',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A young boy with curly hair and a big smile wearing a red t-shirt. Clear portrait on plain background.',
          transformPreset: 'Cartoon',
        },
      ];
    case 'ai-logo-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A simple black silhouette of a coffee cup with steam rising on a plain white background. Clean vector illustration, centered.',
          transformPreset: 'Vintage Badge',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A simple black silhouette of a rocket ship launching on a plain white background. Clean vector illustration, centered.',
          transformPreset: 'Neon',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A simple black silhouette of a tree with spreading branches on a plain white background. Clean vector illustration, centered.',
          transformPreset: 'Minimalist',
        },
      ];
    case 'ai-meme-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A golden retriever dog with tongue out making a goofy happy face. Clear photo on plain background.',
          transformPreset: 'Deep Fried',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A young woman with glasses making an exaggerated thinking pose with finger on chin. Clear portrait on plain background.',
          transformPreset: 'Comic Panel',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A baby with a chubby face making a determined fist pump expression. Clear photo on plain background.',
          transformPreset: 'Wholesome',
        },
      ];
    case 'ai-face-animator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman with long black hair, neutral expression, wearing a white top. Clear portrait photo, plain background, photorealistic.',
          transformPreset: 'Laughing',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A Black man in his 30s with short hair and a beard, neutral expression, wearing a gray t-shirt. Clear portrait photo, plain background, photorealistic.',
          transformPreset: 'Surprised',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A Latina woman in his 20s with curly brown hair, neutral expression, wearing a green blouse. Clear portrait photo, plain background, photorealistic.',
          transformPreset: 'Winking',
        },
      ];
    case 'ai-glow-up-test':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman with long black hair, no makeup, neutral expression, wearing a simple top. Clear portrait photo, plain background, natural lighting, photorealistic.',
          transformPreset: 'K-Beauty Glow',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A Black man in his 20s with short curly hair, clean shaven, neutral expression, wearing a white shirt. Clear portrait photo, plain background, natural lighting, photorealistic.',
          transformPreset: 'Celebrity Glow',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A Latina woman in her 20s with wavy brown hair, minimal makeup, neutral expression, wearing a light blouse. Clear portrait photo, plain background, natural lighting, photorealistic.',
          transformPreset: 'Red Carpet',
        },
      ];
    case 'ai-outfit-change':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman standing in a casual pose wearing a simple white blouse and black pants. Full body visible from head to mid-thigh. Clean background, natural lighting, photorealistic.',
          transformPreset: 'Korean Fashion',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A Black man in his 20s standing confidently wearing a plain red t-shirt and jeans. Full body visible from head to mid-thigh. Clean background, natural lighting, photorealistic.',
          transformPreset: 'Streetwear',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A Latina woman in her 20s standing in a relaxed pose wearing a simple sundress. Full body visible from head to mid-thigh. Clean background, natural lighting, photorealistic.',
          transformPreset: 'Elegant Evening',
        },
      ];
    case 'ai-alter-ego':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman with long straight black hair, no makeup, neutral expression, wearing a simple white blouse. Portrait photo, plain background, photorealistic.',
          transformPreset: 'Renaissance Portrait',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A Black man in his 20s with short hair, neutral expression, wearing a plain gray t-shirt. Portrait photo, plain background, photorealistic.',
          transformPreset: 'Greek God',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A Latina woman in her 20s with wavy brown hair, minimal makeup, neutral expression, wearing a casual top. Portrait photo, plain background, photorealistic.',
          transformPreset: 'Vampire',
        },
      ];
    case 'ai-attractiveness-test':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman with long black hair, no makeup, neutral expression, wearing a simple white top. Clear portrait photo, plain background, natural lighting, photorealistic.',
          transformPreset: 'Golden Ratio',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A Black man in his 20s with short hair, neutral expression, wearing a plain gray t-shirt. Clear portrait photo, plain background, natural lighting, photorealistic.',
          transformPreset: 'Celebrity Match',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A Latina woman in her 20s with wavy brown hair, no makeup, neutral expression, wearing a light blouse. Clear portrait photo, plain background, natural lighting, photorealistic.',
          transformPreset: 'Personality Vibe',
        },
      ];
    case 'ai-virality-predictor':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman taking a bright cheerful selfie with peace sign, colorful outfit, outdoor background. Upper body, natural lighting, photorealistic.',
          transformPreset: 'Instagram Worthy',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A Black man in his 20s with confident expression, wearing casual streetwear, urban background. Upper body selfie style, natural lighting, photorealistic.',
          transformPreset: 'YouTube Thumbnail',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A Latina woman in her 20s with expressive surprised face, colorful background, casual style. Upper body selfie, bright lighting, photorealistic.',
          transformPreset: 'Clickbait King',
        },
      ];
    case 'ai-comic-frame':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A young Asian woman with long black hair, minimal makeup, wearing a white blouse, neutral expression, studio lighting.',
          transformPreset: 'Fantasy',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A young Black man with short curly hair, clean-shaven, wearing a navy blue t-shirt, confident expression, studio lighting.',
          transformPreset: 'Horror',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A young Latina woman with wavy brown hair, light makeup, wearing a red top, warm smile, studio lighting.',
          transformPreset: 'Space',
        },
      ];
    case 'ai-bug-identifier':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A close-up macro photo of a colorful butterfly resting on a purple flower, wings spread open, sharp focus, natural garden lighting, professional nature photography',
          transformPreset: 'Garden Friend',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A close-up macro photo of a black spider on its web, morning dew drops on silk threads, sharp focus, natural lighting, professional nature photography',
          transformPreset: 'Spider Analysis',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A close-up macro photo of a green caterpillar on a leaf, detailed body segments visible, sharp focus, natural lighting, professional nature photography',
          transformPreset: 'Life Cycle',
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
  'ai-hug': 'Bear Hug',
  'ai-smile-filter': 'Big Grin',
  'ai-skin-color': 'Tan',
  'ai-eye-color': 'Violet',
  'ai-baby-generator': 'Baby Girl',
  'ai-photo-colorizer': 'Natural Color',
  'ai-face-shape': 'V-Shape',
  'ai-vintage-photo-booth': '70s Film',
  'ai-photo-to-sketch': 'Pencil Sketch',
  'ai-photo-to-cartoon': 'Pixar 3D',
  'ai-ascii-art-generator': 'Classic ASCII',
  'ai-muscle-generator': 'Bodybuilder',
  'ai-open-eyes': 'Natural Open',
  'ai-pet-portrait': 'Oil Painting',
  'ai-personal-color': 'Winter Deep',
  'ai-perler-bead-pattern': 'Classic Grid',
  'ai-punch-hole-effect': 'Circle Cutout',
  'ai-tattoo-generator': 'Japanese',
  'ai-sticker-generator': 'Kawaii',
  'ai-logo-generator': 'Gradient Modern',
  'ai-meme-generator': 'Classic Meme',
  'ai-face-animator': 'Big Smile',
  'ai-glow-up-test': 'Overall Glow Up',
  'ai-outfit-change': 'Business Formal',
  'ai-alter-ego': 'Cyberpunk',
  'ai-virality-predictor': 'TikTok Viral',
  'ai-attractiveness-test': 'Overall Score',
  'ai-comic-frame': 'Superhero',
  'ai-bug-identifier': 'Species ID',
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
    case 'ai-hug':
      return `A professional portrait photo of a young man in his late 20s standing alone with arms at his sides, wearing a casual blue shirt, warm friendly smile. Visible from head to waist. ${common}`;
    case 'ai-smile-filter':
      return `A professional headshot portrait photo of a young man in his early 30s with a completely neutral, expressionless face. No smile, no frown, relaxed mouth closed. Strong jawline, short dark hair, wearing a dark navy shirt. ${common}`;
    case 'ai-skin-color':
      return `A professional headshot portrait photo of a young man in his early 30s with light skin tone. Short brown hair, blue eyes, neutral pleasant expression, wearing a casual white shirt. ${common}`;
    case 'ai-eye-color':
      return `A professional close-up headshot portrait photo of a young woman in her mid-20s with natural brown eyes, long dark hair, wearing a casual top. Eyes clearly visible and looking directly at camera. ${common}`;
    case 'ai-baby-generator':
      return `A professional studio portrait of an adorable baby with soft skin, round face, big bright eyes, tiny nose, and a neutral pleasant expression. Wrapped in a soft cream blanket, clean white background. ${common}`;
    case 'ai-photo-colorizer':
      return `A vintage black-and-white photograph from the 1950s of a young man in his late 20s wearing a classic suit and tie. Sharp jawline, neat hair, confident expression. Entirely grayscale, no color at all. High-quality vintage studio photograph, 8K.`;
    case 'ai-face-shape':
      return `A professional headshot portrait photo of a young man in his early 30s with a naturally round face. Short dark hair, clean-shaven, clear skin, hair pulled back. Neutral pleasant expression, front-facing. Studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-vintage-photo-booth':
      return `A modern color portrait photograph of a young man in his early 30s, wearing a casual jacket, warm friendly smile. Sharp modern digital photo with vivid colors, good lighting, outdoor park setting. Photorealistic, 8K quality.`;
    case 'ai-photo-to-sketch':
      return `A professional portrait photo of a young man in his early 30s with short dark hair, wearing a casual navy shirt, warm smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-photo-to-cartoon':
      return `A professional portrait photo of a young man in his early 30s with medium brown hair, wearing a casual olive green shirt, friendly smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-ascii-art-generator':
      return `A professional portrait photo of a young man in his early 30s with short black hair, wearing a casual dark blue hoodie, friendly smile. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-muscle-generator':
      return `A full-body photograph of a young woman in her late 20s with average build, wearing a fitted sports bra and black leggings. Standing naturally with arms at sides, visible from head to mid-thigh. Neutral expression, clean gym background. Photorealistic, 8K quality.`;
    case 'ai-open-eyes':
      return `A close-up portrait photo of a young man in his early 30s with his eyes closed, short dark hair, wearing a casual blue shirt. Eyes clearly shut. Clean sharp modern photograph, good studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-pet-portrait':
      return `A cute fluffy orange tabby cat sitting upright and looking directly at the camera with bright green eyes. Clear well-lit pet photography, clean simple background, sharp focus on the cat's face. Natural soft fur texture, alert expression. Professional pet portrait photography, high quality, 8K.`;
    case 'ai-personal-color':
      return `A professional portrait photo of a young man in his early 30s with fair cool-toned skin, dark black hair, blue-gray eyes. Wearing a neutral white t-shirt. Clean sharp modern photograph, good natural lighting, neutral gray background. No accessories, natural skin. Photorealistic, 8K quality.`;
    case 'ai-perler-bead-pattern':
      return `A cute orange tabby cat sitting and looking at the camera with bright green eyes. Clear well-lit photography, clean white background. Sharp focus, adorable expression. Professional quality, 8K.`;
    case 'ai-punch-hole-effect':
      return `A handsome young man with short dark hair wearing a casual denim jacket, looking at the camera with a confident smile. Clean well-lit studio photograph on a plain white background. High quality, sharp focus, centered composition.`;
    case 'ai-tattoo-generator':
      return `A young man with athletic build wearing a sleeveless black tank top, showing his bare arms and shoulders. He is looking at the camera with a relaxed expression. Clean well-lit studio photograph on a plain white background. High quality, sharp focus, centered composition. No existing tattoos on his skin.`;
    case 'ai-sticker-generator':
      return `A cute orange tabby cat sitting and looking at the camera with bright green eyes and a curious expression. Clear well-lit photograph on a plain white background. High quality, sharp focus, centered composition.`;
    case 'ai-logo-generator':
      return `A simple black silhouette of a mountain peak with a sun rising behind it on a plain white background. Clean vector-style illustration, centered composition, high contrast.`;
    case 'ai-meme-generator':
      return `A cute orange tabby cat with wide eyes sitting on a desk looking surprised at the camera. Clear well-lit photograph on indoor background. High quality, sharp focus. Expressive cat face perfect for meme creation.`;
    case 'ai-face-animator':
      return 'A middle-aged man with a neutral serious expression, short dark hair, wearing a blue collared shirt. Clear professional portrait photo, head and shoulders, plain background, photorealistic.';
    case 'ai-glow-up-test':
      return 'A young man with light stubble and messy brown hair, neutral expression, wearing a plain white t-shirt. No makeup, natural lighting, clear portrait photo, head and shoulders, plain background, photorealistic.';
    case 'ai-outfit-change':
      return 'A young man standing in a relaxed pose wearing a plain gray t-shirt and khaki shorts. Full body visible from head to mid-thigh. Clean neutral background, natural lighting, photorealistic.';
    case 'ai-alter-ego':
      return 'A young man with short brown hair, clean shaven, neutral expression, wearing a plain black t-shirt. Clear portrait photo, head and shoulders, plain white background, natural lighting, photorealistic.';
    case 'ai-virality-predictor':
      return 'A young man with casual messy hair, slight smile, wearing a hoodie. Taking a selfie-style photo with natural lighting. Upper body visible, plain indoor background, photorealistic.';
    case 'ai-attractiveness-test':
      return 'A young man with short dark hair, clean shaven, neutral expression, wearing a plain white crew neck t-shirt. Clear portrait photo, head and shoulders, plain white background, natural lighting, photorealistic.';
    case 'ai-comic-frame':
      return 'A young man with short dark hair, light stubble, wearing a plain gray t-shirt, neutral expression, white background, facing camera.';
    case 'ai-bug-identifier':
      return `A close-up macro photo of a large brown beetle on tree bark, sharp focus, natural sunlight, detailed texture of exoskeleton, professional nature photography`;
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
    console.log('Page types: ai-age-filter | ai-beard-filter | ai-makeup | ai-fat-filter | ai-headshot-generator | ai-hug | ai-smile-filter | ai-skin-color | ai-eye-color | ai-baby-generator | ai-photo-colorizer | ai-face-shape | ai-vintage-photo-booth | ai-photo-to-sketch | ai-photo-to-cartoon | ai-ascii-art-generator | ai-muscle-generator | ai-open-eyes | all\n');
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
  const allPages: PageType[] = ['ai-age-filter', 'ai-beard-filter', 'ai-makeup', 'ai-fat-filter', 'ai-headshot-generator', 'ai-hug', 'ai-smile-filter', 'ai-skin-color', 'ai-eye-color', 'ai-baby-generator', 'ai-photo-colorizer', 'ai-face-shape', 'ai-vintage-photo-booth', 'ai-photo-to-sketch', 'ai-photo-to-cartoon', 'ai-ascii-art-generator', 'ai-muscle-generator', 'ai-open-eyes', 'ai-pet-portrait', 'ai-personal-color', 'ai-perler-bead-pattern', 'ai-punch-hole-effect', 'ai-tattoo-generator', 'ai-sticker-generator', 'ai-logo-generator', 'ai-meme-generator', 'ai-face-animator', 'ai-glow-up-test', 'ai-outfit-change', 'ai-alter-ego', 'ai-virality-predictor', 'ai-attractiveness-test', 'ai-comic-frame', 'ai-bug-identifier'];

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
