/**
 * Shared navigation data for the AI Image Effects mega menu.
 * Consumed by common/Header.tsx and home/CinematicLanding.tsx so the
 * homepage nav stays in sync with the site-wide header.
 */

export interface NavDropdownItem {
  label: string;
  href: string;
  icon: string;
}

export interface NavDropdownGroup {
  label: string;
  items: NavDropdownItem[];
}

type Translate = (key: string) => string;

export function buildAiEffectGroups(tNav: Translate): NavDropdownGroup[] {
  return [
    {
      label: tNav('categories.portrait'),
      items: [
        { label: tNav('dropdown.aiFigureGenerator'), href: '/ai-image-effects/ai-figure-generator', icon: '🎨' },
        { label: tNav('dropdown.aiHeadshotGenerator'), href: '/ai-image-effects/ai-headshot-generator', icon: '📸' },
        { label: tNav('dropdown.aiBabyGenerator'), href: '/ai-image-effects/ai-baby-generator', icon: '👶' },
        { label: tNav('dropdown.aiPetPortrait'), href: '/ai-image-effects/ai-pet-portrait', icon: '🐾' },
        { label: tNav('dropdown.aiAlterEgo'), href: '/ai-image-effects/ai-alter-ego', icon: '🎭' },
        { label: tNav('dropdown.aiCoupleMatch'), href: '/ai-image-effects/ai-couple-match', icon: '💑' },
        { label: tNav('dropdown.aiFacePair'), href: '/ai-image-effects/ai-face-pair', icon: '👥' },
        { label: tNav('dropdown.aiFaceSwap'), href: '/ai-image-effects/ai-face-swap', icon: '🔀' },
        { label: tNav('dropdown.aiCelebrityLookalike'), href: '/ai-image-effects/ai-celebrity-lookalike', icon: '🌟' },
        { label: tNav('dropdown.aiBodySwap'), href: '/ai-image-effects/ai-body-swap', icon: '🔄' },
        { label: tNav('dropdown.aiGenderSwap'), href: '/ai-image-effects/ai-gender-swap', icon: '🔄' },
        { label: tNav('dropdown.aiFaceAnonymizer'), href: '/ai-image-effects/ai-face-anonymizer', icon: '🎭' },
        { label: tNav('dropdown.aiHug'), href: '/ai-image-effects/ai-hug', icon: '🤗' },
        { label: tNav('dropdown.aiAttractivenessTest'), href: '/ai-image-effects/ai-attractiveness-test', icon: '💯' }
      ]
    },
    {
      label: tNav('categories.faceBeauty'),
      items: [
        { label: tNav('dropdown.aiMakeup'), href: '/ai-image-effects/ai-makeup', icon: '💄' },
        { label: tNav('dropdown.aiSkinSmoother'), href: '/ai-image-effects/ai-skin-smoother', icon: '🧴' },
        { label: tNav('dropdown.aiSkinAnalyzer'), href: '/ai-image-effects/ai-skin-analyzer', icon: '🧴' },
        { label: tNav('dropdown.aiSkinColor'), href: '/ai-image-effects/ai-skin-color', icon: '🎨' },
        { label: tNav('dropdown.aiTeethWhitening'), href: '/ai-image-effects/ai-teeth-whitening', icon: '🦷' },
        { label: tNav('dropdown.aiEyeColor'), href: '/ai-image-effects/ai-eye-color', icon: '👁️' },
        { label: tNav('dropdown.aiOpenEyes'), href: '/ai-image-effects/ai-open-eyes', icon: '👁️' },
        { label: tNav('dropdown.aiSmileFilter'), href: '/ai-image-effects/ai-smile-filter', icon: '😊' },
        { label: tNav('dropdown.aiBeardFilter'), href: '/ai-image-effects/beard-filter', icon: '🧔' },
        { label: tNav('dropdown.aiFaceShape'), href: '/ai-image-effects/ai-face-shape', icon: '🔷' },
        { label: tNav('dropdown.aiFaceSymmetry'), href: '/ai-image-effects/ai-face-symmetry', icon: '⚖️' },
        { label: tNav('dropdown.aiDoubleChinRemover'), href: '/ai-image-effects/ai-double-chin-remover', icon: '👤' },
        { label: tNav('dropdown.aiAestheticSim'), href: '/ai-image-effects/ai-aesthetic-sim', icon: '✨' },
        { label: tNav('dropdown.aiPersonalColor'), href: '/ai-image-effects/ai-personal-color', icon: '🎨' },
        { label: tNav('dropdown.aiHairstyleStudio'), href: '/ai-image-effects/ai-hairstyle', icon: '💇' },
        { label: tNav('dropdown.aiHairstyleAnalysis'), href: '/ai-image-effects/ai-hairstyle-analysis', icon: '💇' },
        { label: tNav('dropdown.aiAgeFilter'), href: '/ai-image-effects/ai-age-filter', icon: '🕐' },
        { label: tNav('dropdown.aiGlowUpTest'), href: '/ai-image-effects/ai-glow-up-test', icon: '✨' }
      ]
    },
    {
      label: tNav('categories.body'),
      items: [
        { label: tNav('dropdown.bodyEditor'), href: '/ai-image-effects/body-editor', icon: '💪' },
        { label: tNav('dropdown.aiFatFilter'), href: '/ai-image-effects/ai-fat-filter', icon: '⚖️' },
        { label: tNav('dropdown.aiMuscleGenerator'), href: '/ai-image-effects/ai-muscle-generator', icon: '💪' }
      ]
    },
    {
      label: tNav('categories.tryOn'),
      items: [
        { label: tNav('dropdown.aiClothesChanger'), href: '/ai-image-effects/ai-clothes-changer', icon: '👗' },
        { label: tNav('dropdown.aiOutfitChange'), href: '/ai-image-effects/ai-outfit-change', icon: '👔' },
        { label: tNav('dropdown.aiHatTryon'), href: '/ai-image-effects/ai-hat-tryon', icon: '🎩' },
        { label: tNav('dropdown.aiEyewearTryon'), href: '/ai-image-effects/ai-eyewear-tryon', icon: '👓' },
        { label: tNav('dropdown.virtualJewelryTryOn'), href: '/ai-image-effects/virtual-jewelry-try-on', icon: '💎' },
        { label: tNav('dropdown.aiNailColorChanger'), href: '/ai-image-effects/ai-nail-color-changer', icon: '💅' },
        { label: tNav('dropdown.aiModelSwap'), href: '/ai-image-effects/ai-model-swap', icon: '👗' }
      ]
    },
    {
      label: tNav('categories.artStyle'),
      items: [
        { label: tNav('dropdown.aiAnimeGenerator'), href: '/ai-anime-generator', icon: '🖌️' },
        { label: tNav('dropdown.aiPhotoToCartoon'), href: '/ai-image-effects/ai-photo-to-cartoon', icon: '🎨' },
        { label: tNav('dropdown.aiPhotoToSketch'), href: '/ai-image-effects/ai-photo-to-sketch', icon: '✏️' },
        { label: tNav('dropdown.aiPhotoColorizer'), href: '/ai-image-effects/ai-photo-colorizer', icon: '🎨' },
        { label: tNav('dropdown.aiVintagePhotoBooth'), href: '/ai-image-effects/ai-vintage-photo-booth', icon: '📷' },
        { label: tNav('dropdown.aiYearbook'), href: '/ai-image-effects/ai-yearbook-generator', icon: '🎓' },
        { label: tNav('dropdown.aiPassportPhotoMaker'), href: '/ai-image-effects/ai-passport-photo-maker', icon: '🛂' },
        { label: tNav('dropdown.aiFaceExpressionChanger'), href: '/ai-image-effects/ai-face-expression-changer', icon: '😄' },
        { label: tNav('dropdown.aiRoomCleaner'), href: '/ai-image-effects/ai-room-cleaner', icon: '🧹' },
        { label: tNav('dropdown.aiRoomPlanner'), href: '/ai-image-effects/ai-room-planner', icon: '🛋️' },
        { label: tNav('dropdown.aiOfficeDesign'), href: '/ai-image-effects/ai-office-design', icon: '🏢' },
        { label: tNav('dropdown.aiGardenDesign'), href: '/ai-image-effects/ai-garden-design', icon: '🪴' },
        { label: tNav('dropdown.aiVirtualStaging'), href: '/ai-image-effects/ai-virtual-staging', icon: '🛋️' },
        { label: tNav('dropdown.aiAsciiArtGenerator'), href: '/ai-image-effects/ai-ascii-art-generator', icon: '💻' },
        { label: tNav('dropdown.aiPerlerBeadPattern'), href: '/ai-image-effects/ai-perler-bead-pattern', icon: '🔲' },
        { label: tNav('dropdown.aiEmojiMosaic'), href: '/ai-image-effects/ai-emoji-mosaic', icon: '😀' },
        { label: tNav('dropdown.aiComicFrame'), href: '/ai-image-effects/ai-comic-frame', icon: '🖼️' },
        { label: tNav('dropdown.aiPunchHoleEffect'), href: '/ai-image-effects/ai-punch-hole-effect', icon: '🕳️' }
      ]
    },
    {
      label: tNav('categories.design'),
      items: [
        { label: tNav('dropdown.aiLogoGenerator'), href: '/ai-image-effects/ai-logo-generator', icon: '✨' },
        { label: tNav('dropdown.aiStickerGenerator'), href: '/ai-image-effects/ai-sticker-generator', icon: '🏷️' },
        { label: tNav('dropdown.aiTattooGenerator'), href: '/ai-image-effects/ai-tattoo-generator', icon: '🖋️' },
        { label: tNav('dropdown.aiMemeGenerator'), href: '/ai-image-effects/ai-meme-generator', icon: '😂' },
        { label: tNav('dropdown.cigarScanner'), href: '/ai-image-effects/cigar-scanner', icon: '🚬' },
        { label: tNav('dropdown.aiTshirtDesigner'), href: '/ai-image-effects/ai-tshirt-designer', icon: '👕' },
        { label: tNav('dropdown.aiBookCoverDesigner'), href: '/ai-image-effects/ai-book-cover-designer', icon: '📚' },
        { label: tNav('dropdown.aiAdDesigner'), href: '/ai-image-effects/ai-ad-designer', icon: '📢' },
        { label: tNav('dropdown.aiThumbnailMaker'), href: '/ai-image-effects/ai-thumbnail-maker', icon: '🎬' },
        { label: tNav('dropdown.aiColorPaletteCard'), href: '/ai-image-effects/ai-color-palette-card', icon: '🎨' }
      ]
    },
    {
      label: tNav('categories.threeDMotion'),
      items: [
        { label: tNav('dropdown.aiImageTo3d'), href: '/ai-image-effects/ai-image-to-3d', icon: '🧊' },
        { label: tNav('dropdown.ai3dCameraControl'), href: '/ai-image-effects/ai-3d-camera-control', icon: '🎥' },
        { label: tNav('dropdown.aiFaceAnimator'), href: '/ai-image-effects/ai-face-animator', icon: '🎭' },
        { label: tNav('dropdown.aiMinecraftSkin'), href: '/ai-image-effects/ai-minecraft-skin', icon: '🎮' }
      ]
    },
    {
      label: tNav('categories.utility'),
      items: [
        { label: tNav('dropdown.objectRemoval'), href: '/ai-image-effects/object-removal', icon: '🎯' },
        { label: tNav('dropdown.aiSmartRecognition'), href: '/ai-image-effects/ai-smart-recognition', icon: '🔍' },
        { label: tNav('dropdown.aiBugIdentifier'), href: '/ai-image-effects/ai-bug-identifier', icon: '🐛' },
        { label: tNav('dropdown.aiMangaTranslator'), href: '/ai-image-effects/ai-manga-translator', icon: '📖' },
        { label: tNav('dropdown.aiRoomRedesign'), href: '/ai-image-effects/ai-room-redesign', icon: '🏠' },
        { label: tNav('dropdown.aiViralityPredictor'), href: '/ai-image-effects/ai-virality-predictor', icon: '📈' }
      ]
    }
  ];
}

export function buildVideoDropdown(tNav: Translate): NavDropdownItem[] {
  return [
    { label: tNav('dropdown.aiKiss'), href: '/video/ai-kiss', icon: '💋' },
    { label: tNav('dropdown.aiHistoryCollage'), href: '/video/ai-vox-history-collage', icon: '📜' }
  ];
}
