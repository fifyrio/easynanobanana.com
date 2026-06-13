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

type PageType = 'ai-age-filter' | 'ai-beard-filter' | 'ai-makeup' | 'ai-fat-filter' | 'ai-headshot-generator' | 'ai-hug' | 'ai-smile-filter' | 'ai-skin-color' | 'ai-eye-color' | 'ai-baby-generator' | 'ai-photo-colorizer' | 'ai-face-shape' | 'ai-vintage-photo-booth' | 'ai-photo-to-sketch' | 'ai-photo-to-cartoon' | 'ai-ascii-art-generator' | 'ai-muscle-generator' | 'ai-open-eyes' | 'ai-pet-portrait' | 'ai-personal-color' | 'ai-perler-bead-pattern' | 'ai-punch-hole-effect' | 'ai-tattoo-generator' | 'ai-sticker-generator' | 'ai-logo-generator' | 'ai-meme-generator' | 'ai-face-animator' | 'ai-glow-up-test' | 'ai-outfit-change' | 'ai-alter-ego' | 'ai-virality-predictor' | 'ai-attractiveness-test' | 'ai-comic-frame' | 'ai-bug-identifier' | 'ai-face-pair' | 'ai-skin-analyzer' | 'ai-eyewear-tryon' | 'ai-aesthetic-sim' | 'ai-teeth-whitening' | 'ai-skin-smoother' | 'ai-room-redesign' | 'ai-double-chin-remover' | 'ai-hat-tryon' | 'ai-model-swap' | 'ai-face-symmetry' | 'ai-gender-swap' | 'ai-face-anonymizer' | 'ai-smart-recognition' | 'ai-image-to-3d' | 'ai-couple-match' | 'ai-tshirt-designer' | 'ai-book-cover-designer' | 'ai-ad-designer' | 'ai-thumbnail-maker' | 'ai-manga-translator' | 'ai-minecraft-skin' | 'ai-3d-camera-control' | 'ai-body-swap' | 'ai-hairstyle-analysis' | 'ai-emoji-mosaic' | 'ai-face-swap' | 'ai-celebrity-lookalike' | 'ai-yearbook-generator' | 'ai-passport-photo-maker' | 'ai-face-expression-changer' | 'ai-room-cleaner' | 'ai-room-planner' | 'ai-color-palette-card' | 'ai-skin-type' | 'ai-skin-concern';

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
    case 'ai-face-pair':
      return `A side-by-side comparison layout showing two professional headshot portraits — on the left a young woman with long brown hair, blue eyes, light skin, neutral expression; on the right a young woman with short black hair, brown eyes, olive skin, neutral expression. Both facing camera, white background, even studio lighting, clean layout with slight gap between photos.`;
    case 'ai-skin-analyzer':
      return `A professional portrait photo of a young woman with clear skin, no makeup, natural complexion, hair pulled back, neutral expression, facing camera, even studio lighting, white background, high resolution close-up showing skin texture detail.`;
    case 'ai-eyewear-tryon':
      return `A professional portrait photo of a young woman with clear face, no glasses, natural expression, hair pulled back, well-lit studio lighting, white background, high resolution`;
    case 'ai-aesthetic-sim':
      return `A professional portrait photo of a young woman with natural face, no makeup, symmetrical features, neutral expression, hair pulled back, well-lit studio lighting, white background, high resolution`;
    case 'ai-teeth-whitening':
      return `A professional portrait photo of a young woman smiling with teeth showing, natural yellowish teeth color, no dental work, well-lit studio lighting, white background, high resolution`;
    case 'ai-skin-smoother':
      return `A professional portrait photo of a young woman with natural unretouched skin showing visible pores, minor blemishes, and natural skin texture, no filters or smoothing applied, well-lit studio lighting, white background, high resolution close-up`;
    case 'ai-room-redesign':
      return `A photograph of a plain, unfurnished living room with white walls, hardwood floors, large windows with natural light, empty space ready for interior design. Clean, well-lit, high resolution interior photography, 4:3 aspect ratio`;
    case 'ai-double-chin-remover':
      return `A professional portrait photo of a young woman with a visible double chin and soft jawline, slightly overweight face, natural skin, no makeup, neutral expression, front-facing, well-lit studio lighting, white background, high resolution close-up`;
    case 'ai-hat-tryon':
      return `A professional portrait photo of a young woman with no hat, medium-length brown hair, natural skin, neutral expression, front-facing, well-lit studio lighting, white background, head and shoulders visible, high resolution close-up`;
    case 'ai-model-swap':
      return `A full-body e-commerce product photo of a plain white mannequin wearing a stylish navy blue blazer, white t-shirt, and dark jeans. Clean white studio background, professional product photography lighting, high resolution`;
    case 'ai-face-symmetry':
      return `A professional headshot portrait of a young woman with a neutral expression, looking directly at the camera, face perfectly centered and front-facing. Clean, even studio lighting from both sides, no shadows. Hair pulled back neatly. Simple light gray background. High resolution, sharp focus on facial features`;
    case 'ai-gender-swap':
      return `A professional portrait photo of a young woman in her mid-20s with medium-length brown hair, natural makeup, warm brown eyes, neutral friendly expression, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up, photorealistic`;
    case 'ai-face-anonymizer':
      return `A professional portrait photo of a young woman in her late 20s with shoulder-length dark brown hair, natural skin, hazel eyes, neutral friendly expression, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up, photorealistic`;
    case 'ai-smart-recognition':
      return `A professional full-body fashion photo of a young woman in her mid-20s wearing a stylish outfit with a blazer, skirt, and heels, standing confidently in a well-lit studio. Clear details on clothing, accessories, and fabrics. Neutral light background, high resolution, photorealistic`;
    case 'ai-image-to-3d':
      return `A cute golden retriever puppy sitting and looking at the camera with a happy expression and tongue out. Clear well-lit photograph on a plain white background. High quality, sharp focus, centered composition. Photorealistic, 8K quality.`;
    case 'ai-couple-match':
      return `A side-by-side portrait of a young couple — on the left a young Asian woman with long black hair and warm smile, on the right a young Caucasian man with short brown hair and friendly grin. Both facing camera, shoulders visible, studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-tshirt-designer':
      return `A cute orange tabby cat sitting and looking at the camera with bright green eyes and a curious expression. Clear well-lit photograph on a plain white background. High quality, sharp focus, centered composition. Photorealistic, 8K quality.`;
    case 'ai-book-cover-designer':
      return `A dramatic mountain landscape at golden hour with snow-capped peaks, a winding river through a lush valley, and vibrant sunset clouds. Professional landscape photography, high resolution, 8K quality, sharp focus, centered composition.`;
    case 'ai-ad-designer':
      return `A sleek modern wireless headphone product photo on a clean white background. Premium matte black over-ear headphones with brushed metal accents, professionally lit with soft studio lighting, high-end product photography, sharp focus, centered composition. 8K quality.`;
    case 'ai-thumbnail-maker':
      return `A dramatic close-up portrait of a confident young man looking directly at the camera with an intense expression. He is pointing at the camera with one hand. Plain bright blue background. High contrast studio lighting, sharp focus, 16:9 landscape format. Professional YouTube creator portrait, 8K quality.`;
    case 'ai-color-palette-card':
      return `A breathtaking travel photo of a colorful sunset over a calm ocean, with warm orange and pink sky, deep teal water, and a silhouette of palm trees. Rich saturated colors, beautiful natural light, high dynamic range, sharp focus. Aesthetic lifestyle photography, 8K quality.`;
    case 'ai-manga-translator':
      return `A Japanese manga page with 4 panels showing an action scene. Two characters in dramatic poses with speech bubbles containing Japanese text (hiragana, katakana, kanji). Include sound effect text (onomatopoeia) in bold stylized Japanese lettering. Black and white manga art style with screentone shading, dynamic action lines, and expressive character faces. Professional manga page layout, vertical format, high quality.`;
    case 'ai-minecraft-skin':
      return `A professional portrait photo of a young man with short brown hair, wearing a plain blue t-shirt. Clean neutral gray background, studio lighting, sharp focus, front-facing, shoulders visible. Natural expression, photorealistic, high quality, 8K.`;
    case 'ai-3d-camera-control':
      return `A professional portrait photo of a young woman with medium-length dark brown hair, wearing a light gray blazer over a white shirt. Clean neutral light gray background, soft studio lighting, sharp focus, front-facing view, shoulders and upper torso visible. Natural confident expression, photorealistic, high quality, 8K.`;
    case 'ai-body-swap':
      return `A professional portrait photo of a young man with short dark hair, wearing a casual navy blue t-shirt. Clean neutral gray background, studio lighting, sharp focus, front-facing, head and upper body visible. Natural relaxed expression, photorealistic, high quality, 8K.`;
    case 'ai-hairstyle-analysis':
      return `A professional headshot portrait photo of a young woman with medium-length wavy brown hair, natural skin, minimal makeup, neutral pleasant expression, front-facing, hair clearly visible and well-lit. ${common}`;
    case 'ai-emoji-mosaic':
      return `A vibrant colorful photograph of a young woman smiling warmly, wearing a bright yellow sweater, against a colorful mural wall background. Rich colors, sharp details, high contrast, good lighting. ${common}`;
    case 'ai-face-swap':
      return `A professional portrait photo of a young man with short dark hair and a friendly expression, wearing a casual gray shirt. Clean neutral background, studio lighting, sharp focus, front-facing, head and shoulders visible. Photorealistic, high quality, 8K.`;
    case 'ai-celebrity-lookalike':
      return `A casual photo of an ordinary young woman with shoulder-length brown hair, soft natural skin (no makeup), wearing a plain white t-shirt. Clean neutral light gray background, even soft natural lighting, sharp focus, front-facing, shoulders visible. Natural relaxed expression, photorealistic, high quality, 8K.`;
    case 'ai-yearbook-generator':
      return `A clean modern color portrait photo of a young person in their early 20s with neutral expression, natural untreated hair, no makeup, plain white t-shirt. Clean light gray studio background, even soft modern lighting, sharp focus, front-facing, head and shoulders visible. Modern smartphone-quality photo, photorealistic, 8K quality.`;
    case 'ai-passport-photo-maker':
      return `A casual color selfie of a young person in their late 20s, slightly off-center, taken indoors with natural window light, wearing a plain casual t-shirt, neutral expression. Cluttered living room background with furniture and decor visible behind. Phone-quality photo, slightly uneven lighting. Photorealistic, 8K quality.`;
    case 'ai-face-expression-changer':
      return `A professional close-up portrait photo of a young woman in her mid-20s with a completely neutral relaxed expression — mouth gently closed, eyes calmly open, brows relaxed, no smile, no frown. Natural clear skin, light makeup, shoulder-length brown hair. ${common}`;
    case 'ai-skin-type':
      return `A clean close-up beauty portrait photo of a young woman in her mid-20s with a completely bare face, no makeup at all, hair pulled back away from the face. Balanced, healthy-looking neutral skin with natural texture — neither oily nor dry, no redness. Calm relaxed expression, front-facing, even soft studio lighting on a plain light background. Sharp focus on the facial skin. Photorealistic, 8K quality.`;
    case 'ai-skin-concern':
      return `An extreme macro close-up dermatology photograph of a patch of clean, smooth, healthy human facial skin (cheek), filling the entire frame. Natural fine skin texture, even tone, soft pores, no blemishes. Even diffuse clinical lighting, sharp focus, shallow depth of field. Photorealistic skin macro, 8K quality. No full face, only a close-up patch of skin.`;
    case 'ai-room-cleaner':
      return `A wide-angle interior photograph of a moderately cluttered modern living room with a beige sofa, wooden coffee table, floor lamp, rug, bookshelf with books, picture frames on the walls, throw pillows, a folded blanket, magazines on the table, a coffee mug, scattered cables, slippers on the floor, and decorative plants. Natural daylight from a window. Photorealistic interior real-estate photography, sharp focus, 4:3 aspect ratio, 8K quality.`;
    case 'ai-room-planner':
      return `A wide-angle interior photograph of a plain, lightly furnished living room with white walls, hardwood floors, a simple gray sofa, a basic coffee table, a window with sheer curtains, and minimal decor. Bright natural daylight. Neutral, undecorated base look ready for restyling. Photorealistic interior photography, sharp focus, 4:3 aspect ratio, 8K quality.`;
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
    case 'ai-yearbook-generator':
      return buildYearbookTransformPrompt(preset);
    case 'ai-passport-photo-maker':
      return buildPassportPhotoTransformPrompt(preset);
    case 'ai-face-expression-changer':
      return buildExpressionTransformPrompt(preset);
    case 'ai-skin-type':
      return buildSkinTypeTransformPrompt(preset);
    case 'ai-skin-concern':
      return buildSkinConcernTransformPrompt(preset);
    case 'ai-room-cleaner':
      return buildRoomCleanerTransformPrompt(preset);
    case 'ai-room-planner':
      return buildRoomPlannerTransformPrompt(preset);
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
    case 'ai-face-pair':
      return buildFacePairTransformPrompt(preset.name);
    case 'ai-skin-analyzer':
      return buildSkinAnalyzerTransformPrompt(preset.name);
    case 'ai-eyewear-tryon':
      return buildEyewearTryonTransformPrompt(preset.name);
    case 'ai-aesthetic-sim':
      return buildAestheticSimTransformPrompt(preset.name);
    case 'ai-teeth-whitening':
      return buildTeethWhiteningTransformPrompt(preset.name);
    case 'ai-skin-smoother':
      return buildSkinSmootherTransformPrompt(preset.name);
    case 'ai-room-redesign':
      return buildRoomRedesignTransformPrompt(preset.name);
    case 'ai-double-chin-remover':
      return buildDoubleChinRemoverTransformPrompt(preset.name);
    case 'ai-hat-tryon':
      return buildHatTryonTransformPrompt(preset.name);
    case 'ai-model-swap':
      return buildModelSwapTransformPrompt(preset.name);
    case 'ai-face-symmetry':
      return buildFaceSymmetryTransformPrompt(preset.name);
    case 'ai-gender-swap':
      return buildGenderSwapTransformPrompt(preset.name);
    case 'ai-face-anonymizer':
      return buildFaceAnonymizerTransformPrompt(preset.name);
    case 'ai-smart-recognition':
      return buildSmartRecognitionTransformPrompt(preset.name);
    case 'ai-image-to-3d':
      return buildImageTo3dTransformPrompt(preset.name);
    case 'ai-couple-match':
      return buildCoupleMatchTransformPrompt(preset.name);
    case 'ai-tshirt-designer':
      return buildTshirtDesignerTransformPrompt(preset.name);
    case 'ai-book-cover-designer':
      return buildBookCoverDesignerTransformPrompt(preset.name);
    case 'ai-ad-designer':
      return buildAdDesignerTransformPrompt(preset.name);
    case 'ai-thumbnail-maker':
      return buildThumbnailMakerTransformPrompt(preset.name);
    case 'ai-color-palette-card':
      return buildColorPaletteCardTransformPrompt(preset.name);
    case 'ai-manga-translator':
      return buildMangaTranslatorTransformPrompt(preset.name);
    case 'ai-minecraft-skin':
      return buildMinecraftSkinTransformPrompt(preset.name);
    case 'ai-3d-camera-control':
      return build3dCameraControlTransformPrompt(preset.name);
    case 'ai-body-swap':
      return buildBodySwapTransformPrompt(preset.name);
    case 'ai-hairstyle-analysis':
      return buildHairstyleAnalysisTransformPrompt(preset.name);
    case 'ai-emoji-mosaic':
      return buildEmojiMosaicTransformPrompt(preset.name);
    case 'ai-face-swap':
      return buildFaceSwapTransformPrompt(preset.name);
    case 'ai-celebrity-lookalike':
      return buildCelebrityLookalikeTransformPrompt(preset.name);
  }
}

function buildCelebrityLookalikeTransformPrompt(presetName: string): string {
  const baseRule = 'Transform the subject into a celebrity-styled version of themselves while keeping their core facial identity recognizable. Preserve the subject\'s clothing and background. Photorealistic editorial-quality result.';
  switch (presetName) {
    case 'A-List Hollywood':
      return `${baseRule} Style: top-tier A-list Hollywood movie star — glamorous red-carpet lighting, polished hair and makeup, confident magazine-cover expression, sharp jawline, glowing flawless skin.`;
    case 'K-Pop Idol':
      return `${baseRule} Style: K-Pop idol — porcelain glass skin, defined V-shape jawline, large bright eyes, soft natural-pink lip, perfectly styled trendy K-pop hairstyle, bright studio idol photoshoot lighting.`;
    case 'Bollywood Star':
      return `${baseRule} Style: Bollywood film star — warm golden-hour lighting, rich dramatic makeup, defined kohl-rimmed eyes, glowing tan skin, glamorous hairstyle, cinematic romantic expression.`;
    case 'Hollywood Classic':
      return `${baseRule} Style: 1950s Hollywood golden-age icon — vintage glamour lighting, classic red lip, elegant retro hairstyle (finger waves or pin curls), soft pearlescent skin, sophisticated old-Hollywood expression.`;
    case 'Movie Hero':
      return `${baseRule} Style: action-movie leading hero — chiseled features, strong jawline, dramatic side lighting, intense determined expression, slightly weathered heroic look, cinematic blue-orange color grade.`;
    case 'Fashion Icon':
      return `${baseRule} Style: high-fashion runway icon — editorial Vogue-style lighting, sharp avant-garde makeup, sculpted cheekbones, intense fashion-photo gaze, polished editorial hairstyle.`;
    case 'Pop Star':
      return `${baseRule} Style: chart-topping pop star — youthful glowing skin, vibrant trendy makeup, dynamic styled hair, energetic confident expression, colorful music-video lighting.`;
    case 'Indie Charm':
      return `${baseRule} Style: indie-film leading actor — natural soft daylight, minimal makeup, authentic candid expression, effortlessly tousled hair, warm filmic color grade.`;
    default:
      return `${baseRule} Style: ${presetName} celebrity aesthetic, professional studio polish.`;
  }
}

function buildFaceSwapTransformPrompt(presetName: string): string {
  // Face swap demos must show a DIFFERENT PERSON's face on the same body/pose.
  // Each preset targets a contrasting demographic so the swap is visually obvious.
  const baseRule = 'CRITICAL FACE SWAP TASK: Replace ONLY the face region in this image with a COMPLETELY DIFFERENT PERSON\'s face. Keep IDENTICAL: the body, pose, hair (color, length, style), clothing, background, lighting direction, shadows, and overall composition. The new face must belong to a different individual with visibly different facial features (different eye shape, nose, mouth, jawline, ethnicity, gender, or age as specified). Photorealistic seamless integration with matched skin tone and lighting on the new face. No blurring, no distortion, no style change — only a clean face identity swap.';

  switch (presetName) {
    case 'Movie Star':
      return `${baseRule} The replacement face is: a young East Asian man in his mid-20s, sharp jawline, short black hair (note: keep the ORIGINAL hairstyle from the photo, only the face inside the hairline changes), confident neutral expression, clean-shaven, medium skin tone. Result: same body and outfit, but the face is now this Asian man's face.`;
    case 'Renaissance Portrait':
      return `${baseRule} The replacement face is: a young Latina woman in her early 20s, warm olive skin tone, dark brown eyes, soft smile, defined cheekbones (keep the ORIGINAL hairstyle, only the face inside the hairline changes). Result: same body and outfit, but the face is now this Latina woman's face.`;
    case 'Anime Character':
      return `${baseRule} The replacement face is: a young Black woman in her mid-20s, warm dark brown skin, bright eyes, gentle smile, soft round features (keep the ORIGINAL hairstyle, only the face inside the hairline changes). Result: same body and outfit, but the face is now this Black woman's face.`;
    default:
      return `${baseRule} Replace the face with a clearly different person of a different gender or ethnicity from the original.`;
  }
}

function buildSkinSmootherTransformPrompt(presetName: string): string {
  const skinSmootherMap: Record<string, string> = {
    'Natural Smooth': 'Apply subtle skin smoothing to this portrait, softening pores and minor blemishes while preserving natural skin texture and character. The result should look like naturally healthy skin, not filtered. Keep all other features identical.',
    'Porcelain': 'Transform this portrait\'s skin to a flawless porcelain finish. Smooth pores completely, even out skin tone to a perfect matte complexion, remove all blemishes. The skin should look like smooth porcelain with a soft matte quality. Keep all other features identical.',
    'Glass Skin': 'Apply the Korean glass skin effect to this portrait. Make the skin appear extremely smooth, translucent, and dewy with a luminous inner glow. Blur all pores, create a wet-look hydrated sheen as if the skin is made of glass. Keep all other features identical.',
    'Soft Focus': 'Apply a dreamy soft focus skin effect to this portrait. Smooth skin with a gentle diffused blur creating a soft ethereal quality, like a soft focus photography lens. Slight glow around facial features, dreamy and romantic aesthetic. Keep all other features identical.',
    'Matte Finish': 'Apply an oil-free matte skin finish to this portrait. Remove all shine and oil, smooth pores, create a completely flat matte complexion with no highlights or dewy areas. Clean, fresh, shine-free skin. Keep all other features identical.',
    'Anti-Wrinkle': 'Apply anti-aging skin smoothing to this portrait. Reduce and soften fine lines and wrinkles around the eyes, forehead, and mouth. Smooth skin while preserving facial structure and natural look. The result should appear more youthful but still realistic. Keep all other features identical.',
    'Blemish Clear': 'Remove all acne, spots, blemishes, and skin imperfections from this portrait. Clear all pimples, dark spots, redness, and uneven areas. Leave skin looking clear and healthy with natural skin texture intact. Keep all other features identical.',
    'Airbrushed': 'Apply a full professional magazine airbrush retouching effect to this portrait. Completely smooth all skin texture, pores, and blemishes to achieve a flawless editorial beauty look. High-fashion magazine cover quality skin retouching. Keep all other features identical.',
  };

  return skinSmootherMap[presetName] || `Apply ${presetName} skin smoothing effect to this portrait, photorealistic result keeping all other features identical.`;
}

function buildRoomRedesignTransformPrompt(presetName: string): string {
  const roomStyleMap: Record<string, string> = {
    'Modern': 'Redesign this room in a sleek Modern interior style. Clean lines, neutral color palette with white, gray, and black accents. Minimalist furniture with smooth surfaces, open layout, contemporary art on walls. Stainless steel and glass accents, recessed lighting. Keep room structure and windows identical.',
    'Minimalist': 'Redesign this room in a Minimalist interior style. Extremely clean and uncluttered space, only essential furniture pieces. Monochromatic white and light gray palette, hidden storage, no decorative objects. Zen-like simplicity, natural light emphasis. Keep room structure and windows identical.',
    'Scandinavian': 'Redesign this room in a Scandinavian interior style. Light wood furniture (oak, birch), white walls, cozy textiles in muted tones. Hygge atmosphere with sheepskin throws, candles, and plants. Clean lines but warm and inviting. Neutral palette with soft blues and greens. Keep room structure and windows identical.',
    'Industrial': 'Redesign this room in an Industrial loft interior style. Exposed brick walls, metal and iron accents, Edison bulb lighting. Raw concrete elements, reclaimed wood furniture, leather seating. Dark color palette with warm amber lighting. Visible pipes and ductwork. Keep room structure and windows identical.',
    'Mid-Century Modern': 'Redesign this room in a Mid-Century Modern interior style. Retro 1950s-60s furniture with organic curves and tapered legs. Warm wood tones (teak, walnut), bold accent colors (mustard yellow, avocado green, burnt orange). Iconic design pieces, geometric patterns. Keep room structure and windows identical.',
    'Bohemian': 'Redesign this room in a Bohemian interior style. Eclectic mix of colorful textiles, macramé wall hangings, layered rugs and cushions. Abundant houseplants, rattan and wicker furniture, warm earthy tones mixed with vibrant jewel tones. Collected and lived-in aesthetic. Keep room structure and windows identical.',
    'Japanese Zen': 'Redesign this room in a Japanese Zen interior style. Tatami-inspired flooring, low furniture (floor seating, futon), shoji screen dividers. Natural materials (bamboo, paper, stone), minimal ornamentation. Neutral earthy palette, bonsai plants, perfect harmony and balance. Keep room structure and windows identical.',
    'Coastal': 'Redesign this room in a Coastal beach-inspired interior style. White and light blue color palette, natural driftwood and rattan furniture, nautical accents. Linen and cotton textiles, sea-inspired decorative elements (shells, coral), abundant natural light. Relaxed and airy atmosphere. Keep room structure and windows identical.',
  };
  return roomStyleMap[presetName] || `Redesign this room in a ${presetName} interior design style. Transform furniture, decor, colors, and materials to match the aesthetic. Keep room structure and windows identical.`;
}

function buildDoubleChinRemoverTransformPrompt(presetName: string): string {
  const chinStyleMap: Record<string, string> = {
    'Subtle': 'Very slightly reduce the double chin area. Minimal jawline adjustment, barely noticeable change. Keep the face looking completely natural with just a slight tightening under the chin. Preserve identity, expression, and all other features exactly.',
    'Natural': 'Remove the double chin with a natural-looking reduction. Define the jawline moderately while keeping facial proportions realistic. The result should look like a naturally slim jawline. Preserve identity, expression, and all other features exactly.',
    'Contour': 'Remove the double chin and add visible jawline contouring and definition. Create clear separation between chin and neck with enhanced shadow and highlight. Professional contouring look. Preserve identity, expression, and all other features exactly.',
    'V-Line': 'Remove the double chin and reshape the jawline into a Korean V-line shape. Create a pointed, tapered chin with a narrow lower face. Elegant V-shaped jawline popular in Korean beauty standards. Preserve identity, expression, and all other features exactly.',
    'Slim': 'Remove the double chin and slim the entire lower face area. Reduce fullness in cheeks and chin for an overall slimmer facial appearance. Medium-level transformation. Preserve identity, expression, and all other features exactly.',
    'Sharp Jawline': 'Remove the double chin and create a sharp, angular jawline. Chiseled, well-defined jaw angles with strong bone structure appearance. Masculine-inspired defined jaw. Preserve identity, expression, and all other features exactly.',
    'Sculpted': 'Remove the double chin and fully sculpt the jawline and lower face. Comprehensive reshaping with enhanced bone structure, defined jaw angles, and smooth chin-to-neck transition. Professional sculpting result. Preserve identity, expression, and all other features exactly.',
    'Dramatic': 'Dramatically remove all traces of double chin and create maximum jawline definition. Very noticeable transformation with extremely defined, sculpted jawline. The most intense level of chin reduction and jaw reshaping. Preserve identity, expression, and all other features exactly.',
  };
  return chinStyleMap[presetName] || `Remove the double chin and reshape the jawline using a ${presetName} level transformation. Preserve identity and expression.`;
}

function buildHatTryonTransformPrompt(presetName: string): string {
  const hatStyleMap: Record<string, string> = {
    'Baseball Cap': 'Add a classic baseball cap on this person\'s head. The cap should be a solid dark blue color, properly fitted, with the brim facing forward. Realistic placement matching head angle and size, natural shadows under the brim on the face. Keep all facial features, expression, and identity identical.',
    'Beanie': 'Add a knitted beanie hat on this person\'s head. The beanie should be dark gray, snug-fitting, covering the top of the head and ears, with a slight fold at the bottom edge. Realistic wool texture, natural fit. Keep all facial features, expression, and identity identical.',
    'Fedora': 'Add a classic fedora hat on this person\'s head. The fedora should be charcoal gray felt with a black ribbon band, properly angled slightly to one side, with a pinched crown. Realistic shadows and proportions. Keep all facial features, expression, and identity identical.',
    'Bucket Hat': 'Add a casual bucket hat on this person\'s head. The hat should be khaki/tan colored cotton, with a soft downward-sloping brim all around, relaxed casual fit. Realistic fabric texture and shadows. Keep all facial features, expression, and identity identical.',
    'Cowboy Hat': 'Add a Western cowboy hat on this person\'s head. The hat should be brown leather or suede, with a wide curved brim and high crown, classic Western shape. Realistic shadows and proportions matching head size. Keep all facial features, expression, and identity identical.',
    'Beret': 'Add a French-style beret on this person\'s head. The beret should be black wool, worn tilted to one side, flat round shape, classic Parisian style. Realistic fabric texture and positioning. Keep all facial features, expression, and identity identical.',
    'Sun Hat': 'Add a wide-brimmed sun hat on this person\'s head. The hat should be natural straw colored, with a very wide floppy brim for sun protection, light and summery. Realistic straw texture and shadows on face from the brim. Keep all facial features, expression, and identity identical.',
    'Snapback': 'Add a flat-brimmed snapback cap on this person\'s head. The cap should be black with a flat brim, structured crown, modern streetwear style. Realistic placement with the brim facing forward, natural shadows. Keep all facial features, expression, and identity identical.',
  };
  return hatStyleMap[presetName] || `Add a ${presetName} hat on this person's head. Realistic placement, natural shadows. Keep all facial features identical.`;
}

function buildModelSwapTransformPrompt(presetName: string): string {
  const modelSwapMap: Record<string, string> = {
    'Young Asian Woman': 'Replace the mannequin in this product photo with a young Asian woman model in her early 20s. She has straight black hair, warm skin tone, and a natural friendly expression. Keep the exact same clothing, fit, pose, lighting, and background. The clothing should drape naturally on her body. Professional e-commerce quality.',
    'Young Caucasian Woman': 'Replace the mannequin in this product photo with a young Caucasian woman model in her early 20s. She has light brown hair, fair skin, and a confident smile. Keep the exact same clothing, fit, pose, lighting, and background. The clothing should drape naturally on her body. Professional e-commerce quality.',
    'Young Black Woman': 'Replace the mannequin in this product photo with a young Black woman model in her early 20s. She has natural curly dark hair, rich dark skin tone, and a warm smile. Keep the exact same clothing, fit, pose, lighting, and background. The clothing should drape naturally on her body. Professional e-commerce quality.',
    'Young Asian Man': 'Replace the mannequin in this product photo with a young Asian man model in his early 20s. He has short black hair, warm skin tone, and a relaxed confident expression. Keep the exact same clothing, fit, pose, lighting, and background. The clothing should drape naturally on his body. Professional e-commerce quality.',
    'Young Caucasian Man': 'Replace the mannequin in this product photo with a young Caucasian man model in his early 20s. He has short brown hair, fair skin, and a natural smile. Keep the exact same clothing, fit, pose, lighting, and background. The clothing should drape naturally on his body. Professional e-commerce quality.',
    'Young Black Man': 'Replace the mannequin in this product photo with a young Black man model in his early 20s. He has short dark hair, rich dark skin tone, and a confident expression. Keep the exact same clothing, fit, pose, lighting, and background. The clothing should drape naturally on his body. Professional e-commerce quality.',
    'Latina Woman': 'Replace the mannequin in this product photo with a young Latina woman model in her early 20s. She has wavy dark brown hair, olive skin tone, and a warm inviting smile. Keep the exact same clothing, fit, pose, lighting, and background. The clothing should drape naturally on her body. Professional e-commerce quality.',
    'South Asian Woman': 'Replace the mannequin in this product photo with a young South Asian woman model in her early 20s. She has long dark hair, warm brown skin tone, and an elegant expression. Keep the exact same clothing, fit, pose, lighting, and background. The clothing should drape naturally on her body. Professional e-commerce quality.',
  };
  return modelSwapMap[presetName] || `Replace the mannequin with a ${presetName} model. Keep exact same clothing, pose, lighting, and background. Professional e-commerce quality.`;
}

function buildFaceSymmetryTransformPrompt(presetName: string): string {
  const symmetryMap: Record<string, string> = {
    'Overall Symmetry': 'Add a professional facial symmetry analysis overlay to this portrait. Draw a precise vertical center line down the middle of the face. Add horizontal guide lines connecting matching landmark pairs: eyes, eyebrows, nostrils, lip corners, cheekbones, and jaw angles. Show an overall symmetry score (e.g. "87%") at the top. Use green lines where features are well-balanced and yellow/red where asymmetry exists. Add a letter grade (A+ to F). Clean clinical infographic style overlay on the original photo.',
    'Eye Symmetry': 'Add a detailed eye symmetry analysis overlay to this portrait. Draw measurement lines showing: eye width comparison left vs right, eye opening height, inner and outer corner positions, eye tilt angle, and pupil distance from center line. Show an eye symmetry score percentage. Use green for matching measurements and red for differences. Focus the analysis on the eye region with a zoomed panel. Clinical infographic style.',
    'Eyebrow Symmetry': 'Add a detailed eyebrow symmetry analysis overlay to this portrait. Draw measurement lines showing: brow arch height comparison, brow thickness at multiple points, brow start/peak/end position alignment, and brow angle comparison. Show an eyebrow symmetry score percentage. Use green for matching and red for differences. Clinical infographic style overlay.',
    'Nose Symmetry': 'Add a detailed nose symmetry analysis overlay to this portrait. Draw measurement lines showing: bridge alignment from center line, nostril width comparison left vs right, nostril shape overlay, nasal tip position relative to center, and columella angle. Show a nose symmetry score percentage. Use green for aligned and red for deviated. Clinical infographic style.',
    'Lip Symmetry': 'Add a detailed lip symmetry analysis overlay to this portrait. Draw measurement lines showing: cupid\'s bow center alignment, upper lip height left vs right, lower lip volume comparison, lip corner height alignment, and philtrum center line. Show a lip symmetry score percentage. Use green for balanced and red for asymmetric. Clinical infographic style.',
    'Cheekbone Symmetry': 'Add a detailed cheekbone symmetry analysis overlay to this portrait. Draw contour mapping showing: cheekbone prominence comparison left vs right, malar width measurement, cheek contour lines overlaid, and mid-face volume balance indicators. Show a cheekbone symmetry score percentage. Use color-coded contour mapping (green=balanced, red=asymmetric). Clinical infographic style.',
    'Jawline Symmetry': 'Add a detailed jawline symmetry analysis overlay to this portrait. Draw measurement lines showing: jaw angle comparison left vs right, mandibular contour lines, chin center alignment, gonial angle measurements, and jaw width comparison. Show a jawline symmetry score percentage. Use green for symmetric and red for asymmetric. Clinical infographic style.',
    'Golden Ratio': 'Add a golden ratio (Phi = 1.618) analysis overlay to this portrait. Draw the golden ratio mask/grid over the face. Show key ratio measurements: face length to width, nose length to face length, eye spacing to nose width, lip width to nose width. Overlay a golden spiral on facial features. Show percentage match to ideal phi proportions and an overall golden ratio score. Use elegant gold-colored measurement lines and annotations. Premium aesthetic style.',
  };
  return symmetryMap[presetName] || `Add a ${presetName} facial symmetry analysis overlay to this portrait with measurement lines and a symmetry score. Clinical infographic style.`;
}

function buildGenderSwapTransformPrompt(presetName: string): string {
  const genderSwapMap: Record<string, string> = {
    'Female Natural': 'Transform this portrait into a natural-looking female version. Soften the jawline slightly, add subtle feminine features like longer eyelashes, slightly fuller lips, smoother skin texture, and naturally shaped eyebrows. Add medium-length hair in a natural style. Keep the overall identity recognizable. Photorealistic result.',
    'Male Natural': 'Transform this portrait into a natural-looking male version. Strengthen the jawline, add subtle masculine features like a broader nose bridge, more defined brow ridge, slightly rougher skin texture, and shorter cropped hair. Add light facial hair shadow. Keep the overall identity recognizable. Photorealistic result.',
    'Androgynous': 'Transform this portrait into an androgynous look that blends masculine and feminine features equally. Smooth, even skin with gender-neutral features, a balanced jawline neither too sharp nor too soft, medium-length styled hair, subtle natural brows, and no strong gender markers. Keep the overall identity recognizable. Photorealistic result.',
    'Soft Feminine': 'Transform this portrait into a soft feminine look. Add clearly feminine features: very smooth porcelain-like skin, full soft lips with natural pink tint, long flowing hair, delicate arched eyebrows, large expressive eyes with visible lashes, a rounded soft jawline and chin. Keep the overall identity recognizable. Photorealistic result.',
    'Strong Masculine': 'Transform this portrait into a strongly masculine look. Add pronounced masculine features: a square heavy jawline, prominent brow ridge, rougher textured skin, thick eyebrows, broader nose, visible facial stubble or short beard, short masculine hairstyle, and a wider neck. Keep the overall identity recognizable. Photorealistic result.',
    'Glamorous Female': 'Transform this portrait into a glamorous female look. Add feminine features with a polished, celebrity-style aesthetic: flawless radiant skin, perfectly shaped brows, full glossy lips, dramatic eyes with visible makeup (smokey eyes or winged liner), voluminous styled hair, high cheekbones with natural contour. Keep the overall identity recognizable. Photorealistic result.',
    'Rugged Male': 'Transform this portrait into a rugged masculine look. Add strong masculine features: defined jawline with visible stubble or short beard, weathered sun-touched skin texture, thick natural eyebrows, deeper-set eyes, slightly tousled short hair, broader face structure, visible laugh lines for character. Keep the overall identity recognizable. Photorealistic result.',
    'Elegant Female': 'Transform this portrait into an elegant feminine look. Add graceful feminine features: refined smooth skin, perfectly arched thin eyebrows, delicate lip shape with natural color, sophisticated updo or sleek hairstyle, slender neck, high cheekbones, a gentle oval face shape, subtle natural glow. Keep the overall identity recognizable. Photorealistic result.',
  };
  return genderSwapMap[presetName] || `Transform this portrait to show a ${presetName} gender appearance while keeping identity recognizable. Photorealistic result.`;
}

function buildFaceAnonymizerTransformPrompt(presetName: string): string {
  const anonymizerMap: Record<string, string> = {
    'Natural Look-alike': 'Replace this person\'s face with an AI-generated synthetic face that closely resembles the original in age, gender, ethnicity, and hair style but is a completely different person. The result must look like a natural real photograph of someone else. Preserve pose, clothing, and background exactly.',
    'Subtle Disguise': 'Apply subtle anonymization to this person\'s face. Alter key identifying features — slightly change eye shape, nose width, jawline contour, lip shape, and eyebrow arch — just enough to make the person unrecognizable while keeping the overall look natural and realistic. Preserve pose, clothing, and background.',
    'Full Replace': 'Completely replace this person\'s face with an entirely different AI-generated face of a different person. Different bone structure, different features, different look — while matching the general age range. Maintain natural photographic quality. Preserve pose, clothing, and background.',
    'Pixel Mosaic': 'Apply a strong pixelation mosaic effect to this person\'s face area only, creating large blocky square pixels that completely obscure all facial features. The pixelation should cover the entire face from forehead to chin. Keep the rest of the image sharp and unchanged.',
    'Gaussian Blur': 'Apply a heavy Gaussian blur effect to this person\'s face area only, creating a smooth soft blur that completely obscures all facial features. The blur should cover the entire face from forehead to chin. Keep the rest of the image completely sharp and unchanged.',
    'Silhouette': 'Replace this person\'s face with a solid dark silhouette shape. The silhouette should be a smooth solid black shape that follows the outline of the head and face, completely obscuring all features. Keep the rest of the image unchanged and sharp.',
    'Digital Mask': 'Overlay a futuristic digital mask effect on this person\'s face. Apply a glowing neon-lined geometric mask pattern with holographic elements covering all facial features. The mask should look like a high-tech privacy filter with subtle light effects and digital grid lines. Keep the rest unchanged.',
    'Oil Paint': 'Transform this person\'s face into an artistic oil painting style. Apply thick visible brush strokes, impasto texture, and painterly color blending to all facial features. The face should look like a hand-painted portrait — recognizably a face but impossible to identify the actual person. Keep the rest of the image as a photograph.',
  };
  return anonymizerMap[presetName] || `Apply ${presetName} face anonymization to this portrait, obscuring the person's identity while maintaining a natural look.`;
}

function buildSmartRecognitionTransformPrompt(presetName: string): string {
  const recognitionMap: Record<string, string> = {
    'Fashion Analysis': 'Add a tech HUD analysis overlay to this image focused on fashion and clothing recognition. Include dashed bounding boxes around clothing items and accessories, zoomed-in detail panels showing fabric textures. Add labels like "ANALYSIS MODE: CLOTHING & BIOMETRICS", a subject ID number, timestamp in the corner, hex color codes for detected colors, and technical data readouts. The overlay should look like an AI fashion scanner with neon-colored annotation lines on top of the original photo.',
    'Face Recognition': 'Add a facial recognition analysis HUD overlay to this image. Place a recognition bounding box around the face with corner markers. Add circular zoomed-in detail panels for eyes, lips, hair, and skin with technical labels. Include facial landmark data, confidence scores, and a "FACIAL ANALYSIS" header. The overlay should look like a high-tech biometric scanner with glowing annotation lines on top of the original photo.',
    'Product Analysis': 'Add a product analysis HUD overlay to this image. Include dashed bounding boxes around the product, zoomed-in detail panels showing textures and surface details. Add labels like "PRODUCT ANALYSIS", a product ID code, hex color codes for dominant colors, and composition data readouts. The overlay should look like an AI product inspection scanner on top of the original photo.',
    'Logo Detection': 'Add a brand and logo detection HUD overlay to this image. Include bounding boxes around visual elements, text recognition callouts, color analysis panels showing hex codes and RGB values. Add labels like "LOGO ANALYSIS", brand identification data, and font detection readouts. The overlay should look like an AI brand recognition scanner on top of the original photo.',
    'Full Body Scan': 'Add a full body biometric scan HUD overlay to this image. Include a full-body outline with measurement annotations, multiple bounding boxes for different body regions, zoomed-in detail panels for key areas. Add labels like "BIOMETRIC SCAN", body proportion data, posture analysis indicators, and a grid overlay. The overlay should look like a futuristic body scanner on top of the original photo.',
    'Surveillance Feed': 'Add a surveillance camera feed HUD overlay to this image. Include a "REC" indicator with blinking dot, timestamp in the corner, camera angle data, grid overlay lines, motion detection bounding boxes, and slight green tint on edges. Add labels like "CAM-01", frame counter, and security markers. The overlay should look like authentic CCTV footage on top of the original photo.',
    'Color Palette': 'Add a color extraction and analysis HUD overlay to this image. Include multiple color sample boxes with hex codes, RGB and HSL values for dominant colors, color proportion indicators, and gradient analysis lines. Add labels like "COLOR ANALYSIS", palette suggestions, and contrast ratio data. The overlay should look like a professional color analysis tool on top of the original photo.',
    'Technical Blueprint': 'Add a technical blueprint analysis HUD overlay to this image. Include engineering-style measurement lines with dimensions, cross-section indicators, material composition callouts, and structural analysis annotations. Add labels like "TECHNICAL ANALYSIS", wireframe elements, specification tables, and schematic dotted guidelines. The overlay should have a blue-tinted technical aesthetic on top of the original photo.',
  };
  return recognitionMap[presetName] || `Add a ${presetName} smart recognition HUD overlay to this image with bounding boxes, data readouts, and technical annotations on top of the original photo.`;
}

function buildImageTo3dTransformPrompt(presetName: string): string {
  const threeDMap: Record<string, string> = {
    'Clay Render': 'Transform this image into a 3D clay render style. Convert the subject into a smooth matte clay sculpture with soft diffused lighting, subtle ambient occlusion shadows, and a neutral warm clay color palette. The object should look like a handmade clay model photographed in a studio. Remove all original textures and replace with uniform clay material.',
    'Low Poly': 'Transform this image into a low-poly 3D art style. Convert the subject into a faceted geometric mesh with flat-shaded triangular faces, sharp polygon edges, and bold color blocks. The result should look like a stylized low-polygon 3D game asset with visible triangulated geometry and clean minimal color palette.',
    'Isometric': 'Transform this image into an isometric 3D view. Convert the subject into a tilted isometric perspective (30-degree angle) with clean edges, flat colors, and miniature diorama feel. The result should look like an isometric game asset or architectural model viewed from above at an angle.',
    'Realistic 3D': 'Transform this image into a photorealistic 3D render. Add dramatic depth, volumetric lighting with soft shadows, subsurface scattering where appropriate, and realistic material properties. The subject should look like a high-quality 3D model rendered in a professional 3D software with ray tracing.',
    'Cartoon 3D': 'Transform this image into a Pixar/Disney-style cartoon 3D render. Convert the subject into a cute stylized 3D character or object with smooth rounded shapes, exaggerated proportions, bright saturated colors, and soft gradient lighting. The result should look like a frame from an animated movie.',
    'Wireframe': 'Transform this image into a 3D wireframe mesh visualization. Convert the subject into a network of thin lines showing the underlying 3D mesh structure on a dark background. Show vertices, edges, and polygon outlines in glowing cyan or green lines. The result should look like a 3D modeling software wireframe view.',
    'Voxel': 'Transform this image into voxel art (3D pixel art). Convert the subject into blocky cubic voxels like Minecraft-style 3D pixel art. Each voxel should be a visible cube with clear edges. The result should have a charming retro 3D aesthetic with a limited but colorful palette.',
    'Metallic': 'Transform this image into a metallic chrome 3D render. Convert the subject into a shiny reflective metallic sculpture with mirror-like chrome surface, environment reflections, caustic light highlights, and dramatic studio lighting. The result should look like a polished metal figurine.',
  };
  return threeDMap[presetName] || `Transform this image into a ${presetName} 3D style render with professional quality lighting and materials.`;
}

function buildTshirtDesignerTransformPrompt(presetName: string): string {
  const tshirtMap: Record<string, string> = {
    'Minimalist': 'Transform this image into a clean minimalist t-shirt design. Create a simple elegant graphic with clean lines, minimal colors (black, white, or one accent), plenty of negative space. Show the design printed on a plain white t-shirt product mockup, folded neatly on a clean surface.',
    'Vintage Retro': 'Transform this image into a vintage retro t-shirt design. Apply distressed worn-out texture, faded colors, retro screen print aesthetic from the 70s-80s. Add subtle grain, cracked ink effect, muted orange/brown palette. Show on a vintage-wash t-shirt mockup.',
    'Pop Art': 'Transform this image into a bold Andy Warhol-style pop art t-shirt design. Use vibrant contrasting colors, halftone dots, thick black outlines, dramatic color blocks. Create a striking pop art graphic. Show on a bright colored t-shirt mockup.',
    'Typography': 'Transform this image into an artistic typography-based t-shirt design. Incorporate the subject into creative text art using letters, words, font compositions. Mix serif and sans-serif, varied sizes. Show on a clean t-shirt mockup.',
    'Watercolor': 'Transform this image into a beautiful watercolor art t-shirt design. Create soft flowing watercolor splashes, blended colors, paint drips, wet-on-wet effects, artistic brush strokes. Show on a light-colored t-shirt mockup.',
    'Streetwear': 'Transform this image into an urban streetwear t-shirt design. Apply graffiti-style graphics, bold urban typography, spray paint textures, street art aesthetic with edgy composition. Show on an oversized black t-shirt mockup.',
    'Abstract': 'Transform this image into an abstract geometric art t-shirt design. Break the subject into geometric shapes, triangles, polygons with bold color fills. Modern abstract composition with sharp edges. Show on a clean t-shirt mockup.',
    'Neon Glow': 'Transform this image into a glowing neon light t-shirt design. Create the subject as neon tube outlines on dark background with vivid cyan, magenta, electric blue. Add realistic neon glow and bloom effects. Show on a black t-shirt mockup.',
  };
  return tshirtMap[presetName] || `Transform this image into a ${presetName} style t-shirt design on a product mockup.`;
}

function buildAdDesignerTransformPrompt(presetName: string): string {
  const adMap: Record<string, string> = {
    'Social Media Post': 'Transform this product image into a professional social media post design. Square 1:1 format with product centered, bold headline text "NEW ARRIVAL" at top, engaging call-to-action "Shop Now" button, modern gradient background with brand-friendly colors. Instagram/Facebook optimized layout.',
    'Product Banner': 'Transform this product image into a clean professional e-commerce banner. Wide horizontal format, product featured with ample white space, sleek modern typography "Premium Quality" tagline, subtle gradient, price badge "$99.99", polished commercial aesthetic.',
    'YouTube Thumbnail': 'Transform this product image into a bold YouTube thumbnail. 16:9 format, product enlarged dramatically, high-contrast dramatic lighting, large bold text "BEST IN CLASS" in yellow/white, bright saturated red/blue accents, arrow pointing to product, clickbait energy.',
    'Story Ad': 'Transform this product image into a vertical Instagram Story ad. 9:16 format, full-bleed product shot, gradient overlay with "Swipe Up" CTA arrow at bottom, trendy Gen-Z aesthetic, bold sans-serif "LIMITED DROP" text, dynamic motion-blur design elements.',
    'Sale Banner': 'Transform this product image into an urgent sale banner. Large bold "50% OFF" text in red, bright yellow starburst badge, strikethrough original price, countdown timer graphic, eye-catching promotional graphics, high-energy retail sale aesthetic with confetti elements.',
    'Luxury Brand': 'Transform this product image into an elegant luxury brand advertisement. Dark black/charcoal background, gold foil accent text "EXCLUSIVE COLLECTION", refined serif typography, generous negative space, subtle marble texture, premium shadow and reflection. High-end fashion aesthetic.',
    'Minimalist Ad': 'Transform this product image into a clean minimalist advertisement. Abundant white space, product isolated cleanly with soft shadow, thin elegant sans-serif "Simply Better" text, single muted accent color, precise geometric alignment, Scandinavian-inspired simplicity.',
    'Neon Promo': 'Transform this product image into a vibrant neon promotional design. Dark background with electric neon glow effects (hot pink, cyan outlines), glowing text "HOT DEAL" in neon tubes, retro-futuristic typography, light trails and bokeh effects, nightclub/festival energy.',
  };
  return adMap[presetName] || `Transform this product image into a ${presetName} style advertisement design with professional layout and typography.`;
}

function buildThumbnailMakerTransformPrompt(presetName: string): string {
  const thumbnailMap: Record<string, string> = {
    'Clickbait': 'Transform this image into a viral clickbait YouTube thumbnail. Add bold, oversized text with bright yellow and red colors. Include dramatic arrows, circles highlighting key elements, and exaggerated shocked expressions. Use high contrast, saturated colors, and a sense of urgency. 16:9 format, optimized for maximum click-through rate.',
    'Minimalist': 'Transform this image into a clean minimalist YouTube thumbnail. Simple composition with lots of negative space, one or two bold sans-serif words, and a limited color palette of 2-3 colors. Focus on clarity and readability at small sizes. Modern premium aesthetic with subtle shadows. 16:9 format.',
    'Cinematic': 'Transform this image into a cinematic movie-poster-style YouTube thumbnail. Apply dramatic lighting with lens flares, depth of field blur, and film color grading (teal and orange). Add bold cinematic title typography with metallic embossed effects. Wide-format epic atmosphere. 16:9 format.',
    'Gaming': 'Transform this image into an energetic gaming YouTube thumbnail. Add neon glow effects, glitch distortion, electric sparks, and vibrant RGB colors. Use bold angular typography with chrome or holographic effects. Include gaming-style HUD elements. High-energy composition. 16:9 format.',
    'Tutorial': 'Transform this image into a professional tutorial/educational YouTube thumbnail. Clean layout with numbered step badges, clear subject demonstration, and instructional text "HOW TO" or "STEP BY STEP". Use blue and white professional color scheme with clean icons. 16:9 format.',
    'Vlog': 'Transform this image into a warm, personal vlog-style YouTube thumbnail. Apply warm color grading, soft natural lighting, casual lifestyle aesthetic. Add handwritten-style text with personal touch, subtle emoji overlays, and friendly approachable vibe. 16:9 format.',
    'News Reaction': 'Transform this image into a news/reaction YouTube thumbnail. Split-screen layout with dramatic reaction expression on one side and news/content on the other. Bold red "BREAKING" or "REACTION" banner. High contrast, urgent color scheme with red and white. 16:9 format.',
    'Retro Pop': 'Transform this image into a retro pop art YouTube thumbnail. Apply Andy Warhol-inspired pop art colors, halftone dot patterns, bold comic-style outlines. Vibrant saturated pink/yellow/cyan palette, vintage texture overlays, and bold retro typography. 16:9 format.',
  };
  return thumbnailMap[presetName] || `Transform this image into a ${presetName} style YouTube thumbnail with bold text and engaging visuals. 16:9 format.`;
}

function buildColorPaletteCardTransformPrompt(presetName: string): string {
  const cardMap: Record<string, string> = {
    'Split Cover': 'Design an aesthetic color palette card in a split-cover layout. Place this photo on one half and a stacked column of 5 extracted dominant color swatches with their HEX codes on the other half. Clean editorial spacing, soft drop shadows, refined sans-serif typography. Premium social-media-ready memory card.',
    'Palette Diary': 'Design an aesthetic color palette card in a journal/diary layout. Show this photo as a framed snapshot, a horizontal row of 5 extracted dominant color swatches with HEX labels underneath, and tasteful handwritten-style captions. Warm paper texture, scrapbook feel, cozy nostalgic mood.',
    'Moment Poster': 'Design an aesthetic color palette card as a minimalist art poster. This photo as the hero, a slim strip of 5 extracted dominant colors along the bottom edge, bold poster-style title typography and small metadata. Gallery-grade composition with generous negative space.',
    'Film Strip': 'Design an aesthetic color palette card styled like analog film. Present this photo inside a film frame with sprocket holes, a vertical filmstrip of 5 extracted dominant color swatches beside it, and retro film-stock labels with HEX codes. Grainy, cinematic, vintage aesthetic.',
    'Minimal Swatch': 'Design an aesthetic color palette card with an ultra-minimal Swiss layout. A neat grid of 5 extracted dominant color swatches with precise HEX codes, this photo as a small contained thumbnail, lots of white space, crisp grid alignment, modern premium typography.',
    'Magazine': 'Design an aesthetic color palette card as a glossy magazine spread. Full-bleed version of this photo, an elegant overlaid color palette bar of 5 extracted dominant tones with HEX codes, editorial headline typography, column accents and page metadata. High-fashion print look.',
    'Polaroid Stack': 'Design an aesthetic color palette card as a stack of polaroid photos. Show this photo as the top polaroid with a handwritten caption on the white border, plus 5 extracted dominant color swatches arranged as small tiles around it. Playful, casual, instant-camera mood.',
    'Gradient Mood': 'Design an aesthetic color palette card with a smooth gradient mood-board background blended from the extracted dominant colors of this photo. Float this photo as a rounded card on top, list 5 dominant HEX codes elegantly, dreamy atmospheric ambient style.',
  };
  return cardMap[presetName] || `Design an aesthetic ${presetName} style color palette card using this photo, with extracted dominant color swatches and HEX codes in a clean, share-ready layout.`;
}

function buildMangaTranslatorTransformPrompt(presetName: string): string {
  const mangaMap: Record<string, string> = {
    'English': 'Translate all text in this manga page into English. Replace all dialogue in speech bubbles, narration boxes, sound effects (onomatopoeia), and any visible Japanese/Korean/Chinese text with accurate English translations. Preserve the original panel layout, speech bubble shapes, character art, screentone shading, and visual style exactly. The translated text should fit naturally within the existing bubbles.',
    'Chinese Simplified': 'Translate all text in this manga page into Simplified Chinese (简体中文). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate Simplified Chinese translations. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly. Use natural Chinese expressions and proper simplified characters.',
    'Chinese Traditional': 'Translate all text in this manga page into Traditional Chinese (繁體中文). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate Traditional Chinese translations. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly. Use proper traditional characters.',
    'Japanese': 'Translate all text in this manga page into Japanese (日本語). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate Japanese translations using appropriate kanji, hiragana, and katakana. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly.',
    'Korean': 'Translate all text in this manga page into Korean (한국어). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate Korean translations in Hangul. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly.',
    'French': 'Translate all text in this manga page into French (Français). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate French translations. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly.',
    'Spanish': 'Translate all text in this manga page into Spanish (Español). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate Spanish translations. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly.',
    'German': 'Translate all text in this manga page into German (Deutsch). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate German translations. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly.',
    'Portuguese': 'Translate all text in this manga page into Portuguese (Português). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate Portuguese translations. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly.',
    'Russian': 'Translate all text in this manga page into Russian (Русский). Replace all dialogue in speech bubbles, narration boxes, sound effects, and any visible text with accurate Russian translations in Cyrillic script. Preserve the original panel layout, speech bubble shapes, character art, and visual style exactly.',
  };
  return mangaMap[presetName] || `Translate all text in this manga page into ${presetName}. Preserve the original panel layout, speech bubbles, character art, and visual style exactly.`;
}

function buildMinecraftSkinTransformPrompt(presetName: string): string {
  const skinMap: Record<string, string> = {
    'Classic Steve': 'Transform this portrait photo into a Minecraft-style blocky pixel art character resembling the classic Steve skin. Square head, rectangular body, pixelated textures. Blue shirt, dark pants, brown hair. Maintain recognizable features in blocky pixel form. Minecraft game art style, 3D isometric view.',
    'Diamond Armor': 'Transform this portrait photo into a Minecraft-style blocky character wearing full diamond armor. Gleaming cyan-blue diamond armor with teal pixel patterns covering entire body, diamond helmet. Maintain recognizable features in blocky pixel form. Minecraft game art style, 3D isometric view.',
    'Creeper': 'Transform this portrait photo into a Minecraft-style blocky character with Creeper theme. Green pixelated body with the iconic Creeper face pattern (sad mouth, dark eyes). Blend person features with Creeper aesthetic. Minecraft game art style, 3D isometric view.',
    'Enderman': 'Transform this portrait photo into a Minecraft-style blocky Enderman character. Tall dark body, glowing purple eyes, purple particle effects. Dark purple-black color scheme. Maintain recognizable features in blocky pixel form. Minecraft game art style, 3D isometric view.',
    'Zombie': 'Transform this portrait photo into a Minecraft-style blocky zombie character. Green-tinted pixelated skin, tattered clothing, dark eye sockets, undead appearance. Maintain recognizable features but zombified. Minecraft game art style, 3D isometric view.',
    'Skeleton': 'Transform this portrait photo into a Minecraft-style blocky skeleton character. White bone-textured body, dark hollow eyes, skeletal appearance with bone-white pixel pattern. Minecraft game art style, 3D isometric view.',
    'Nether Knight': 'Transform this portrait photo into a Minecraft-style blocky Nether Knight character. Fiery nether-themed armor in deep red, orange, and black. Glowing lava accents, netherite-style textures, blazing particle effects. Minecraft game art style, 3D isometric view.',
    'Medieval Knight': 'Transform this portrait photo into a Minecraft-style blocky Medieval Knight character. Iron armor with helmet visor, chainmail body armor, iron leggings and boots. Gray iron and silver pixel textures, shield and sword. Minecraft game art style, 3D isometric view.',
    'Ender Dragon': 'Transform this portrait photo into a Minecraft-style blocky Ender Dragon themed character. Dark purple-black dragon-scale armor, glowing purple eyes, dragon wing accessories, End dimension purple particle effects. Minecraft game art style, 3D isometric view.',
    'Pixel Hero': 'Transform this portrait photo into an extra-blocky retro pixel art Minecraft character. Highly pixelated 8-bit style with exaggerated block proportions, bold primary colors, classic video game hero look. Intentionally low pixel density for nostalgic retro gaming feel. Minecraft game art style, 3D isometric view.',
  };
  return skinMap[presetName] || `Transform this portrait into a Minecraft-style blocky pixel art character with ${presetName} theme. Minecraft game art style, 3D isometric view.`;
}

function build3dCameraControlTransformPrompt(presetName: string): string {
  const cameraMap: Record<string, string> = {
    'Front View': 'Render this person from a straight-on front view camera angle. Direct eye-level perspective facing the subject head-on. The subject looks directly at the camera. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Left Side': 'Render this person from a left side profile camera angle. The camera is positioned at 90 degrees to the left of the subject, showing the left side of their face and body in full profile view. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Right Side': 'Render this person from a right side profile camera angle. The camera is positioned at 90 degrees to the right of the subject, showing the right side of their face and body in full profile view. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Back View': 'Render this person from a back view camera angle. The camera is positioned directly behind the subject, showing the back of their head, hair, and shoulders. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Top Down': 'Render this person from a top-down bird\'s eye camera angle. The camera is positioned directly above looking down at the subject from overhead. The top of the head, shoulders, and hair are prominently visible. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Low Angle': 'Render this person from a dramatic low angle camera perspective. The camera is positioned below, looking upward at the subject, making them appear powerful and imposing. Chin, jawline, and underside of face visible. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Left Three-Quarter': 'Render this person from a left three-quarter camera angle (45 degrees from front-left). The subject\'s face is partially turned showing both the front and left side, classic portrait angle. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Right Three-Quarter': 'Render this person from a right three-quarter camera angle (45 degrees from front-right). The subject\'s face is partially turned showing both the front and right side, classic portrait angle. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Close-Up': 'Render an extreme close-up of this person\'s face. The camera is very close, filling the frame with just the face — eyes, nose, mouth, and skin texture are prominently visible. Tight crop, shallow depth of field. Same person, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
    'Wide Shot': 'Render this person in a wide shot camera angle. The camera is pulled back far, showing the full body from head to toe with significant space around them. Environmental context visible, the subject appears smaller in the frame. Same person, same clothing, same lighting conditions. Studio portrait, photorealistic, sharp focus, 8K.',
  };
  return cameraMap[presetName] || `Render this person from a ${presetName} camera angle perspective. Same person, same clothing. Studio portrait, photorealistic, sharp focus, 8K.`;
}

function buildBodySwapTransformPrompt(presetName: string): string {
  const swapMap: Record<string, string> = {
    'Natural Blend': 'Swap this person onto a different body with a natural seamless blend. Match skin tones, lighting, and shadows perfectly. The result should look like a single natural photograph with no visible compositing artifacts. Photorealistic, high quality.',
    'Perfect Skin Match': 'Swap this person onto a different body with perfect skin tone and texture matching. Carefully adjust undertones, complexion, and skin texture for a flawless invisible seam between face and body. Professional retouching quality.',
    'Athletic Fit': 'Swap this person onto an athletic fit body. Show the person with a toned, sporty physique wearing athletic wear. Natural muscle definition, healthy glow, active lifestyle appearance. Seamless face-body blend, photorealistic.',
    'Fashion Editorial': 'Swap this person onto a fashion model body in a high-fashion editorial setting. Elegant pose, designer clothing, professional fashion photography lighting. Magazine cover quality, glamorous, photorealistic.',
    'Professional Portrait': 'Swap this person onto a professional business body wearing a tailored suit or business attire. Corporate headshot quality, confident posture, clean professional background. Seamless blend, photorealistic.',
    'Artistic Merge': 'Artistically merge this person onto a different body with creative flair. Enhanced colors, dramatic lighting, stylized skin tones, artistic composition. Maintain face identity while creating an eye-catching artistic portrait.',
    'Cinematic Look': 'Swap this person onto a body in a cinematic film scene. Apply cinematic color grading (teal and orange tones), dramatic side lighting, shallow depth of field, film grain. Movie poster quality, photorealistic.',
    'Cosplay Transform': 'Swap this person onto a cosplay/costume body. Place the face onto a body wearing an elaborate fantasy or sci-fi costume with themed makeup and accessories. Seamless integration, vibrant colors, convention-quality cosplay portrait.',
  };
  return swapMap[presetName] || `Swap this person onto a different body with ${presetName} style. Seamless blend, photorealistic, high quality.`;
}

function buildHairstyleAnalysisTransformPrompt(presetName: string): string {
  const analysisMap: Record<string, string> = {
    'Full Analysis': 'Generate a comprehensive hairstyle analysis report for this person. Create a professional visual layout showing: current hair type assessment, face shape identification, recommended hairstyles (3-4 options), color suggestions, and care tips. Include annotated visual guides with arrows and labels. Professional hair consultation infographic style.',
    'Face Shape Match': 'Analyze this person\'s face shape and generate a visual face shape matching guide. Identify their face shape (oval, round, square, heart, oblong, diamond) with labeled overlay. Show 3-4 recommended hairstyles that complement their face shape with proportion guides. Professional hair consultation layout.',
    'Color Consultation': 'Generate a professional hair color consultation report for this person. Analyze their skin tone and undertones. Show a color palette of recommended hair colors with swatches — warm tones, cool tones, highlights, and lowlights. Include visual previews of 3-4 recommended shades. Professional color consultation format.',
    'Length Guide': 'Generate a visual hair length guide for this person showing how different lengths would look. Include pixie, bob, shoulder-length, and long hair comparisons side by side. Add proportion analysis and recommendations based on face shape. Professional styling consultation format.',
    'Bangs Analysis': 'Analyze this person\'s forehead and face proportions. Generate a bangs/fringe consultation showing recommended bang styles — side-swept, curtain bangs, blunt bangs, wispy bangs, and no bangs. Include visual previews and proportion guides explaining why each style works or doesn\'t. Professional consultation layout.',
    'Volume & Texture': 'Generate a hair volume and texture analysis for this person. Assess current hair type (straight, wavy, curly, coily) and volume level. Show recommended volume and texture styling options with visual comparisons. Include product and technique suggestions. Professional hair texture consultation format.',
    'Celebrity Match': 'Analyze this person\'s features and generate a celebrity hairstyle match report. Show 3-4 celebrity hairstyle inspirations that would suit their face shape and features. Include side-by-side comparisons with explanations of why each style works. Magazine-style hair inspiration layout.',
    'Salon Ready': 'Generate a complete salon-ready consultation sheet for this person. Include: hair condition assessment, recommended cut and style with visual guide, color suggestions, product recommendations, and maintenance schedule. Professional salon consultation card format with clear sections and visuals.',
  };
  return analysisMap[presetName] || `Generate a ${presetName} hairstyle analysis for this person with professional visual guides and recommendations.`;
}

function buildEmojiMosaicTransformPrompt(presetName: string): string {
  const mosaicMap: Record<string, string> = {
    'Classic Grid': 'Transform this entire image into an emoji mosaic artwork. Replace the photo with a uniform grid of emojis where each emoji is carefully color-matched to represent the corresponding area. Clean grid layout with equal spacing. The overall image should be clearly recognizable as the original subject but entirely composed of emojis.',
    'Dense Mosaic': 'Transform this image into a densely packed emoji mosaic with very small tightly arranged emojis. The emojis are packed so closely together that fine details and subtle color gradients are preserved. From a distance the image appears almost photorealistic. Ultra-high detail emoji artwork.',
    'Pixel Art': 'Transform this image into a retro pixel-art style emoji mosaic with large blocky emoji tiles. The result should look like a retro 8-bit video game version made entirely from oversized emojis. Deliberately pixelated with chunky blocks. Retro gaming aesthetic.',
    'Color Pop': 'Transform this image into a vibrant saturated emoji mosaic where emojis are selected to maximize color intensity and contrast. Eye-catchingly colorful with bold vivid emoji choices. The colors should be amplified and oversaturated. Rainbow-bright emoji art.',
    'Monochrome': 'Transform this image into a monochrome emoji mosaic using only emojis in shades of a single blue-gray color tone. Elegant tonal artwork that captures the subject through varying intensities. Like a blueprint or cyanotype made of emojis.',
    'Neon Glow': 'Transform this image into a neon-glowing emoji mosaic on a dark black background. The emojis emit bright neon light in electric blues, hot pinks, greens, and purples. Cyberpunk aesthetic. The overall effect looks like a glowing LED sign made entirely of emojis.',
    'Scattered': 'Transform this image into an artistic scattered emoji composition. Emojis are randomly placed and overlapping at various sizes and rotation angles. Rather than a strict grid, emojis are organically distributed to create an abstract artistic interpretation. Playful and dynamic.',
    'Vintage': 'Transform this image into a vintage-style emoji mosaic with muted warm-toned colors reminiscent of old photographs. Sepia, amber, and faded earthy tones. The overall result feels nostalgic like a faded postcard reimagined with emojis. Retro warm color palette.',
  };
  return mosaicMap[presetName] || `Transform this image into a ${presetName} style emoji mosaic artwork.`;
}

function buildBookCoverDesignerTransformPrompt(presetName: string): string {
  const bookCoverMap: Record<string, string> = {
    'Fantasy': 'Transform this image into an epic fantasy book cover. Add magical elements — glowing runes, mystical aurora, enchanted forest border. Rich deep colors (royal purple, gold, midnight blue). Ornate decorative frame with elegant serif title "THE FORGOTTEN REALM" at top and author name at bottom. Professional book cover layout, vertical format.',
    'Romance': 'Transform this image into a romantic novel book cover. Apply soft warm tones — blush pink, sunset gold, lavender. Add dreamy bokeh lights, rose petals, soft lens flare. Intimate passionate atmosphere with elegant script title "WHISPERS OF THE HEART" at top. Professional romance book cover layout, vertical format.',
    'Sci-Fi': 'Transform this image into a science fiction book cover. Add futuristic elements — holographic grid overlay, starfield, neon circuitry lines, distant planets. Cool color palette (electric blue, cyan, chrome silver). Bold modern sans-serif title "BEYOND THE HORIZON" at top. Professional sci-fi book cover layout, vertical format.',
    'Thriller': 'Transform this image into a dark thriller book cover. Apply high-contrast dramatic lighting, deep shadows, desaturated tones. Add gritty cracked textures, rain streaks, sense of danger. Bold impactful title "SILENT WITNESS" in white against dark background. Professional thriller book cover layout, vertical format.',
    'Mystery': 'Transform this image into a mystery detective book cover. Create noir atmosphere with fog, silhouettes, dim amber streetlights, long shadows. Moody color palette (dark teal, amber, charcoal). Magnifying glass motif. Elegant serif title "THE LAST CLUE" at top. Professional mystery book cover layout, vertical format.',
    'Self-Help': 'Transform this image into a clean modern self-help book cover. Bright uplifting aesthetic with clean white space, geometric accent shapes, bold orange/teal accent colors. Minimalist composition with large confident sans-serif title "UNLOCK YOUR POTENTIAL" at top. Professional non-fiction book cover layout, vertical format.',
    "Children's": "Transform this image into a colorful children's book cover. Playful illustrated style with bright primary colors, whimsical cartoon characters, rounded shapes, hand-drawn stars and clouds. Cheerful rounded bubbly font title \"THE MAGIC ADVENTURE\" at top. Professional children's book cover layout, vertical format.",
    'Horror': 'Transform this image into a terrifying horror book cover. Dark unsettling atmosphere with blood-red accents, creepy fog, eerie shadows, cracked and decaying textures. Distorted dripping title "THE HOLLOW" in red against black. Professional horror book cover layout, vertical format.',
  };
  return bookCoverMap[presetName] || `Transform this image into a ${presetName} genre book cover design with professional typography and layout.`;
}

function buildCoupleMatchTransformPrompt(presetName: string): string {
  const coupleMatchMap: Record<string, string> = {
    'Love Score': 'Transform this couple portrait into a romantic love compatibility infographic. Add a large glowing heart between the two people with a percentage score (85%-99%) displayed prominently. Add sparkles, romantic pink and red color accents, and a dreamy soft-focus background. Keep both faces recognizable.',
    'Baby Prediction': 'Transform this couple portrait into a baby prediction visualization. Create a cute baby face that blends features from both people, displayed between them in a soft glowing circle. Add pastel colors, baby-themed decorations like stars and clouds. The baby should have a blend of both parents\' features.',
    'Celebrity Couple': 'Transform this couple portrait into a glamorous Hollywood red carpet style photo. Add dramatic studio lighting, lens flare, and a luxurious backdrop. Style both people as if they are celebrity couple on a magazine cover with elegant retouching and sophisticated color grading.',
    'Anime Couple': 'Transform this couple portrait into a romantic anime art style. Convert both people into anime characters with large expressive eyes, stylized hair, and soft pastel coloring. Add cherry blossom petals, sparkles, and a dreamy anime background. Romantic shoujo manga aesthetic.',
    'Wedding Portrait': 'Transform this couple portrait into a beautiful wedding photo. Dress the woman in an elegant white wedding gown and the man in a formal black suit/tuxedo. Add a romantic wedding venue background with flowers, soft bokeh lights, and warm golden lighting.',
    'Growing Old Together': 'Transform this couple portrait to show both people aged to their 70s-80s. Add realistic aging — gray/white hair, wrinkles, age spots — while keeping their recognizable features. They should look happy together with warm smiles, conveying decades of love. Keep the same clothing and pose.',
    'Face Merge': 'Create a face merge/morph between these two people. Generate a single face that is a perfect 50/50 blend of both faces — combining their eye shape, nose, mouth, and face structure. The merged face should be centered, well-lit, and look like a natural person who shares features of both.',
    'Couple Avatar': 'Transform this couple portrait into cute chibi/cartoon couple avatars. Convert both people into adorable matching cartoon characters with big heads, small bodies, and exaggerated cute features. Add a matching outfit theme and a colorful fun background. Kawaii couple illustration style.',
  };
  return coupleMatchMap[presetName] || `Create a ${presetName} couple-themed transformation of this couple portrait, keeping both faces recognizable.`;
}

function buildTeethWhiteningTransformPrompt(presetName: string): string {
  const teethWhiteningMap: Record<string, string> = {
    'Natural White': 'Subtly whiten teeth to a natural healthy white shade, removing slight discoloration while maintaining realistic tooth texture and translucency',
    'Bright White': 'Whiten teeth to a noticeably brighter white, clean and fresh appearance with even color across all visible teeth',
    'Pearl White': 'Transform teeth to an elegant pearly white finish with subtle luminous sheen, smooth and refined appearance',
    'Hollywood White': 'Ultra-bright Hollywood-level teeth whitening with perfectly uniform brilliant white across all teeth, celebrity-grade smile',
    'Warm White': 'Whiten teeth with a warm-toned natural white, slightly creamy warm undertone for a friendly natural look',
    'Cool White': 'Whiten teeth with a cool-toned crisp white, slightly blue-white undertone for a fresh clean appearance',
    'Stain Removal': 'Remove visible coffee, tea, and tobacco stains from teeth, restoring natural tooth color without over-whitening',
    'Perfect Smile': 'Whiten teeth to bright white plus subtly straighten and align teeth for a perfect symmetrical smile',
  };

  return teethWhiteningMap[presetName] || `Apply ${presetName} teeth whitening to the smile, photorealistic result keeping all other features identical.`;
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

function buildFacePairTransformPrompt(presetName: string): string {
  const facePairMap: Record<string, string> = {
    'Overall Match': "Add face similarity analysis overlay to the side-by-side photos. Include a large circular percentage badge showing \"78% Match\", connecting lines between matching facial features, individual feature match bars (eyes 85%, nose 72%, jawline 80%, lips 75%), semi-transparent analysis panel.",
    'Celebrity Match': "Add a glamorous celebrity duo comparison overlay. Include \"Celebrity Duo: Sisters Vibes\" badge, star decorations, match percentage in gold, red carpet background accent, fame meter bar.",
    'Family Resemblance': "Add family resemblance analysis overlay. Include DNA helix decoration, \"Family Match: 73%\" badge, inherited feature markers with arrows connecting shared traits, gene similarity indicators, family tree icon.",
    'Twin Meter': "Add twin comparison gauge overlay. Include a large \"Twin Meter\" semicircular gauge showing 65%, symmetry grid comparison between both faces, matching feature highlight boxes, \"Not Quite Twins\" verdict label.",
    'Couple Match': "Add romantic compatibility overlay. Include heart-shaped compatibility meter at 82%, chemistry score, love-themed decorations, \"Great Match!\" badge, complementary feature analysis bars.",
    'Age Progression': "Add age verification overlay. Include \"Same Person?\" analysis badge, confidence score at 45%, aging timeline bar, feature consistency markers, \"Different People\" verdict.",
    'Expression Match': "Add expression analysis overlay. Include emotion detection labels for each face (\"Neutral\" and \"Neutral\"), expression similarity bar at 90%, mirroring score, facial muscle activation heatmap style indicators.",
    'Feature Breakdown': "Add detailed feature comparison overlay. Include separate labeled score bars for eyes (85%), nose (72%), mouth (78%), jawline (80%), forehead (68%), cheekbones (75%), measurement lines connecting corresponding features, comprehensive score table.",
  };

  return facePairMap[presetName] || `Transform this side-by-side face comparison into a ${presetName} analysis image with annotated overlay and detailed comparison info.`;
}

function buildSkinAnalyzerTransformPrompt(presetName: string): string {
  const skinAnalyzerMap: Record<string, string> = {
    'Full Skin Report': "Add comprehensive skin health diagnostic overlay with overall score '85/100' in a large circular badge, multi-concern breakdown bars showing Acne 90%, Wrinkles 95%, Pores 78%, Hydration 82%, Radiance 88%, Firmness 85%, color-coded facial zone mapping with green/yellow indicators, 'Normal Skin Type' badge, semi-transparent diagnostic panel on the right side.",
    'Acne Analysis': "Add acne diagnostic overlay with severity score 'Mild - Score 88/100' badge, acne type labels pointing to specific areas (comedonal, inflammatory), affected zone heat map with red/orange highlights on T-zone and chin, breakout count '3 Active' indicator, green 'Low Concern' treatment urgency badge.",
    'Wrinkle Map': "Add wrinkle analysis overlay with thin lines tracing wrinkle paths on forehead and around eyes, crow's feet score 92%, forehead lines 88%, nasolabial folds 85%, 'Skin Age: 26' badge, collagen health meter at 87%, anti-aging tips panel.",
    'Pore Analysis': "Add pore diagnostic overlay with heat map focused on nose and cheeks showing pore density in blue/purple gradient, pore size distribution mini chart, average pore size 'Small' indicator, clogged pore markers with yellow dots, skin texture score 82/100.",
    'Dark Circle Check': "Add under-eye analysis overlay with dark circle severity gauge at 'Mild', pigmentation type 'Vascular' label with blue tint indicator, eye bag assessment 'Minimal' badge, hydration level 75% bar, concealer shade recommendation 'Light-Medium' badge.",
    'Moisture Level': "Add hydration analysis overlay with large moisture percentage '78%' gauge, dry zone mapping with red patches on cheeks and yellow on forehead, skin barrier health score 82%, dehydration warning on outer cheeks, recommended hydration target bar showing current vs ideal.",
    'Skin Tone & Radiance': "Add skin tone overlay with evenness score 88/100, radiance level 'High' meter with sun icon, small circles marking 3 pigmentation spots, UV damage indicator 'Low', color uniformity gradient map, golden 'Glow Score: A' badge.",
    'Skin Age': "Add age analysis overlay with large split badge showing 'Skin Age: 24' vs 'Actual Age: 28' in green (younger than actual), aging factors breakdown bars (Sun Damage 15%, Hydration 82%, Elasticity 90%, Lifestyle 85%), circular age meter gauge, 'Excellent Vitality' score badge.",
  };

  return skinAnalyzerMap[presetName] || `Transform this portrait into a ${presetName} skin analysis image with annotated overlay and detailed diagnostic info.`;
}

function buildEyewearTryonTransformPrompt(presetName: string): string {
  const eyewearMap: Record<string, string> = {
    'Classic Aviator': 'Add classic gold metal aviator sunglasses with dark tinted lenses, teardrop-shaped frames sitting on the nose bridge',
    'Round Retro': 'Add vintage round metal-frame glasses with thin wire rims, circular lenses, John Lennon style',
    'Cat Eye': 'Add stylish cat-eye glasses with upswept pointed corners, thick acetate frames in black',
    'Wayfarer': 'Add iconic wayfarer-style thick black acetate frame glasses with slightly tinted lenses',
    'Oversized Square': 'Add large oversized square-frame sunglasses with thick dark frames and gradient tinted lenses',
    'Rimless': 'Add minimalist rimless glasses with thin metal temples, clear lenses, barely visible frame',
    'Sports Wrap': 'Add athletic wraparound sports sunglasses with curved dark lenses and rubber grip temples',
    'Tortoise Shell': 'Add classic tortoise shell pattern acetate frame glasses with warm brown-amber marbled pattern',
  };

  return eyewearMap[presetName] || `Add ${presetName} eyewear to the face, fitting naturally on the nose bridge, photorealistic integration.`;
}

function buildAestheticSimTransformPrompt(presetName: string): string {
  const aestheticMap: Record<string, string> = {
    'Nose Refinement': 'Subtly refine the nose shape with a slimmer bridge, refined tip, and smoother profile, maintaining natural proportions',
    'Lip Enhancement': 'Enhance lips to appear fuller and plumper with defined cupid\'s bow, balanced upper and lower lip volume, natural-looking enhancement',
    'Jawline Contour': 'Sharpen and define the jawline with more angular contours, reducing any softness along the jaw, creating a sculpted V-line appearance',
    'Eye Enlargement': 'Subtly enlarge the eyes with wider eye opening, more visible iris, slightly lifted outer corners, maintaining natural eye shape',
    'Chin Reshape': 'Refine chin shape with a smoother, more balanced contour, slightly pointed and proportional to face width',
    'Cheekbone Lift': 'Enhance cheekbones to appear higher and more defined with subtle contouring effect, creating elegant facial structure',
    'Face Slimming': 'Slim the overall face shape reducing width at cheeks and jaw, creating a more oval and elongated facial contour',
    'Full Makeover': 'Apply combined subtle enhancements - slightly refined nose, fuller lips, defined jawline, lifted cheekbones, and slimmer face for a harmonious overall improvement',
  };

  return aestheticMap[presetName] || `Apply ${presetName} aesthetic enhancement to the face with natural-looking subtle improvements, photorealistic result.`;
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

function buildRoomPlannerTransformPrompt(preset: BasePreset): string {
  const styleMap: Record<string, string> = {
    'Modern': 'a contemporary modern interior — clean lines, neutral palette with bold accents, polished surfaces, sleek minimal furniture, statement lighting, large-scale art',
    'Scandinavian': 'a Scandinavian interior — light wood floors, white walls, soft neutral textiles, simple functional furniture, cozy throws, indoor plants, abundant natural light',
    'Industrial': 'an industrial interior — exposed brick walls, metal framing, raw concrete floors, Edison-bulb pendant lighting, leather and metal furniture, distressed wood',
    'Minimalist': 'a minimalist interior — ultra-clean lines, monochrome white and gray palette, very few items, hidden storage, negative space, single sculptural focal piece',
    'Bohemian': 'a bohemian interior — layered colorful rugs and textiles, macramé wall hangings, rattan furniture, lush plants, eclectic global decor, warm earthy tones',
    'Japandi': 'a Japandi interior blending Japanese and Scandinavian aesthetics — natural wood, muted neutral palette, low-profile furniture, paper lanterns, zen plants, clean uncluttered lines',
    'Mediterranean': 'a Mediterranean interior — terracotta tile floors, white plaster walls, arched doorways, wrought iron details, warm earthy palette, ceramic pottery, olive plants',
    'Vintage': 'a vintage interior — mid-century furniture, retro patterned wallpaper, brass accents, antique decor, warm amber tones, classic floor lamps, framed art prints',
    'Traditional': 'a traditional interior — classic crown moldings, ornate wood furniture, rich fabric upholstery, oriental rugs, symmetrical layouts, formal drapery, framed oil paintings',
  };
  const detail = styleMap[preset.name] || `a ${preset.name.toLowerCase()} interior design`;
  return `Restyle this room into ${detail}. Replace all furniture, decor, lighting, rugs, wall art and surface materials to match. CRITICAL constraints: preserve the exact same room architecture — walls, windows, doors, ceiling, floor layout, room dimensions, viewpoint and camera angle must stay perfectly identical. The result must look like the exact same physical room photographed from the exact same angle, but completely redecorated in the chosen style. Photorealistic interior photography.`;
}

function buildRoomCleanerTransformPrompt(preset: BasePreset): string {
  const cleaningMap: Record<string, string> = {
    'Light Tidy': 'remove only loose surface clutter — papers, dishes, cups, laundry, cables, small trash, slippers, scattered magazines. Keep all furniture, decor, rugs, wall art, plants and major items exactly as they are. The room should look tidied but still lived-in',
    'Quick Clean': 'remove all visible clutter, personal items, papers, dishes, cables, laundry and small misplaced objects. Keep all furniture and major decor (rugs, wall art, lamps, plants). The room should look like it has been quickly cleaned for guests',
    'Decluttered': 'remove all clutter, personal items, books, decorations, knick-knacks, wall posters, small accessories, and excess belongings. Keep main furniture (bed, sofa, desk, table, chairs, primary lamps) but remove everything else. Minimalist clean look',
    'Furniture Only': 'remove every decor item, wall art, rug, plant, curtain, lamp, cushion, blanket, magazines and accessory. Keep only the structural furniture (bed frame, sofa, desk, table, chairs). Bare practical interior with neutral walls',
    'Empty Room': 'remove every single piece of furniture, decor, rug, curtain, lamp, plant, wall art and personal item from the room. Leave only the bare empty room — walls, floor, ceiling, windows, doors and built-in fixtures. Completely vacant unfurnished space',
    'Move-In Ready': 'remove every piece of furniture, decor, rug, curtain, lamp, plant, wall art and personal item. Then repaint all walls a fresh clean neutral off-white, restore the flooring to look perfectly clean and freshly polished. Leave a bright pristine empty move-in ready room',
  };
  const detail = cleaningMap[preset.name] || `apply a ${preset.name.toLowerCase()} cleaning to this room`;
  return `Clean this room: ${detail}. CRITICAL constraints: preserve the exact same room architecture — walls, windows, doors, ceiling, floor, room dimensions, viewpoint, camera angle and overall composition must stay perfectly identical. Do not change wall colors unless explicitly requested. The result must look like the exact same room photographed from the exact same angle, with only the specified items removed.`;
}

function buildExpressionTransformPrompt(preset: BasePreset): string {
  const expressionMap: Record<string, string> = {
    'Big Smile': 'a big joyful open-mouth smile showing teeth, raised cheeks, crinkled eyes',
    'Subtle Smile': 'a gentle closed-mouth subtle smile with slightly raised cheeks and warm soft eyes',
    'Laugh': 'an open-mouth genuine laugh with teeth visible, head slightly tilted back, squinting joyful eyes',
    'Wink': 'one eye fully closed in a playful wink, the other eye open, slight smirk on the lips',
    'Surprised': 'wide-open eyes, raised eyebrows, mouth slightly open in genuine surprise',
    'Shocked': 'extremely wide eyes, dramatically raised eyebrows, mouth open in shock',
    'Sad': 'downturned mouth, slightly furrowed inner brows, drooping eyelids, melancholic expression',
    'Angry': 'furrowed brow, narrowed intense eyes, tightly pressed lips, tense jaw, angry expression',
    'Sleepy': 'half-closed droopy eyelids, relaxed jaw, soft slightly parted lips, tired sleepy expression',
    'Pouting': 'pursed pushed-out lips in a playful pout, slightly raised eyebrows, cute expression',
    'Serious': 'completely neutral focused expression, relaxed closed mouth, steady direct gaze, no smile',
    'Crying': 'visible tears running down the cheeks, downturned trembling mouth, reddened eyes, sad crying expression',
  };
  const detail = expressionMap[preset.name] || `a clear ${preset.name.toLowerCase()} facial expression`;
  return `Change ONLY this person's facial expression to ${detail}. Keep everything else completely identical: identity, face shape, skin tone, hair, makeup, glasses, clothing, accessories, background, lighting, pose, head angle, and overall composition. The result must look like the exact same photo of the exact same person, with only the facial expression naturally modified.`;
}

function buildSkinTypeTransformPrompt(preset: BasePreset): string {
  const skinTypeMap: Record<string, string> = {
    'Oily': 'oily skin — a visibly shiny, glossy T-zone (forehead, nose, chin) with excess sebum and a greasy sheen, slightly enlarged visible pores across the nose and cheeks, dewy reflective highlights',
    'Dry': 'dry skin — a matte, slightly rough and flaky texture with small dry patches and fine surface lines, tight-looking dehydrated skin, subtle dullness, no shine at all',
    'Combination': 'combination skin — a noticeably shiny oily T-zone (forehead, nose, chin) with visible pores, while the cheeks look matte, slightly dry and a little flaky, showing a clear contrast between the oily center and drier outer face',
    'Sensitive': 'sensitive skin — soft pink-red flushing and irritation across the cheeks and around the nose, a few faint reactive red blotches and mild redness, delicate reactive-looking skin, slightly inflamed appearance',
  };
  const detail = skinTypeMap[preset.name] || `clear ${preset.name.toLowerCase()} skin characteristics`;
  return `Adjust ONLY the facial skin condition of this person to show ${detail}. Keep everything else completely identical: identity, face shape, facial features, eyes, hair, clothing, accessories, background, lighting, pose, head angle, and overall composition. Do not add makeup. The result must look like the exact same photo of the exact same person, with only the skin condition naturally and realistically modified.`;
}

function buildSkinConcernTransformPrompt(preset: BasePreset): string {
  const concernMap: Record<string, string> = {
    'Acne & Breakouts': 'numerous active acne breakouts filling the frame — multiple inflamed red papules and pustules with white heads, clogged blackheads, and surrounding red inflammation across the skin surface',
    'Large Pores': 'severely enlarged, dilated pores filling the frame — coarse, bumpy, orange-peel skin texture with deep visible open pores densely covering the entire skin surface',
    'Dark Spots': 'heavy dark spots and hyperpigmentation filling the frame — numerous distinct brown sun spots, melasma patches and post-acne dark marks scattered across an uneven, blotchy skin surface',
    'Oily T-Zone': 'extremely oily, greasy skin filling the frame — a glossy, shiny, sebum-covered surface with strong specular highlights reflecting light, slick wet-looking oily sheen',
    'Dryness & Flaking': 'severely dry, flaking skin filling the frame — rough cracked dehydrated texture with peeling white flakes, scaly dry patches and visible fine surface cracking',
    'Fine Lines': 'prominent fine lines and wrinkles filling the frame — a network of fine creases, crepey texture and etched wrinkle lines across aging, less firm skin',
  };
  const detail = concernMap[preset.name] || `visible ${preset.name.toLowerCase()} on the skin`;
  return `Transform this macro skin close-up to dramatically and realistically show ${detail}. Keep it an extreme macro close-up of a skin patch filling the entire frame — do NOT show a full face, eyes, hair, or background. Keep the same clinical lighting and macro framing. The skin condition must be obvious, exaggerated and clearly visible even in a small thumbnail. Photorealistic dermatology skin macro, 8K quality.`;
}

function buildPassportPhotoTransformPrompt(preset: BasePreset): string {
  // Cycle bg colors across presets for visual variety in preset grid
  const PASSPORT_BG_BY_PRESET: Record<string, string> = {
    'US Passport': 'pure white (#FFFFFF)',
    'UK Passport': 'pure white (#FFFFFF)',
    'EU / Schengen': 'pure white (#FFFFFF)',
    'China Visa': 'official passport blue (#2E78D2)',
    'Japan Passport': 'pure white (#FFFFFF)',
    'Korea Passport': 'pure white (#FFFFFF)',
    'India Passport': 'official passport blue (#2E78D2)',
    'Canada Passport': 'pure white (#FFFFFF)',
    'Australia Passport': 'pure white (#FFFFFF)',
    'One Inch': 'pure white (#FFFFFF)',
  };
  const bg = PASSPORT_BG_BY_PRESET[preset.name] || 'pure white (#FFFFFF)';
  return `Transform this photo into an official ${preset.name} passport-style portrait. Replace the background with a perfectly uniform ${bg} backdrop with no gradient, shadow or texture. Crop tightly to a centered head-and-shoulders composition. Face must be front-facing, looking directly at the camera with a neutral relaxed expression, mouth closed, eyes open and clearly visible, no glasses glare, no accessories obscuring the face. Apply even, soft, shadow-free studio lighting. Keep the person's identity, skin tone, hair and facial features fully intact. Output a photo-realistic compliant ID portrait.`;
}

function buildYearbookTransformPrompt(preset: BasePreset): string {
  const yearbookMap: Record<string, string> = {
    '90s Classic': 'Transform this person into an authentic 1990s high school yearbook portrait. Feathered or layered hair, oversized denim or pastel collar, soft studio lighting, blue laser-beam gradient backdrop. Slight film grain, washed-out 90s photo color tone. Classic centered yearbook composition. Keep the person\'s identity and facial features recognizable.',
    '80s Glam': 'Transform this person into an authentic 1980s high school yearbook portrait. Big voluminous teased curly hair, bright pastel or neon backdrop, shoulder-pad blazer or sequined top, glam makeup with bold blush. Vibrant 80s color palette with slight grain. Classic yearbook composition. Keep the person\'s identity and facial features recognizable.',
    '70s Disco': 'Transform this person into an authentic 1970s high school yearbook portrait. Long center-parted hair or afro, wide bell-shaped collar with bold patterns, warm earth-tone backdrop. Faded 70s film color, slight grain, soft warm lighting. Keep the person\'s identity and facial features recognizable.',
    'Prom Queen': 'Transform this person into a 1990s prom queen yearbook portrait. Elegant updo hairstyle, sparkling tiara, formal satin gown with sweetheart neckline, soft glowing backlight, blue gradient backdrop. Soft romantic yearbook aesthetic. Keep the person\'s identity and facial features recognizable.',
    'Class Nerd': 'Transform this person into a 1990s class nerd yearbook portrait. Large round wire-frame glasses, tightly buttoned plaid shirt with sweater vest or bow tie, neatly combed hair, awkward warm smile, blue gradient backdrop. Classic yearbook lighting. Keep the person\'s identity and facial features recognizable.',
    'Cheerleader': 'Transform this person into a 1990s high school cheerleader yearbook portrait. Wearing a varsity cheerleader uniform with school colors (red and white), holding pom-poms, hair tied with a ribbon, bright energetic smile, blue gradient backdrop. Classic yearbook lighting. Keep the person\'s identity and facial features recognizable.',
    'Star Athlete': 'Transform this person into a 1990s high school star athlete yearbook portrait. Wearing a varsity letterman jacket with school patch, slightly tousled hair, confident smile, gymnasium or blue gradient backdrop. Classic yearbook studio lighting. Keep the person\'s identity and facial features recognizable.',
    'Goth Kid': 'Transform this person into a 1990s high school goth yearbook portrait. Dyed black hair with straight bangs, dark eyeliner and dark lipstick, black mesh or velvet top with silver chain choker, pale skin, brooding neutral expression, dark gradient backdrop. Classic yearbook composition. Keep the person\'s identity and facial features recognizable.',
    'Punk Rocker': 'Transform this person into a 1990s high school punk rocker yearbook portrait. Spiked or mohawk-style hair (possibly dyed bright color), leather jacket with band patches and studs, ripped t-shirt underneath, confident smirk, gritty dark backdrop. Classic yearbook lighting with edge. Keep the person\'s identity and facial features recognizable.',
  };

  return yearbookMap[preset.name] || `Transform this person into an authentic retro ${preset.name} yearbook portrait. Vintage school photo aesthetic, classic studio backdrop. Keep identity recognizable.`;
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
    'ai-yearbook-generator': 'yearbookStyles',
    'ai-passport-photo-maker': 'passportSizes',
    'ai-face-expression-changer': 'expressions',
    'ai-skin-type': 'skinTypes',
    'ai-skin-concern': 'skinConcerns',
    'ai-room-cleaner': 'cleaningLevels',
    'ai-room-planner': 'styles',
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
    'ai-face-pair': 'facePairStyles',
    'ai-skin-analyzer': 'skinAnalysisStyles',
    'ai-eyewear-tryon': 'eyewearStyles',
    'ai-aesthetic-sim': 'aestheticStyles',
    'ai-teeth-whitening': 'teethWhiteningStyles',
    'ai-skin-smoother': 'skinSmootherStyles',
    'ai-room-redesign': 'roomStyles',
    'ai-double-chin-remover': 'chinStyles',
    'ai-hat-tryon': 'hatStyles',
    'ai-model-swap': 'modelStyles',
    'ai-face-symmetry': 'symmetryAnalyses',
    'ai-gender-swap': 'genderStyles',
    'ai-face-anonymizer': 'anonymizerStyles',
    'ai-smart-recognition': 'recognitionStyles',
    'ai-image-to-3d': 'threeDStyles',
    'ai-couple-match': 'coupleMatchStyles',
    'ai-tshirt-designer': 'tshirtStyles',
    'ai-book-cover-designer': 'bookCoverStyles',
    'ai-ad-designer': 'adStyles',
    'ai-thumbnail-maker': 'thumbnailStyles',
    'ai-color-palette-card': 'cardStyles',
    'ai-manga-translator': 'translationLanguages',
    'ai-minecraft-skin': 'skinStyles',
    'ai-3d-camera-control': 'cameraAngles',
    'ai-body-swap': 'swapStyles',
    'ai-hairstyle-analysis': 'analysisStyles',
    'ai-emoji-mosaic': 'mosaics',
    'ai-face-swap': 'faceSwapStyles',
    'ai-celebrity-lookalike': 'celebrities',
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
    case 'ai-room-planner':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A wide-angle interior photo of a basic plain bedroom with white walls, hardwood floors, a simple bed with neutral linens, a small nightstand and a window with sheer curtains. Bright natural daylight, undecorated base look. Photorealistic interior photography, sharp focus, 4:3 aspect ratio, 8K quality.',
          transformPreset: 'Japandi',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A wide-angle interior photo of a basic plain kitchen with white cabinets, neutral countertops, simple wooden floors, a window above the sink and minimal decor. Bright natural daylight, undecorated base look. Photorealistic interior photography, sharp focus, 4:3 aspect ratio, 8K quality.',
          transformPreset: 'Industrial',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A wide-angle interior photo of a basic plain home office with white walls, hardwood floors, a simple desk and chair, an empty bookshelf and a window with sheer curtains. Bright natural daylight, undecorated base look. Photorealistic interior photography, sharp focus, 4:3 aspect ratio, 8K quality.',
          transformPreset: 'Bohemian',
        },
      ];
    case 'ai-room-cleaner':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A wide-angle interior photo of a heavily cluttered messy bedroom with an unmade bed, scattered clothes on the floor, books and magazines piled up, half-empty coffee cups, cables, a wardrobe with the door open, posters taped to the walls, and laundry on a chair. Natural daylight, sharp focus, 4:3 aspect ratio, photorealistic, 8K quality.',
          transformPreset: 'Decluttered',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A wide-angle interior photo of a cluttered home office with a desk overloaded with monitors, papers, books, takeout boxes, plants, a chair piled with sweaters, wall art, plug-strip cables tangled on the floor, and a full bookshelf. Natural daylight from a window, sharp focus, 4:3 aspect ratio, photorealistic, 8K quality.',
          transformPreset: 'Empty Room',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A wide-angle interior photo of a moderately decorated kitchen and dining area with a wooden dining table, mismatched chairs, dishes and glasses on the table, wall calendars, plants, decorative items on the countertops, fruit bowl, and small appliances. Natural daylight, sharp focus, 4:3 aspect ratio, photorealistic, 8K quality.',
          transformPreset: 'Move-In Ready',
        },
      ];
    case 'ai-face-expression-changer':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional close-up portrait photo of a young Asian woman in her early 20s with a completely neutral expression, long straight black hair, light makeup, wearing a casual white sweater. Studio lighting, soft beige background. Photorealistic, 8K quality.',
          transformPreset: 'Big Smile',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional close-up portrait photo of a young Black man in his late 20s with a completely neutral expression, short natural hair, clean-shaven, wearing a casual navy hoodie. Studio lighting, soft gray background. Photorealistic, 8K quality.',
          transformPreset: 'Surprised',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional close-up portrait photo of a young Latina woman in her mid-20s with a completely neutral expression, shoulder-length wavy brown hair, light makeup, wearing a casual olive t-shirt. Studio lighting, soft warm background. Photorealistic, 8K quality.',
          transformPreset: 'Wink',
        },
      ];
    case 'ai-passport-photo-maker':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A casual indoor selfie of a young Asian woman in her late 20s, slightly off-center, wearing a colorful patterned blouse, neutral expression, taken in a kitchen with a cluttered countertop and microwave behind her. Phone-quality photo, mixed natural and overhead light. Photorealistic, 8K quality.',
          transformPreset: 'China Visa',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A casual outdoor selfie of a young Black man in his early 30s, slightly tilted angle, wearing a casual hoodie, smiling lightly, taken in a busy city park with people and trees blurred in the background. Phone-quality photo, bright daylight. Photorealistic, 8K quality.',
          transformPreset: 'US Passport',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A casual indoor selfie of a young Latina woman in her late 20s, slightly leaning, wearing a casual sweater, neutral expression, taken in a bedroom with a bed, posters and clothes visible in the background. Phone-quality photo, warm yellow indoor light. Photorealistic, 8K quality.',
          transformPreset: 'EU / Schengen',
        },
      ];
    case 'ai-yearbook-generator':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A modern color portrait photo of a young Asian woman in her early 20s with long straight black hair, neutral expression, wearing a plain white t-shirt. Clean light gray studio background, even lighting, sharp focus, front-facing, head and shoulders visible. Modern smartphone-quality photo. Photorealistic, 8K quality.',
          transformPreset: 'Prom Queen',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A modern color portrait photo of a young Black man in his early 20s with short natural hair, neutral expression, wearing a plain gray t-shirt. Clean light gray studio background, even lighting, sharp focus, front-facing, head and shoulders visible. Modern smartphone-quality photo. Photorealistic, 8K quality.',
          transformPreset: 'Star Athlete',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A modern color portrait photo of a young Latina woman in her early 20s with shoulder-length wavy brown hair, neutral expression, wearing a plain navy t-shirt. Clean light gray studio background, even lighting, sharp focus, front-facing, head and shoulders visible. Modern smartphone-quality photo. Photorealistic, 8K quality.',
          transformPreset: 'Cheerleader',
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
    case 'ai-face-pair':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A side-by-side comparison layout showing two professional headshot portraits — on the left a young Asian woman with long black hair, brown eyes, gentle smile; on the right another young Asian woman with shoulder-length black hair, brown eyes, similar facial structure. Both facing camera, white background, studio lighting',
          transformPreset: 'Family Resemblance',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A side-by-side comparison layout showing two professional headshot portraits — on the left a young Black man with short curly hair, brown eyes, confident expression; on the right a young Black woman with natural curly hair, brown eyes, warm smile. Both facing camera, white background, studio lighting',
          transformPreset: 'Couple Match',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A side-by-side comparison layout showing two professional headshot portraits — on the left a young Caucasian man with blonde hair, blue eyes, neutral expression; on the right the same man but 20 years older with gray streaks and wrinkles. Both facing camera, white background, studio lighting',
          transformPreset: 'Twin Meter',
        },
      ];
    case 'ai-skin-analyzer':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman with clear skin, minimal makeup, hair in ponytail, neutral expression, facing camera, studio lighting, white background, high resolution',
          transformPreset: 'Acne Analysis',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a middle-aged Black man with natural skin showing some fine lines, clean-shaven, neutral expression, facing camera, studio lighting, white background, high resolution',
          transformPreset: 'Wrinkle Map',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a young Latina woman with natural dewy skin, no makeup, hair pulled back, slight smile, facing camera, studio lighting, white background, high resolution',
          transformPreset: 'Moisture Level',
        },
      ];
    case 'ai-eyewear-tryon':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman with clear face, no glasses, natural expression, hair pulled back, studio lighting, white background, high resolution',
          transformPreset: 'Cat Eye',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a Black man with clean-shaven face, no glasses, natural expression, casual attire, studio lighting, white background, high resolution',
          transformPreset: 'Wayfarer',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a young Latina woman with clear face, no glasses, natural expression, hair down, studio lighting, white background, high resolution',
          transformPreset: 'Oversized Square',
        },
      ];
    case 'ai-aesthetic-sim':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman with natural face, no makeup, neutral expression, hair pulled back, studio lighting, white background, high resolution',
          transformPreset: 'Nose Refinement',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a Black man with natural face, clean-shaven, neutral expression, casual attire, studio lighting, white background, high resolution',
          transformPreset: 'Jawline Contour',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a young Latina woman with natural face, no makeup, neutral expression, hair down, studio lighting, white background, high resolution',
          transformPreset: 'Lip Enhancement',
        },
      ];
    case 'ai-teeth-whitening':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman smiling with teeth showing, natural teeth color, hair pulled back, studio lighting, white background, high resolution',
          transformPreset: 'Pearl White',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a Black man smiling broadly with teeth showing, natural teeth, casual attire, studio lighting, white background, high resolution',
          transformPreset: 'Bright White',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a young Latina woman smiling with teeth showing, slight coffee stains on teeth, hair down, studio lighting, white background, high resolution',
          transformPreset: 'Stain Removal',
        },
      ];
    case 'ai-skin-smoother':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman with natural unretouched skin, visible pores and minor blemishes, no makeup, hair pulled back, studio lighting, white background, high resolution',
          transformPreset: 'Glass Skin',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a Black woman with natural skin texture, some acne spots and uneven tone, no makeup, casual attire, studio lighting, white background, high resolution',
          transformPreset: 'Blemish Clear',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a middle-aged Caucasian woman with natural skin showing fine lines and texture, minimal makeup, hair down, studio lighting, white background, high resolution',
          transformPreset: 'Anti-Wrinkle',
        },
      ];
    case 'ai-room-redesign':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A photograph of a small studio apartment living room with plain white walls, basic furniture, old couch, cluttered shelves, natural light from a window. Undecorated and basic interior, high resolution',
          transformPreset: 'Scandinavian',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A photograph of a dated bedroom with beige walls, old wooden bed frame, mismatched furniture, simple curtains. Outdated interior design, natural light, high resolution',
          transformPreset: 'Japanese Zen',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A photograph of a plain office room with white walls, basic desk and chair, fluorescent lighting, no decorations. Simple corporate office space, high resolution',
          transformPreset: 'Industrial',
        },
      ];
    case 'ai-double-chin-remover':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman with a visible double chin and round face, slightly overweight, natural skin, no makeup, neutral expression, front-facing, well-lit studio lighting, white background, high resolution close-up',
          transformPreset: 'V-Line',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a middle-aged Black man with a noticeable double chin and full face, natural skin, short hair, light beard, neutral expression, well-lit studio lighting, white background, high resolution close-up',
          transformPreset: 'Sharp Jawline',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a young Latina woman with a double chin and soft jawline, slightly overweight, natural skin, minimal makeup, hair down, neutral expression, well-lit studio lighting, white background, high resolution close-up',
          transformPreset: 'Sculpted',
        },
      ];
    case 'ai-hat-tryon':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman with long black hair, no hat, natural skin, neutral expression, front-facing, well-lit studio lighting, white background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Beret',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a young Black man with short hair, no hat, natural skin, friendly smile, front-facing, well-lit studio lighting, white background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Fedora',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a young Latina woman with wavy brown hair, no hat, natural skin, warm smile, front-facing, well-lit studio lighting, white background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Cowboy Hat',
        },
      ];
    case 'ai-model-swap':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A full-body e-commerce product photo of a plain white mannequin wearing a floral summer dress. Clean white studio background, professional product photography lighting, high resolution',
          transformPreset: 'Young Asian Woman',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A full-body e-commerce product photo of a plain white mannequin wearing a dark business suit with tie. Clean white studio background, professional product photography lighting, high resolution',
          transformPreset: 'Young Black Man',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A full-body e-commerce product photo of a plain white mannequin wearing an athletic outfit with leggings and sports top. Clean white studio background, professional product photography lighting, high resolution',
          transformPreset: 'Latina Woman',
        },
      ];
    case 'ai-face-symmetry':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional headshot portrait of a young Asian woman with straight black hair, neutral expression, looking directly at the camera, face perfectly centered, even studio lighting, simple light gray background, high resolution',
          transformPreset: 'Overall Symmetry',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional headshot portrait of a young Black man with short hair, neutral expression, looking directly at the camera, face perfectly centered, even studio lighting, simple light gray background, high resolution',
          transformPreset: 'Golden Ratio',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional headshot portrait of a young Caucasian woman with light brown hair pulled back, neutral expression, looking directly at the camera, face perfectly centered, even studio lighting, simple light gray background, high resolution',
          transformPreset: 'Eye Symmetry',
        },
      ];
    case 'ai-gender-swap':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman with long straight black hair, natural skin, warm brown eyes, neutral expression, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Strong Masculine',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a young Black man with short curly hair, clean-shaven, dark brown eyes, friendly expression, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Glamorous Female',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a young Latina woman with wavy dark brown hair, warm skin tone, hazel eyes, natural smile, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Androgynous',
        },
      ];
    case 'ai-face-anonymizer':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian man with short black hair, clean-shaven, brown eyes, neutral expression, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Natural Look-alike',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A professional portrait photo of a young Black woman with curly natural hair, dark brown eyes, warm smile, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Pixel Mosaic',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional portrait photo of a young Caucasian man with light brown hair, blue eyes, light beard, friendly expression, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up',
          transformPreset: 'Oil Paint',
        },
      ];
    case 'ai-smart-recognition':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A professional portrait photo of a young Asian woman wearing trendy streetwear fashion, standing against a plain wall, well-lit natural lighting, high resolution full body shot, photorealistic',
          transformPreset: 'Fashion Analysis',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A close-up product photo of a colorful smoothie bowl with fresh fruits, granola, and edible flowers on a marble countertop, top-down perspective, professional food photography, high resolution',
          transformPreset: 'Product Analysis',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A professional headshot portrait of a young man with short dark hair, blue eyes, neutral expression, front-facing, well-lit studio lighting, neutral background, high resolution close-up, photorealistic',
          transformPreset: 'Face Recognition',
        },
      ];
    case 'ai-image-to-3d':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A cute white rabbit sitting on grass looking at the camera with big round eyes. Clear well-lit outdoor photograph, bright natural lighting, sharp focus. High quality, 8K.',
          transformPreset: 'Clay Render',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A modern sports car in red, parked at an angle on a clean road, dramatic lighting, professional automotive photography, sharp focus, high resolution.',
          transformPreset: 'Low Poly',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A cozy small house with a garden and white picket fence, charming architecture, warm sunlight, clear blue sky, professional real estate photography, high resolution.',
          transformPreset: 'Voxel',
        },
      ];
    case 'ai-couple-match':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A side-by-side portrait of a young Asian couple — on the left a young Korean woman with straight black hair and gentle smile, on the right a young Korean man with neat dark hair and warm expression. Both facing camera, studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Baby Prediction',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A side-by-side portrait of a young interracial couple — on the left a young Black woman with curly hair and bright smile, on the right a young Caucasian man with brown hair and friendly grin. Both facing camera, studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Anime Couple',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A side-by-side portrait of a young couple — on the left a young Latina woman with long wavy brown hair and warm smile, on the right a young Middle Eastern man with dark beard and kind eyes. Both facing camera, studio lighting, neutral background. Photorealistic, 8K.',
          transformPreset: 'Wedding Portrait',
        },
      ];
    case 'ai-tshirt-designer':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A beautiful sunset landscape photograph with vibrant orange and purple sky over a calm ocean. Professional landscape photography, high resolution, 8K.',
          transformPreset: 'Vintage Retro',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A close-up portrait photo of a majestic lion with a flowing mane, looking directly at the camera. Clear sharp wildlife photography, dramatic lighting, high resolution, 8K.',
          transformPreset: 'Neon Glow',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A vibrant bouquet of colorful flowers including roses, sunflowers, and daisies in a glass vase. Bright natural lighting, clean white background, professional product photography, 8K.',
          transformPreset: 'Watercolor',
        },
      ];
    case 'ai-book-cover-designer':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A dark enchanted forest with glowing fireflies, twisted ancient trees, and a narrow path leading into misty depths. Atmospheric fantasy photography, moody lighting, high resolution, 8K.',
          transformPreset: 'Fantasy',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A futuristic cityscape at night with neon-lit skyscrapers, flying vehicles, and holographic advertisements. Cyberpunk urban photography, dramatic perspective, high resolution, 8K.',
          transformPreset: 'Sci-Fi',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A cozy Italian countryside villa surrounded by sunflower fields and rolling hills under a warm golden sunset. Romantic landscape photography, soft warm lighting, high resolution, 8K.',
          transformPreset: 'Romance',
        },
      ];
    case 'ai-ad-designer':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A pair of premium white running shoes on a clean white surface. Modern athletic footwear with mesh upper and thick sole. Professional product photography, soft studio lighting, high resolution, 8K.',
          transformPreset: 'Social Media Post',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A bottle of luxury perfume with gold cap on a marble surface with soft pink flower petals. Elegant fragrance product photography, dramatic lighting, high resolution, 8K.',
          transformPreset: 'Luxury Brand',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A modern laptop computer open on a wooden desk with a coffee cup beside it. Clean workspace setup, natural window lighting, lifestyle product photography, high resolution, 8K.',
          transformPreset: 'YouTube Thumbnail',
        },
      ];
    case 'ai-thumbnail-maker':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A young Asian man with a shocked open-mouth expression pointing at something off-screen. Bright green background. High contrast studio lighting, sharp focus, 16:9 landscape format. Professional YouTube creator portrait, 8K quality.',
          transformPreset: 'Clickbait',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A young Black woman wearing headphones with a warm genuine smile, looking at the camera. Soft purple gradient background. High contrast studio lighting, sharp focus, 16:9 landscape format. Professional YouTube creator portrait, 8K quality.',
          transformPreset: 'Gaming',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A bearded Caucasian man in a flannel shirt holding a camera, looking thoughtfully at the camera. Warm sunset golden hour background. Natural lighting, sharp focus, 16:9 landscape format. Professional YouTube creator portrait, 8K quality.',
          transformPreset: 'Vlog',
        },
      ];
    case 'ai-color-palette-card':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A cozy flat-lay photo of a coffee cup, an open book, and dried flowers on a warm wooden table. Soft morning light, muted earthy tones of beige, brown, and sage green. Aesthetic lifestyle photography, sharp focus, high quality, 8K.',
          transformPreset: 'Palette Diary',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A vibrant street-food market scene with colorful fruits, spices, and lanterns. Rich saturated reds, yellows, and oranges, bustling atmosphere, golden hour light. Travel photography, sharp focus, high dynamic range, 8K quality.',
          transformPreset: 'Magazine',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A serene mountain lake at dawn with mist over the water, snow-capped peaks, and pine trees reflected on the surface. Cool blue and teal tones with soft pink sky. Landscape photography, sharp focus, high quality, 8K.',
          transformPreset: 'Moment Poster',
        },
      ];
    case 'ai-manga-translator':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A Japanese shonen manga page with 4 panels showing a battle scene. A spiky-haired warrior character charging forward with energy effects. Speech bubbles with bold Japanese text, sound effect onomatopoeia. Black and white manga with dynamic action lines, heavy shading, intense expressions. High quality manga page.',
          transformPreset: 'English',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A Japanese manga page with 3 panels showing a slice-of-life school scene. Students in uniforms talking in a classroom with cherry blossoms visible through the window. Speech bubbles with casual Japanese dialogue. Black and white manga with clean line art, light screentone shading. High quality manga page.',
          transformPreset: 'Chinese Simplified',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A Japanese manga page with 4 panels showing a mystery/detective scene. A character with glasses examining clues in a dark room. Narration boxes with Japanese text at the top, speech bubbles with dialogue. Black and white manga with moody shadows, detailed backgrounds, noir atmosphere. High quality manga page.',
          transformPreset: 'Korean',
        },
      ];
    case 'ai-minecraft-skin':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A young Asian woman with short bob haircut wearing a casual denim jacket. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Natural expression, photorealistic, 8K quality.',
          transformPreset: 'Creeper',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A young Black man with a neat fade haircut and warm smile, wearing a navy sweater. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Nether Knight',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A Latina woman with long wavy hair and confident expression, wearing a red top. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Ender Dragon',
        },
      ];
    case 'ai-3d-camera-control':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A young Asian woman with straight black hair and soft smile, wearing a light pink blouse. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Right Three-Quarter',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A young Black man with a neat fade haircut and warm smile, wearing a navy sweater. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Low Angle',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A Latina woman with long wavy hair and confident expression, wearing a white blouse. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Back View',
        },
      ];
    case 'ai-celebrity-lookalike':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A casual photo of an ordinary young Asian woman with straight black hair (no makeup), wearing a plain white t-shirt. Clean neutral light gray background, soft even natural lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'K-Pop Idol',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A casual photo of an ordinary young Black man with short natural hair (no styling), wearing a plain gray t-shirt. Clean neutral light gray background, soft even natural lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Movie Hero',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A casual photo of an ordinary young Latina woman with shoulder-length wavy brown hair (no makeup), wearing a plain beige top. Clean neutral light gray background, soft even natural lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Bollywood Star',
        },
      ];
    case 'ai-face-swap':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A young Asian woman with shoulder-length straight black hair and a confident smile, wearing a navy blazer over a white blouse. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Movie Star',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A young Black man with a neat fade haircut and warm expression, wearing a beige cable-knit sweater. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Renaissance Portrait',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A Latina woman with long wavy auburn hair and bright eyes, wearing a soft pink top. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Anime Character',
        },
      ];
    case 'ai-body-swap':
      return [
        {
          fileName: 'case-1',
          basePrompt: 'A young Asian man with short black hair and friendly expression, wearing a plain gray t-shirt. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Athletic Fit',
        },
        {
          fileName: 'case-2',
          basePrompt: 'A young Black woman with curly natural hair and bright smile, wearing a simple white blouse. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Cinematic Look',
        },
        {
          fileName: 'case-3',
          basePrompt: 'A Caucasian man with light brown hair and confident expression, wearing a casual blue shirt. Clean neutral background, studio lighting, sharp focus, front-facing portrait. Photorealistic, 8K quality.',
          transformPreset: 'Professional Portrait',
        },
      ];
    case 'ai-hairstyle-analysis':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A professional portrait of a young Asian woman with long straight black hair, natural skin, neutral expression. Hair clearly visible and well-lit. Studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Color Consultation',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A professional portrait of a young Black man with short textured natural hair, clean-shaven, friendly smile. Hair clearly visible and well-lit. Studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Celebrity Match',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A professional portrait of a young Latina woman with curly medium-length brown hair, natural makeup, warm smile. Hair clearly visible and well-lit. Studio lighting, neutral gray background. Photorealistic, 8K quality.',
          transformPreset: 'Salon Ready',
        },
      ];
    case 'ai-emoji-mosaic':
      return [
        {
          fileName: 'case-1.png',
          basePrompt: 'A beautiful aerial photograph of a Japanese temple surrounded by cherry blossom trees in full bloom, bright pink petals, clear blue sky. Rich vibrant colors, sharp detail, high quality, 8K.',
          transformPreset: 'Classic Grid',
        },
        {
          fileName: 'case-2.png',
          basePrompt: 'A colorful close-up photograph of a macaw parrot with bright red, blue, yellow, and green feathers. Sharp detail, vivid saturated colors, clean background. High quality, 8K.',
          transformPreset: 'Color Pop',
        },
        {
          fileName: 'case-3.png',
          basePrompt: 'A dramatic cityscape photograph of Tokyo at night with neon signs, skyscrapers, and busy streets lit up in vibrant colors. Cyberpunk aesthetic, rich neon blues and pinks, sharp detail. High quality, 8K.',
          transformPreset: 'Neon Glow',
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
  'ai-face-pair': 'Overall Match',
  'ai-skin-analyzer': 'Full Skin Report',
  'ai-eyewear-tryon': 'Classic Aviator',
  'ai-aesthetic-sim': 'Full Makeover',
  'ai-teeth-whitening': 'Hollywood White',
  'ai-skin-smoother': 'Glass Skin',
  'ai-room-redesign': 'Scandinavian',
  'ai-double-chin-remover': 'V-Line',
  'ai-hat-tryon': 'Cowboy Hat',
  'ai-model-swap': 'Young Asian Woman',
  'ai-face-symmetry': 'Overall Symmetry',
  'ai-gender-swap': 'Strong Masculine',
  'ai-face-anonymizer': 'Natural Look-alike',
  'ai-smart-recognition': 'Surveillance Feed',
  'ai-image-to-3d': 'Cartoon 3D',
  'ai-couple-match': 'Love Score',
  'ai-tshirt-designer': 'Pop Art',
  'ai-book-cover-designer': 'Fantasy',
  'ai-ad-designer': 'Sale Banner',
  'ai-thumbnail-maker': 'Cinematic',
  'ai-color-palette-card': 'Split Cover',
  'ai-manga-translator': 'English',
  'ai-minecraft-skin': 'Diamond Armor',
  'ai-3d-camera-control': 'Left Three-Quarter',
  'ai-body-swap': 'Fashion Editorial',
  'ai-hairstyle-analysis': 'Face Shape Match',
  'ai-emoji-mosaic': 'Neon Glow',
  'ai-face-swap': 'Movie Star',
  'ai-celebrity-lookalike': 'A-List Hollywood',
  'ai-yearbook-generator': '90s Classic',
  'ai-passport-photo-maker': 'US Passport',
  'ai-face-expression-changer': 'Big Smile',
  'ai-skin-type': 'Oily',
  'ai-skin-concern': 'Acne & Breakouts',
  'ai-room-cleaner': 'Empty Room',
  'ai-room-planner': 'Scandinavian',
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
    case 'ai-yearbook-generator':
      return `A clean modern color portrait photo of a young man in his early 20s with short brown hair, neutral expression, wearing a plain dark blue t-shirt. Clean light gray studio background, even modern lighting, sharp focus, front-facing, head and shoulders visible. Modern smartphone-quality photo, photorealistic, 8K quality.`;
    case 'ai-passport-photo-maker':
      return `A casual indoor selfie of a young man in his early 30s with short brown hair and stubble, wearing a casual flannel shirt, slight friendly smile, taken in a home office with bookshelf and lamp visible behind him. Phone-quality photo, warm mixed lighting. Photorealistic, 8K quality.`;
    case 'ai-face-expression-changer':
      return `A professional close-up portrait photo of a young man in his early 30s with a completely neutral expression, short dark hair, clean-shaven, wearing a casual gray sweater. Studio lighting, soft neutral background. Photorealistic, 8K quality.`;
    case 'ai-skin-type':
      return `A clean close-up beauty portrait photo of a young woman in her late 20s with a completely bare face, no makeup, hair pulled back. Balanced healthy neutral skin with natural texture, calm expression, front-facing, even soft studio lighting, plain light background. Photorealistic, 8K quality.`;
    case 'ai-skin-concern':
      return `A clean close-up beauty portrait photo of a young woman in her late 20s with a completely bare face, no makeup, hair pulled back. Clear healthy even-toned skin with natural texture, calm expression, front-facing, even soft studio lighting, plain light background. Photorealistic, 8K quality.`;
    case 'ai-room-cleaner':
      return `A wide-angle interior photo of a cluttered modern apartment living room — a dark gray sofa with throw pillows, glass coffee table covered with magazines and a half-drunk coffee, large flatscreen TV on a console with cables, books stacked unevenly, a guitar leaning against the wall, plants in pots, a rug, throw blanket, slippers near the sofa, picture frames on the wall. Late afternoon natural light through large windows. Photorealistic interior photography, sharp focus, 4:3 aspect ratio, 8K quality.`;
    case 'ai-room-planner':
      return `A wide-angle interior photo of a basic plain dining room with white walls, hardwood floors, a simple wooden dining table and chairs, a window with sheer curtains and minimal decor. Bright natural daylight, undecorated base look ready for restyling. Photorealistic interior photography, sharp focus, 4:3 aspect ratio, 8K quality.`;
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
    case 'ai-face-pair':
      return `A side-by-side comparison layout showing two professional headshot portraits — on the left a young man with short brown hair, green eyes, clean-shaven; on the right a middle-aged man with similar features but graying hair and smile lines. Both facing camera, white background, studio lighting`;
    case 'ai-skin-analyzer':
      return `A professional portrait photo of a young man with light stubble, natural skin with visible pores on nose, no skincare products, neutral expression, facing camera, even studio lighting, white background, high resolution close-up`;
    case 'ai-eyewear-tryon':
      return `A professional portrait photo of a young man with clean-shaven face, no glasses, natural expression, casual attire, well-lit, neutral background`;
    case 'ai-aesthetic-sim':
      return `A professional portrait photo of a young man with natural face, light stubble, neutral expression, casual attire, well-lit, neutral background`;
    case 'ai-teeth-whitening':
      return `A professional portrait photo of a young man smiling broadly with teeth showing, natural slightly yellow teeth, light stubble, casual attire, well-lit, neutral background`;
    case 'ai-skin-smoother':
      return `A professional portrait photo of a young Asian woman with natural skin showing visible pores and slight texture, no makeup or filters, neutral expression, hair pulled back, well-lit studio lighting, white background, high resolution close-up`;
    case 'ai-room-redesign':
      return `A photograph of a medium-sized living room with plain beige walls, old basic furniture, a simple sofa, coffee table, and bookshelf. Dated interior with no particular design style, natural light from windows, clean but undecorated. High resolution interior photography`;
    case 'ai-double-chin-remover':
      return `A professional portrait photo of a young man with a noticeable double chin and round face, slightly overweight, natural skin, light stubble, neutral expression, casual attire, well-lit, neutral background`;
    case 'ai-hat-tryon':
      return `A professional portrait photo of a young man with short brown hair, no hat, natural skin, friendly smile, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up`;
    case 'ai-model-swap':
      return `A full-body e-commerce product photo of a plain gray mannequin wearing a casual red dress with short sleeves. Clean white studio background, soft professional lighting, high resolution product photography`;
    case 'ai-face-symmetry':
      return `A professional headshot portrait of a young man with short dark hair, clean-shaven, neutral expression, looking directly at the camera, face perfectly centered and front-facing. Clean even studio lighting from both sides, no shadows. Simple light gray background. High resolution, sharp focus on facial features`;
    case 'ai-gender-swap':
      return `A professional portrait photo of a young man in his late 20s with short brown hair, clean-shaven, warm brown eyes, friendly natural smile, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up, photorealistic`;
    case 'ai-face-anonymizer':
      return `A professional portrait photo of a young man in his early 30s with short dark hair, light stubble, blue eyes, friendly natural smile, front-facing, well-lit studio lighting, neutral gray background, head and shoulders visible, high resolution close-up, photorealistic`;
    case 'ai-smart-recognition':
      return `A professional product photography shot of a sleek red sports car parked at an angle in a modern showroom, clean reflective floor, dramatic studio lighting, high resolution, photorealistic`;
    case 'ai-image-to-3d':
      return `A cute orange tabby cat sitting on a wooden table looking at the camera with bright green eyes. Clear well-lit photograph, clean simple background, sharp focus. Professional pet photography, high quality, 8K.`;
    case 'ai-couple-match':
      return `A side-by-side portrait of a young couple — on the left a young Latina woman with wavy brown hair and bright smile, on the right a young Black man with short curly hair and warm grin. Both facing camera, shoulders visible, studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-tshirt-designer':
      return `A cute golden retriever puppy sitting on grass looking at the camera with a happy expression and tongue out. Clear well-lit outdoor photograph, bright natural lighting, sharp focus. High quality, 8K.`;
    case 'ai-book-cover-designer':
      return `A mysterious ancient castle perched on a cliff overlooking a stormy sea at twilight. Dark moody clouds with lightning in the distance, crashing waves below. Dramatic landscape photography, high resolution, 8K quality.`;
    case 'ai-ad-designer':
      return `A stylish modern smartwatch on a person's wrist with a glowing digital display showing fitness metrics. Clean bright studio photography, shallow depth of field, lifestyle product shot, natural warm lighting. High quality, 8K.`;
    case 'ai-thumbnail-maker':
      return `A young woman with curly hair and an excited surprised expression, mouth open, hands on cheeks. She is against a bright orange background. High contrast studio lighting, sharp focus, 16:9 landscape format. Professional YouTube creator portrait, 8K quality.`;
    case 'ai-color-palette-card':
      return `A dreamy lavender field at golden hour stretching to the horizon, with purple flowers, a winding path, and a soft warm sky. Rich purples, greens, and warm yellows, beautiful natural light, sharp focus. Aesthetic travel photography, high dynamic range, 8K quality.`;
    case 'ai-manga-translator':
      return `A Japanese manga page with 3 panels showing a romantic scene between two characters. Speech bubbles with Japanese text, narration boxes with Japanese text at the top. Black and white manga art style with screentone shading, delicate line art, expressive character faces with large eyes. Shoujo manga aesthetic, vertical format, high quality.`;
    case 'ai-minecraft-skin':
      return `A professional portrait photo of a young woman with long black hair and a bright smile, wearing a white blouse. Clean neutral gray background, studio lighting, sharp focus, front-facing, shoulders visible. Natural expression, photorealistic, high quality, 8K.`;
    case 'ai-3d-camera-control':
      return `A professional portrait photo of a young man with curly dark hair, wearing a navy blue polo shirt. Clean neutral gray background, studio lighting, sharp focus, front-facing, shoulders visible. Friendly natural smile, photorealistic, high quality, 8K.`;
    case 'ai-body-swap':
      return `A professional portrait photo of a young woman with long auburn hair and warm smile, wearing a white casual top. Clean neutral gray background, studio lighting, sharp focus, front-facing, head and shoulders visible. Natural expression, photorealistic, high quality, 8K.`;
    case 'ai-hairstyle-analysis':
      return `A professional headshot portrait photo of a young man in his early 30s with short curly dark hair, clean-shaven, wearing a casual gray shirt, friendly smile. Hair clearly visible and well-lit. Studio lighting, neutral gray background. Photorealistic, 8K quality.`;
    case 'ai-emoji-mosaic':
      return `A colorful vibrant photograph of a golden retriever puppy sitting in a field of wildflowers, looking directly at camera with tongue out. Bright natural sunlight, rich saturated colors, sharp focus. High quality, 8K.`;
    case 'ai-face-swap':
      return `A professional portrait photo of a young woman with long brown hair and a soft smile, wearing a beige blazer over a white top. Clean neutral gray background, studio lighting, sharp focus, front-facing, head and shoulders visible. Natural expression, photorealistic, high quality, 8K.`;
    case 'ai-celebrity-lookalike':
      return `A casual selfie-style photo of an ordinary young woman with shoulder-length wavy brown hair, soft natural skin (no makeup), wearing a plain white t-shirt. Clean neutral light gray background, even soft natural lighting, sharp focus, front-facing, shoulders visible. Natural relaxed expression, photorealistic, high quality, 8K.`;
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
  const allPages: PageType[] = ['ai-age-filter', 'ai-beard-filter', 'ai-makeup', 'ai-fat-filter', 'ai-headshot-generator', 'ai-hug', 'ai-smile-filter', 'ai-skin-color', 'ai-eye-color', 'ai-baby-generator', 'ai-photo-colorizer', 'ai-face-shape', 'ai-vintage-photo-booth', 'ai-photo-to-sketch', 'ai-photo-to-cartoon', 'ai-ascii-art-generator', 'ai-muscle-generator', 'ai-open-eyes', 'ai-pet-portrait', 'ai-personal-color', 'ai-perler-bead-pattern', 'ai-punch-hole-effect', 'ai-tattoo-generator', 'ai-sticker-generator', 'ai-logo-generator', 'ai-meme-generator', 'ai-face-animator', 'ai-glow-up-test', 'ai-outfit-change', 'ai-alter-ego', 'ai-virality-predictor', 'ai-attractiveness-test', 'ai-comic-frame', 'ai-bug-identifier', 'ai-face-pair', 'ai-skin-analyzer', 'ai-eyewear-tryon', 'ai-aesthetic-sim', 'ai-teeth-whitening', 'ai-skin-smoother', 'ai-room-redesign', 'ai-double-chin-remover', 'ai-hat-tryon', 'ai-model-swap', 'ai-face-symmetry', 'ai-gender-swap', 'ai-face-anonymizer', 'ai-smart-recognition', 'ai-image-to-3d', 'ai-couple-match', 'ai-tshirt-designer', 'ai-book-cover-designer', 'ai-ad-designer', 'ai-thumbnail-maker', 'ai-manga-translator', 'ai-minecraft-skin', 'ai-3d-camera-control', 'ai-body-swap', 'ai-hairstyle-analysis', 'ai-emoji-mosaic', 'ai-face-swap', 'ai-celebrity-lookalike', 'ai-yearbook-generator', 'ai-passport-photo-maker', 'ai-face-expression-changer', 'ai-room-cleaner', 'ai-room-planner', 'ai-color-palette-card', 'ai-skin-type', 'ai-skin-concern'];

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
