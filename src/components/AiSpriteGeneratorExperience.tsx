'use client';

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import ImagePreviewModal from './ui/ImagePreviewModal';
import LoginModal from './ui/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

export interface SpritePresetAsset {
  displaySrc: string;
  referenceSrc: string;
  fileName: string;
  name: string;
}

interface AiSpriteGeneratorExperienceProps {
  spritePresets: SpritePresetAsset[];
}

interface UploadSlot {
  file: File | null;
  preview: string | null;
  url: string | null;
  fileName: string | null;
}

type MotionStateId = 'idle' | 'walk' | 'attack' | 'jump' | 'cast' | 'hit' | 'atlas';
type SheetLayoutId = '2x2' | '4x1' | '3x3';
type FacingDirectionId = 'sideRight' | 'sideLeft' | 'front' | 'isometric' | 'topDown';

const MAX_IMAGES = 2;
const MIN_IMAGES = 1;

const createEmptySlot = (): UploadSlot => ({
  file: null,
  preview: null,
  url: null,
  fileName: null,
});

const beforeImage =
  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/feature/before.png';
const afterImage =
  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/feature/after.png';

const STYLE_PROMPT_MAP: Record<string, string> = {
  '16-Bit Pixel Art':
    'authentic 16-bit SNES/GBA era pixel art sprite style, crisp pixel clusters, clean dark pixel outlines, hand-crafted dithering and shading, vibrant limited retro color palette, zero blurry anti-aliasing',
  '8-Bit Retro':
    'classic 8-bit NES/Game Boy Color arcade pixel art sprite style, bold chunky pixels, strict 4-to-8 color retro palette, high-contrast readable silhouette, nostalgic 1980s console aesthetic',
  'Hand-Painted 2D':
    'Hollow Knight and Ori inspired hand-painted 2D indie game sprite style, smooth brush-painted shading, expressiveinked silhouette, rich painterly highlights, studio-grade 2D platformer asset',
  'Cel-Shaded Anime':
    'Guilty Gear and Genshin-inspired 2D cel-shaded anime game fighter sprite style, razor-sharp anime linework, dynamic cel shading, vibrant saturated colors, expressive action silhouette',
  'Chibi Mascot':
    'MapleStory and mobile RPG inspired super-deformed chibi game sprite style, 2-head-tall cute proportions, oversized expressive head and weapon, glossy vibrant colors, thick clean outline',
  'Isometric 2.5D':
    'Hades and Bastion inspired isometric 2.5D tactical game character sprite style, 45-degreethree-quarter orthographic game perspective, crisp rim lighting, dimensional shaded armor and garments',
  'Dark Fantasy':
    'Blasphemous and Darkest Dungeon inspired grimdark gothic fantasy 2D game sprite style, dramatic heavy shadows, weathered metallic textures, eerie eldritch highlights, gritty dark RPG aesthetic',
  'Cyberpunk Neon':
    'Katana ZERO and Anno Mutationem inspired cyberpunk sci-fi 2D action sprite style, glowing cyan and magenta neon accents, sleek techwear visor and katana, high-contrast synthwave lighting',
};

const MOTION_PROMPT_MAP: Record<MotionStateId, string> = {
  idle: 'IDLE LOOP animation sequence: Frame 1 neutral ready stance, Frame 2 slight inhale chest rise and weapon poise, Frame 3 peak breathing bob with subtle cape/hair sway, Frame 4 smooth return to neutral ready stance for seamless looping',
  walk: 'WALK / RUN LOCOMOTION CYCLE sequence: Frame 1 contact stride (right foot forward, left arm forward), Frame 2 recoil/downward pass, Frame 3 passing stride (left foot forward, right arm forward), Frame 4 high-point push-off returning smoothly to Frame 1',
  attack: 'MELEE ATTACK COMBO sequence: Frame 1 dramatic wind-up anticipation pulling weapon back, Frame 2 explosive forward strike with dynamic motion slash arc, Frame 3 full extension impact pose with energy burst, Frame 4 follow-through recovery back to guard stance',
  jump: 'JUMP & AIRBORNE ARC sequence: Frame 1 crouch anticipation squash on ground, Frame 2 upward launch stretch lifting off, Frame 3 apex mid-air tucked pose at peak height, Frame 4 landing impact cushion pose',
  cast: 'MAGIC / SKILL CAST sequence: Frame 1 hands gathering arcane energy runes, Frame 2 channeling aura surging around character, Frame 3 dramatic spell release projection forward, Frame 4 glowing cooldown settle pose',
  hit: 'HIT REACTION & KNOCKBACK sequence: Frame 1 sharp impact flinch with hit-spark, Frame 2 backward recoil stagger, Frame 3 defensive recovery crouch, Frame 4 stabilizing return to combat readiness',
  atlas: 'FULL MOVESET ATLAS sequence: multi-state game animation sheet covering Idle Stance, Walk Stride, Jump Airborne Pose, and Signature Attack Strike in sequential order',
};

const LAYOUT_CONFIG: Record<
  SheetLayoutId,
  { cols: number; rows: number; totalFrames: number; promptDesc: string }
> = {
  '2x2': {
    cols: 2,
    rows: 2,
    totalFrames: 4,
    promptDesc:
      'strictly organized as a 2x2 grid sprite sheet (2 columns by 2 rows, 4 equal-sized cells total, reading top-left, top-right, bottom-left, bottom-right)',
  },
  '4x1': {
    cols: 4,
    rows: 1,
    totalFrames: 4,
    promptDesc:
      'strictly organized as a 4x1 horizontal strip sprite sheet (4 equal-sized columns in 1 single horizontal row, reading left to right from Frame 1 to Frame 4)',
  },
  '3x3': {
    cols: 3,
    rows: 3,
    totalFrames: 9,
    promptDesc:
      'strictly organized as a 3x3 grid sprite atlas (3 columns by 3 rows, 9 equal-sized cells total, reading row by row from top-left Frame 1 to bottom-right Frame 9)',
  },
};

const FACING_PROMPT_MAP: Record<FacingDirectionId, string> = {
  sideRight: 'side-scroller profile view facing RIGHT (→)',
  sideLeft: 'side-scroller profile view facing LEFT (←)',
  front: 'front-facing 2D view looking toward camera (↓)',
  isometric: '3/4 isometric 45-degree diagonal game view (↘)',
  topDown: 'top-down 2D RPG overhead perspective (⬆)',
};

const MOTION_STATES: { id: MotionStateId; icon: string }[] = [
  { id: 'idle', icon: '🧍' },
  { id: 'walk', icon: '🏃' },
  { id: 'attack', icon: '⚔️' },
  { id: 'jump', icon: '🦘' },
  { id: 'cast', icon: '🪄' },
  { id: 'hit', icon: '💥' },
  { id: 'atlas', icon: '🗂️' },
];

const SHEET_LAYOUTS: { id: SheetLayoutId; icon: string }[] = [
  { id: '2x2', icon: '⊞' },
  { id: '4x1', icon: '⋯' },
  { id: '3x3', icon: '⌗' },
];

const FACING_DIRECTIONS: { id: FacingDirectionId; icon: string }[] = [
  { id: 'sideRight', icon: '→' },
  { id: 'sideLeft', icon: '←' },
  { id: 'front', icon: '↓' },
  { id: 'isometric', icon: '↘' },
  { id: 'topDown', icon: '⬆' },
];

export default function AiSpriteGeneratorExperience({
  spritePresets,
}: AiSpriteGeneratorExperienceProps) {
  const t = useTranslations('aiSpriteGenerator');
  const { user, profile, refreshProfile } = useAuth();

  const [slots, setSlots] = useState<UploadSlot[]>(() =>
    Array.from({ length: MAX_IMAGES }, createEmptySlot)
  );
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const [selectedPreset, setSelectedPreset] = useState<SpritePresetAsset | null>(
    spritePresets[0] || null
  );
  const [motionState, setMotionState] = useState<MotionStateId>('walk');
  const [sheetLayout, setSheetLayout] = useState<SheetLayoutId>('2x2');
  const [facingDirection, setFacingDirection] = useState<FacingDirectionId>('sideRight');
  const [styleDescription, setStyleDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(1);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);

  // Right column preview mode & Live Sprite Animator state
  const [previewTab, setPreviewTab] = useState<'compare' | 'animator'>('compare');
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState<number>(8);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [chromaCutout, setChromaCutout] = useState<boolean>(true);
  const [idleBreathe, setIdleBreathe] = useState<boolean>(true);
  const [flipFacing, setFlipFacing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedSheetRef = useRef<HTMLImageElement | null>(null);
  const [sheetLoadedVersion, setSheetLoadedVersion] = useState(0);

  const creditsRequired = 5;

  const updateSlot = (index: number, partial: Partial<UploadSlot>) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...partial } : slot)));
  };

  const handleSelectedFile = (index: number, file?: File) => {
    if (!file) {
      updateSlot(index, createEmptySlot());
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateSlot(index, {
        file,
        fileName: file.name,
        preview: e.target?.result as string,
        url: null,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 1 && index === 0) {
      handleSelectedFile(0, files[0]);
      handleSelectedFile(1, files[1]);
    } else {
      handleSelectedFile(index, files?.[0]);
    }
    event.target.value = '';
  };

  const handleDrop = (index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setActiveDragIndex(null);
    const files = event.dataTransfer.files;
    if (files && files.length > 1 && index === 0) {
      handleSelectedFile(0, files[0]);
      handleSelectedFile(1, files[1]);
    } else {
      handleSelectedFile(index, files?.[0]);
    }
  };

  const handleDragOver = (index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setActiveDragIndex(index);
  };

  const handleDragLeave = (index: number) => (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setActiveDragIndex((current) => (current === index ? null : current));
    }
  };

  const handleClearSlot = (index: number) => () => {
    updateSlot(index, createEmptySlot());
  };

  const filledSlots = slots.filter((slot) => slot.file || slot.url);

  const buildPrompt = (imageCount: number) => {
    const styleName = selectedPreset?.name || '16-Bit Pixel Art';
    const styleSpec = STYLE_PROMPT_MAP[styleName] || STYLE_PROMPT_MAP['16-Bit Pixel Art'];
    const motionSpec = MOTION_PROMPT_MAP[motionState];
    const layoutSpec = LAYOUT_CONFIG[sheetLayout];
    const facingSpec = FACING_PROMPT_MAP[facingDirection];
    const userCustomText = styleDescription.trim();

    const multiImageDirective =
      imageCount >= 2
        ? 'Using the 2 uploaded reference images: Image 1 is the primary character identity, outfit, and color palette; Image 2 provides the target action keyframe, secondary pose, or style reference to blend into the animation sequence.'
        : 'Using the uploaded reference image as the primary character design, preserve the character identity, proportions, outfit, and signature colors.';

    const customDirective = userCustomText
      ? `Additional character & motion instructions: "${userCustomText}".`
      : '';

    return [
      `${multiImageDirective} Generate a professional 2D game character animation sprite sheet in ${styleName} style (${styleSpec}).`,
      `Layout & Grid: ${layoutSpec.promptDesc}, with ${layoutSpec.totalFrames} distinct sequential animation frames.`,
      `Animation State: ${motionSpec}.`,
      `Camera & Facing: ${facingSpec}.`,
      customDirective,
      'CRITICAL SPRITE SHEET RULES: Every frame must maintain identical character scale, consistent head-to-body ratio, consistent baseline ground line, and uniform cell spacing with zero cropped limbs, zero text labels, zero frame numbers, and a clean uniform solid neutral background for easy chroma-key transparency cutout.',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const handleGenerate = async () => {
    if (filledSlots.length < MIN_IMAGES) {
      setError(t('error.minImages', { required: MIN_IMAGES }));
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(t('error.credits', { required: creditsRequired }));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const uploadResults = await Promise.all(
        slots.map(async (slot, index) => {
          if (!slot.file && !slot.url) return null;
          if (slot.url) return { index, url: slot.url };

          const formData = new FormData();
          formData.append('file', slot.file as File);

          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.json().catch(() => ({}));
            throw new Error(uploadError.error || `Failed to upload image ${index + 1}`);
          }

          const { imageUrl: newImageUrl } = await uploadResponse.json();
          if (!newImageUrl) {
            throw new Error(`Failed to upload image ${index + 1}: missing URL`);
          }
          return { index, url: newImageUrl };
        })
      );

      uploadResults.forEach((result) => {
        if (result) {
          updateSlot(result.index, { url: result.url });
        }
      });

      const imageUrls = uploadResults
        .filter((result): result is { index: number; url: string } => Boolean(result))
        .map((result) => result.url);

      if (imageUrls.length < MIN_IMAGES) {
        setError(t('error.minImages', { required: MIN_IMAGES }));
        return;
      }

      const finalPrompt = buildPrompt(imageUrls.length);

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrls,
          metadata: {
            spriteStyle: selectedPreset?.name || '16-Bit Pixel Art',
            motionState,
            sheetLayout,
            facingDirection,
            referenceImageCount: imageUrls.length,
          },
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setShowLoginModal(true);
        } else if (response.status === 402) {
          setError(t('error.credits', { required: data.required }));
        } else if (response.status === 503) {
          setError(
            data.message || 'Service temporarily unavailable. Please try again in a moment.'
          );
        } else {
          setError(data.error || 'Failed to generate sprite sheet.');
        }
        return;
      }

      const taskId = data.taskId;
      if (!taskId) {
        setError('No task ID received. Please try again.');
        return;
      }

      const maxAttempts = 30;
      const pollInterval = 5000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(`/api/kie/task-status?taskId=${taskId}`, {
          cache: 'no-store',
        });
        if (!statusResponse.ok) {
          continue;
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          if (statusData.resultUrls && statusData.resultUrls.length > 0) {
            setGeneratedImage(statusData.resultUrls[0]);
            setDescription('AI game sprite sheet generated successfully');
            await refreshProfile();
            return;
          } else {
            setError('Sprite generation completed but no result URL found.');
            return;
          }
        }

        if (statusData.status === 'failed') {
          setError(statusData.error || 'Sprite generation failed. Please try again.');
          return;
        }
      }

      setError('Sprite generation is taking longer than expected. Please check back later.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          setError('Network error. Please check your connection and try again.');
        } else if (err.message.includes('timeout')) {
          setError('Request timed out. The server may be busy, please try again.');
        } else {
          setError(err.message || 'Failed to generate sprite sheet.');
        }
      } else {
        setError('Failed to generate sprite sheet.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSliderPosition = (clientX: number) => {
    const container = comparisonRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    updateSliderPosition(clientX);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    updateSliderPosition(clientX);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const previewSourceImage = filledSlots[0]?.preview || filledSlots[0]?.url || beforeImage;
  const beforeDisplayImage = previewSourceImage;
  const afterDisplayImage = generatedImage || afterImage;
  const beforeTag =
    filledSlots.length > 0 ? t('preview.labels.original') : t('preview.labels.before');
  const afterTag = generatedImage ? t('preview.labels.result') : t('preview.labels.after');

  const layoutMeta = LAYOUT_CONFIG[sheetLayout];
  const totalFrames = layoutMeta.totalFrames;

  // Reset currentFrame when sheetLayout changes
  useEffect(() => {
    setCurrentFrame(0);
  }, [sheetLayout]);

  // Load the active sprite sheet image for the HTML5 Canvas Slicer & Animator
  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      loadedSheetRef.current = img;
      setSheetLoadedVersion((v) => v + 1);
    };
    img.onerror = () => {
      if (cancelled) return;
      // Fallback without crossOrigin if bucket CORS header is missing
      const fallbackImg = new window.Image();
      fallbackImg.onload = () => {
        if (cancelled) return;
        loadedSheetRef.current = fallbackImg;
        setSheetLoadedVersion((v) => v + 1);
      };
      fallbackImg.src = afterDisplayImage;
    };
    img.src = afterDisplayImage;
    return () => {
      cancelled = true;
    };
  }, [afterDisplayImage]);

  // Cycle frames according to FPS when in animator tab and playing
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(60, Math.round(1000 / fps));
    const timer = window.setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, fps, totalFrames]);

  // Render the sliced frame onto the live preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const sheetImg = loadedSheetRef.current;
    if (!canvas || !sheetImg) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cols, rows } = layoutMeta;
    const safeFrame = currentFrame % (cols * rows);
    const col = safeFrame % cols;
    const row = Math.floor(safeFrame / cols);

    const cellW = Math.floor(sheetImg.naturalWidth / cols);
    const cellH = Math.floor(sheetImg.naturalHeight / rows);
    if (cellW <= 0 || cellH <= 0) return;

    // Offscreen slice canvas for pixel-accurate chroma cutout
    const offscreen = document.createElement('canvas');
    offscreen.width = cellW;
    offscreen.height = cellH;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.drawImage(sheetImg, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);

    if (chromaCutout) {
      try {
        const imgData = offCtx.getImageData(0, 0, cellW, cellH);
        const data = imgData.data;
        // Sample top-left & top-right corner pixels as background reference
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const threshold = 42;

        for (let i = 0; i < data.length; i += 4) {
          const dr = Math.abs(data[i] - bgR);
          const dg = Math.abs(data[i + 1] - bgG);
          const db = Math.abs(data[i + 2] - bgB);
          if (dr + dg + db < threshold * 2.2) {
            data[i + 3] = 0;
          }
        }
        offCtx.putImageData(imgData, 0, 0);
      } catch {
        // Ignore SecurityError if fallback non-CORS image was used
      }
    }

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    ctx.imageSmoothingEnabled = false;
    ctx.save();

    // Calculate squash-and-stretch idle breathe transform (inspired by kie-godot-sprite-motion)
    const phase = (safeFrame / Math.max(1, cols * rows)) * Math.PI * 2;
    const breatheScaleY = idleBreathe ? 1 + Math.sin(phase) * 0.035 : 1;
    const breatheScaleX = idleBreathe ? 1 - Math.sin(phase) * 0.02 : 1;
    const breatheBobY = idleBreathe ? Math.cos(phase) * 4 : 0;

    ctx.translate(cw / 2, ch / 2 + breatheBobY);
    ctx.scale((flipFacing ? -1 : 1) * breatheScaleX, breatheScaleY);

    const padding = 28;
    const scale = Math.min((cw - padding * 2) / cellW, (ch - padding * 2) / cellH);
    const drawW = cellW * scale;
    const drawH = cellH * scale;

    ctx.drawImage(offscreen, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [
    currentFrame,
    sheetLayout,
    layoutMeta,
    chromaCutout,
    idleBreathe,
    flipFacing,
    sheetLoadedVersion,
    previewTab,
  ]);

  const handleExportCurrentFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `sprite-${motionState}-frame-${currentFrame + 1}.png`;
      link.click();
    } catch {
      window.open(afterDisplayImage, '_blank');
    }
  };

  const handleExportManifest = () => {
    const manifest = {
      generator: 'Easy Nano Banana AI Sprite Generator (sprite-gen compatible)',
      style: selectedPreset?.name || '16-Bit Pixel Art',
      state: motionState,
      facing: facingDirection,
      frame_layout: sheetLayout,
      cols: layoutMeta.cols,
      rows: layoutMeta.rows,
      total_frames: layoutMeta.totalFrames,
      fps,
      loop: true,
      chroma_cutout: chromaCutout,
      created_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sprite-${motionState}-manifest.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const slotLabelKey = (index: number): string => {
    if (index === 0) return 'input.upload.slots.first';
    return 'input.upload.slots.second';
  };

  const slotIsRequired = (index: number) => index < MIN_IMAGES;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-[#FFFBEA] to-white text-slate-900 pb-16">
        <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            {/* Left column */}
            <div className="rounded-[32px] border border-[#FFE58F] bg-white/90 shadow-[0_40px_120px_rgba(247,201,72,0.25)] p-6 sm:p-10 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFD84D] text-lg shadow-lg">
                  👾
                </div>
                {t('hero.badge')}
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                  {t('hero.title')}
                </h1>
                <p className="text-base text-slate-600">{t('hero.subtitle')}</p>
              </div>

              <div className="space-y-5">
                {/* 2-Slot Multi-Image Upload */}
                <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-inner space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t('input.upload.label')}
                      </p>
                      <p className="text-xs text-slate-500">{t('input.upload.format')}</p>
                      <p className="mt-1 text-xs text-[#8C6A00]">
                        {t('input.upload.helper', { min: MIN_IMAGES, max: MAX_IMAGES })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {slots.map((slot, index) => {
                      const inputId = `sprite-generator-upload-${index}`;
                      const isActive = activeDragIndex === index;
                      const hasImage = Boolean(slot.preview || slot.url);
                      const previewSrc = slot.preview || slot.url;
                      const required = slotIsRequired(index);

                      return (
                        <div key={index} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                            <span>{t(slotLabelKey(index))}</span>
                            <span
                              className={`text-[10px] uppercase tracking-wide ${
                                required ? 'text-[#C69312]' : 'text-slate-400'
                              }`}
                            >
                              {required ? t('input.upload.required') : t('input.upload.optional')}
                            </span>
                          </div>

                          <div
                            onDrop={handleDrop(index)}
                            onDragOver={handleDragOver(index)}
                            onDragLeave={handleDragLeave(index)}
                            className={`group relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed bg-white transition ${
                              isActive
                                ? 'border-[#F0A202] bg-[#FFF4CC]'
                                : hasImage
                                  ? 'border-[#FFD84D]'
                                  : 'border-[#F5C04B]/70'
                            }`}
                          >
                            {hasImage && previewSrc ? (
                              <>
                                <Image
                                  src={previewSrc}
                                  alt={t(slotLabelKey(index))}
                                  fill
                                  sizes="(max-width: 640px) 50vw, 200px"
                                  className="object-contain p-1"
                                  unoptimized
                                />
                                <button
                                  type="button"
                                  onClick={handleClearSlot(index)}
                                  aria-label={t('input.upload.remove')}
                                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-slate-900/80 text-white text-xs font-bold shadow hover:bg-slate-900"
                                >
                                  ×
                                </button>
                                <label
                                  htmlFor={inputId}
                                  className="absolute inset-x-1.5 bottom-1.5 cursor-pointer rounded-full bg-white/90 px-2 py-1 text-center text-[11px] font-semibold text-slate-900 shadow hover:bg-white"
                                >
                                  {t('input.upload.replace')}
                                </label>
                              </>
                            ) : (
                              <label
                                htmlFor={inputId}
                                className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 px-2 text-center text-[11px] text-slate-500 hover:bg-[#FFF7DA]"
                              >
                                <span className="text-xl">{index === 0 ? '🧙' : '⚔️'}</span>
                                <span className="font-semibold text-slate-700">
                                  {t('input.upload.add')}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {t('input.upload.dropHint')}
                                </span>
                              </label>
                            )}

                            <input
                              type="file"
                              accept="image/*"
                              multiple={index === 0}
                              id={inputId}
                              className="hidden"
                              onChange={handleFileChange(index)}
                            />
                          </div>

                          {slot.fileName && (
                            <p
                              className="truncate text-[10px] text-slate-500"
                              title={slot.fileName}
                            >
                              {slot.fileName}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl bg-white/70 px-3 py-2 text-[11px] text-slate-600">
                    {t('input.upload.uploadedCount', {
                      uploaded: filledSlots.length,
                      max: MAX_IMAGES,
                    })}
                  </div>
                </div>

                {/* Action / Motion State Selector */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {t('input.motionState.label')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {MOTION_STATES.map(({ id, icon }) => {
                      const active = motionState === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setMotionState(id)}
                          className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition ${
                            active
                              ? 'border-[#F0A202] bg-[#FFF4CC] text-slate-900 shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                              : 'border-transparent bg-white text-slate-600 hover:bg-[#FFFBF0]'
                          }`}
                        >
                          <span>{icon}</span>
                          <span>{t(`input.motionState.states.${id}`)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sheet Grid Layout & Facing Direction */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">
                      {t('input.sheetLayout.label')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SHEET_LAYOUTS.map(({ id, icon }) => {
                        const active = sheetLayout === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSheetLayout(id)}
                            className={`flex items-center gap-1 rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold transition ${
                              active
                                ? 'border-[#F0A202] bg-[#FFF4CC] text-slate-900 shadow-sm'
                                : 'border-transparent bg-white text-slate-600 hover:bg-[#FFFBF0]'
                            }`}
                          >
                            <span className="font-mono text-sm">{icon}</span>
                            <span>{t(`input.sheetLayout.options.${id}`)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">
                      {t('input.facing.label')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {FACING_DIRECTIONS.map(({ id, icon }) => {
                        const active = facingDirection === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setFacingDirection(id)}
                            className={`flex items-center gap-1 rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold transition ${
                              active
                                ? 'border-[#F0A202] bg-[#FFF4CC] text-slate-900 shadow-sm'
                                : 'border-transparent bg-white text-slate-600 hover:bg-[#FFFBF0]'
                            }`}
                          >
                            <span className="font-mono">{icon}</span>
                            <span>{t(`input.facing.options.${id}`)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Custom Text / Action Prompt Input */}
                <div>
                  <label
                    htmlFor="sprite-style-description"
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    {t('input.styleDescription.label')}
                  </label>
                  <textarea
                    id="sprite-style-description"
                    value={styleDescription}
                    onChange={(e) => setStyleDescription(e.target.value)}
                    placeholder={t('input.styleDescription.placeholder')}
                    maxLength={300}
                    rows={3}
                    className="w-full rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-inner focus:border-[#F0A202] focus:outline-none focus:ring-1 focus:ring-[#F0A202] transition resize-none"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#8C6A00] mr-1">
                      {t('input.styleDescription.chipsLabel')}
                    </span>
                    {(['swordSlash', 'runCycle', 'spellBurst', 'bossIdle'] as const).map(
                      (chipKey) => {
                        const chipText = t(`input.styleDescription.chips.${chipKey}`);
                        return (
                          <button
                            key={chipKey}
                            type="button"
                            onClick={() => setStyleDescription(chipText)}
                            className="rounded-full border border-[#FFE7A1] bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#F0A202] hover:bg-[#FFF4CC] transition"
                          >
                            + {chipText}
                          </button>
                        );
                      }
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t('input.styleDescription.hint')}</p>
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {t('input.aspectRatio.label')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: '1:1', w: 'w-4', h: 'h-4' },
                      { value: '9:16', w: 'w-2.5', h: 'h-[18px]' },
                      { value: '16:9', w: 'w-[18px]', h: 'h-2.5' },
                      { value: '3:2', w: 'w-[18px]', h: 'h-3' },
                      { value: '2:3', w: 'w-3', h: 'h-[18px]' },
                    ].map(({ value, w, h }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAspectRatio(value)}
                        className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition ${
                          aspectRatio === value
                            ? 'border-[#F0A202] bg-[#FFF4CC] text-slate-900 shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                            : 'border-transparent bg-white text-slate-500 hover:bg-[#FFFBF0]'
                        }`}
                      >
                        <span className={`inline-block border border-current rounded-sm ${w} ${h}`} />
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sprite Art Style Preset Selector */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>{t('input.preset.label')}</span>
                    <span className="hidden sm:block text-xs text-[#C69312]">
                      {t('input.preset.swipe')}
                    </span>
                  </div>
                  {/* Mobile: 4-col grid */}
                  <div className="grid grid-cols-4 gap-2 sm:hidden">
                    {spritePresets.map((preset) => {
                      const isSelected = selectedPreset?.referenceSrc === preset.referenceSrc;
                      return (
                        <button
                          type="button"
                          key={preset.referenceSrc}
                          onClick={() => setSelectedPreset(isSelected ? null : preset)}
                          className={`flex flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
                            isSelected
                              ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                              : 'border-transparent bg-white text-slate-500'
                          }`}
                        >
                          <div
                            className={`relative h-14 w-full overflow-hidden rounded-xl border ${
                              isSelected ? 'border-[#F0A202]' : 'border-gray-100'
                            }`}
                          >
                            <Image
                              src={preset.displaySrc}
                              alt={preset.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <div
                            className={`mt-2 text-[10px] font-semibold text-center leading-tight line-clamp-2 ${
                              isSelected ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {preset.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Desktop: horizontal scroll */}
                  <div className="hidden sm:block overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                    <div className="inline-flex gap-3 pr-6">
                      {spritePresets.map((preset) => {
                        const isSelected = selectedPreset?.referenceSrc === preset.referenceSrc;
                        return (
                          <button
                            type="button"
                            key={preset.referenceSrc}
                            onClick={() => setSelectedPreset(isSelected ? null : preset)}
                            className={`flex w-[100px] flex-shrink-0 flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
                              isSelected
                                ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                : 'border-transparent bg-white text-slate-500'
                            }`}
                          >
                            <div
                              className={`relative h-20 w-full overflow-hidden rounded-xl border ${
                                isSelected ? 'border-[#F0A202]' : 'border-gray-100'
                              }`}
                            >
                              <Image
                                src={preset.displaySrc}
                                alt={preset.name}
                                fill
                                sizes="100px"
                                className="object-cover"
                              />
                            </div>
                            <div
                              className={`mt-2 text-[11px] font-semibold text-center leading-tight ${
                                isSelected ? 'text-slate-900' : 'text-slate-500'
                              }`}
                            >
                              {preset.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selection summary */}
                  <div className="mt-3 rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">
                      {t('input.preset.summary.title')}
                    </p>
                    <p>
                      {selectedPreset
                        ? t('input.preset.summary.selected', {
                            name: selectedPreset.name,
                            motion: t(`input.motionState.states.${motionState}`),
                            layout: t(`input.sheetLayout.options.${sheetLayout}`),
                          })
                        : t('input.preset.summary.none', {
                            motion: t(`input.motionState.states.${motionState}`),
                            layout: t(`input.sheetLayout.options.${sheetLayout}`),
                          })}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  onClick={handleGenerate}
                  loading={isGenerating}
                  className="w-full rounded-2xl bg-[#FFD84D] px-6 py-3 text-center text-base font-semibold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                >
                  {isGenerating ? t('input.button.generating') : t('input.button.generate')}
                </Button>
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  {t('input.button.credits', { count: creditsRequired })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">
                    {t('input.stats.presets.value')}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {t('input.stats.presets.label')}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">
                    {t('input.stats.time.value')}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {t('input.stats.time.label')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="relative space-y-5">
              <div className="rounded-[36px] border border-[#FFE7A1] bg-white shadow-[0_40px_140px_rgba(196,147,18,0.25)] p-4 space-y-4">
                {/* Preview Tab Switcher: Sheet Comparison vs Live Sprite-Gen Animator */}
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#FFFBF0] p-1.5 border border-[#FFE7A1]">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('compare')}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${
                      previewTab === 'compare'
                        ? 'bg-[#FFD84D] text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🖼️ {t('preview.tabs.compare')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('animator')}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${
                      previewTab === 'animator'
                        ? 'bg-[#FFD84D] text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎞️ {t('preview.tabs.animator')}
                  </button>
                </div>

                {previewTab === 'compare' ? (
                  <div
                    ref={comparisonRef}
                    className="relative w-full overflow-hidden rounded-[28px] bg-slate-900 select-none"
                    style={{ aspectRatio: aspectRatio.replace(':', '/') }}
                    onMouseDown={(event) => handleDragStart(event.clientX)}
                    onMouseMove={(event) => handleDragMove(event.clientX)}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
                    onTouchMove={(event) => handleDragMove(event.touches[0].clientX)}
                    onTouchEnd={handleDragEnd}
                    role="presentation"
                  >
                    <Image
                      src={afterDisplayImage}
                      alt="AI generated sprite sheet preview"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain"
                      priority
                    />
                    <div
                      className="absolute inset-0 left-0 overflow-hidden bg-slate-900"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={beforeDisplayImage}
                          alt="Original character reference"
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-contain"
                          priority
                          unoptimized={beforeDisplayImage.startsWith('data:')}
                        />
                      </div>
                    </div>

                    {isGenerating && (
                      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full border-4 border-[#FFE7A1]/30 border-t-[#FFD84D] animate-spin"></div>
                          <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#FFD84D]/20 blur-xl"></div>
                        </div>
                        <div className="mt-6 text-center space-y-2 px-4">
                          <p className="text-white font-semibold text-lg">
                            {t('preview.loading.title')}
                          </p>
                          <p className="text-[#FFE7A1] text-sm">{t('preview.loading.subtitle')}</p>
                        </div>
                      </div>
                    )}

                    <div
                      className="absolute inset-y-6 w-px bg-white"
                      style={{
                        left: `calc(${sliderPosition}% - 0.5px)`,
                        boxShadow: '0 0 25px rgba(255,255,255,0.8)',
                      }}
                    />
                    <div
                      className="absolute top-1/2 -mt-6 h-12 w-12 -translate-x-1/2 rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-2xl flex items-center justify-center cursor-[ew-resize]"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      ⇆
                    </div>
                    <span className="absolute left-6 top-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                      {beforeTag}
                    </span>
                    <span className="absolute right-6 top-6 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white">
                      {afterTag}
                    </span>

                    {generatedImage && (
                      <button
                        onClick={() => setShowPreviewModal(true)}
                        className="absolute bottom-6 right-6 flex items-center justify-center w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#FFE7A1] text-slate-700 hover:bg-[#FFD84D] hover:text-slate-900 hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-xl group"
                        aria-label={t('preview.viewFull')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                          />
                        </svg>
                        <span className="absolute -top-8 right-0 bg-slate-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {t('preview.viewFull')}
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Live sprite-gen Frame Slicer & Animation Player */
                  <div className="space-y-4">
                    <div
                      className="relative w-full overflow-hidden rounded-[28px] border border-[#FFE7A1] flex items-center justify-center"
                      style={{
                        aspectRatio: '1 / 1',
                        backgroundImage:
                          'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                        backgroundSize: '24px 24px',
                        backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
                        backgroundColor: '#0f172a',
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        width={512}
                        height={512}
                        className="h-full w-full object-contain"
                      />
                      <span className="absolute left-5 top-5 rounded-full bg-[#FFD84D] px-3 py-1 text-xs font-semibold text-slate-900 shadow">
                        {t('preview.animator.badge')}
                      </span>
                      <span className="absolute right-5 top-5 rounded-full bg-slate-900/85 border border-white/15 px-3 py-1 text-xs font-mono font-semibold text-white">
                        {t('preview.animator.frameCounter', {
                          current: (currentFrame % totalFrames) + 1,
                          total: totalFrames,
                        })}
                      </span>
                    </div>

                    {/* Animator Playback & Cutout Controls */}
                    <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsPlaying((p) => !p)}
                            className="rounded-xl bg-[#FFD84D] px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-[#ffe062]"
                          >
                            {isPlaying
                              ? `⏸ ${t('preview.animator.pause')}`
                              : `▶ ${t('preview.animator.play')}`}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPlaying(false);
                              setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames);
                            }}
                            className="rounded-xl border border-[#FFE7A1] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#FFF4CC]"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPlaying(false);
                              setCurrentFrame((prev) => (prev + 1) % totalFrames);
                            }}
                            className="rounded-xl border border-[#FFE7A1] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#FFF4CC]"
                          >
                            ▶
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">
                            {t('preview.animator.fpsLabel')}
                          </span>
                          {[4, 8, 12].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setFps(rate)}
                              className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                                fps === rate
                                  ? 'bg-slate-900 text-[#FFD84D]'
                                  : 'bg-white text-slate-600 border border-[#FFE7A1]'
                              }`}
                            >
                              {rate} FPS
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setChromaCutout((v) => !v)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            chromaCutout
                              ? 'border-[#F0A202] bg-[#FFF4CC] text-slate-900'
                              : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          ✂️ {t('preview.animator.chromaCutout')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIdleBreathe((v) => !v)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            idleBreathe
                              ? 'border-[#F0A202] bg-[#FFF4CC] text-slate-900'
                              : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          🫁 {t('preview.animator.idleBreathe')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlipFacing((v) => !v)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            flipFacing
                              ? 'border-[#F0A202] bg-[#FFF4CC] text-slate-900'
                              : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          ⇄ {t('preview.animator.flipFacing')}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleExportCurrentFrame}
                          className="flex-1 rounded-xl bg-white border border-[#FFE7A1] px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-[#FFF4CC] transition"
                        >
                          ⬇ {t('preview.animator.exportFrame')}
                        </button>
                        <button
                          type="button"
                          onClick={handleExportManifest}
                          className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-[#FFD84D] shadow-sm hover:bg-slate-800 transition"
                        >
                          📄 {t('preview.animator.exportManifest')}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">{t('preview.animator.hint')}</p>
                    </div>
                  </div>
                )}
              </div>

              {generatedImage && (
                <div className="rounded-[28px] border border-[#FFE7A1] bg-white/90 p-5 shadow-[0_20px_60px_rgba(247,201,72,0.2)]">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t('preview.saved.title')}
                      </p>
                      <p className="text-xs text-slate-500">{t('preview.saved.subtitle')}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <FreeOriginalDownloadButton
                        imageUrl={generatedImage}
                        filename={`ai-sprite-sheet-${motionState}.png`}
                        className="flex-1 justify-center bg-[#FFD84D] text-slate-900 hover:bg-[#ffe062]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-[#FFE7A1] text-slate-900 hover:bg-[#FFF3B2]"
                        onClick={() => setShowShareModal(true)}
                      >
                        {t('preview.saved.share')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('howTo.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">
              {t('howTo.title')}
            </h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="rounded-[28px] bg-white border border-[#FFE7A1] shadow-[0_30px_90px_rgba(255,216,77,0.35)] overflow-hidden flex flex-col hover:-translate-y-1 transition"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-[#FFD84D] text-slate-900 font-semibold flex items-center justify-center shadow-md mb-4">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">
                    {t(`howTo.steps.${step}.title`)}
                  </h3>
                  <p className="text-sm text-slate-600">{t(`howTo.steps.${step}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits & Use-Case Showcase */}
        <section className="bg-gradient-to-b from-[#FFF7DA] via-white to-[#FFF7DA] text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">
              {t('benefits.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">
              {t('benefits.title')}
            </h2>
            <p className="text-slate-600 max-w-3xl">{t('benefits.subtitle')}</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-slate-900 font-semibold inline-flex items-center gap-2 border border-[#FFE7A1] bg-white rounded-full px-5 py-3 shadow-[0_15px_40px_rgba(255,216,77,0.3)] hover:-translate-y-0.5 transition"
            >
              {t('benefits.cta')}
              <span>→</span>
            </button>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
            {[
              {
                key: 1,
                icon: '⚔️',
                before:
                  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/cases/case-1-before.png',
                after:
                  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/cases/case-1-after.png',
              },
              {
                key: 2,
                icon: '🐉',
                before:
                  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/cases/case-2-before.png',
                after:
                  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/cases/case-2-after.png',
              },
              {
                key: 3,
                icon: '🤖',
                before:
                  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/cases/case-3-before.png',
                after:
                  'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-sprite-generator/cases/case-3-after.png',
              },
            ].map((card, index) => (
              <div
                key={card.key}
                className="grid gap-6 rounded-[32px] bg-white border border-[#FFE7A1] shadow-[0_35px_120px_rgba(250,212,87,0.35)] p-6 md:p-10 items-center md:grid-cols-2"
              >
                {(index === 0 || index === 2) && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-[#FFF3B2]/40 aspect-[4/3] flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 p-3 w-full h-full">
                      <div className="relative rounded-xl overflow-hidden bg-slate-900">
                        <img
                          src={card.before}
                          alt="Character Reference"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          Before
                        </span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-slate-900">
                        <img
                          src={card.after}
                          alt="Generated Sprite Sheet"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          After
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center text-xl text-[#C69312]">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {t(`benefits.cards.${card.key}.title`)}
                  </h3>
                  <p className="text-slate-600 text-sm">{t(`benefits.cards.${card.key}.desc`)}</p>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 bg-[#FFD84D] text-slate-900 px-4 py-2 rounded-xl font-semibold shadow hover:-translate-y-0.5 transition"
                  >
                    {t(`benefits.cards.${card.key}.cta`)}
                    <span>→</span>
                  </button>
                </div>
                {index === 1 && (
                  <div className="relative rounded-[28px] overflow-hidden border border-[#FFE7A1] bg-[#FFF3B2]/40 aspect-[4/3] flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 p-3 w-full h-full">
                      <div className="relative rounded-xl overflow-hidden bg-slate-900">
                        <img
                          src={card.before}
                          alt="Character Reference"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          Before
                        </span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-slate-900">
                        <img
                          src={card.after}
                          alt="Generated Sprite Sheet"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          After
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white text-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('faq.badge')}</p>
            <h2 className="text-3xl font-semibold">{t('faq.title')}</h2>
            <p className="text-slate-600">{t('faq.subtitle')}</p>
          </div>
          <div className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-3xl border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-slate-900">
                      {t(`faq.items.${index}.question`)}
                    </span>
                    <span className="text-[#C69312] text-2xl">{isOpen ? '–' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-600">
                      {t(`faq.items.${index}.answer`)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      {generatedImage && (
        <>
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            imageUrl={generatedImage}
            description={description || 'AI Game Sprite Sheet generated with Easy Nano Banana'}
          />
          <ImagePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            imageUrl={generatedImage}
            title="AI Sprite Sheet Preview"
          />
        </>
      )}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
