# AI Tool Page Development Guide

> **Reference Implementation:** AI Hairstyle Changer (`/ai-image-effects/ai-hairstyle`)
> **Use this guide to build:** AI Anime Generator, and other similar AI transformation tools

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Page Component Pattern](#page-component-pattern)
4. [Experience Component Pattern](#experience-component-pattern)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [UI Components](#ui-components)
8. [Asset Management](#asset-management)
9. [SEO & Metadata](#seo--metadata)
10. [Best Practices Checklist](#best-practices-checklist)

---

## Architecture Overview

### Two-Layer Pattern

AI tool pages follow a **two-component architecture**:

1. **Page Component** (`page.tsx`) - Server-side
   - Handles SEO metadata
   - Loads preset assets from filesystem
   - Passes data to client component

2. **Experience Component** (`*Experience.tsx`) - Client-side
   - Marked with `'use client'`
   - Manages all interactive state
   - Handles API calls and user interactions

```
┌─────────────────────────────────────┐
│  page.tsx (Server Component)        │
│  • SEO metadata                     │
│  • Load presets from filesystem     │
│  • Static optimizations             │
└──────────────┬──────────────────────┘
               │ props
               ▼
┌─────────────────────────────────────┐
│  *Experience.tsx (Client Component) │
│  • User interactions                │
│  • State management                 │
│  • API calls                        │
│  • Real-time updates                │
└─────────────────────────────────────┘
```

---

## File Structure

### Required Files for a New AI Tool

```
src/
├── app/
│   └── ai-image-effects/
│       └── ai-anime-generator/          # ← New tool directory
│           └── page.tsx                  # Server component
├── components/
│   └── AiAnimeGeneratorExperience.tsx   # Client component
└── hooks/
    └── useImageDownload.ts               # Reusable download hook

public/
└── images/
    └── showcases/
        └── ai-anime-generator/           # Asset directory
            ├── feature/                  # Before/after, showcases
            │   ├── before.png
            │   ├── after.png
            │   ├── showcase-1.jpg
            │   ├── step1.mp4
            │   ├── step2.mp4
            │   └── step3.mp4
            └── preset/                   # Preset thumbnails
                ├── style/
                │   ├── shounen.png
                │   ├── shoujo.png
                │   └── ...
                └── effect/
                    ├── cel-shaded.png
                    └── ...
```

### CDN Assets (Optional)

For high-quality reference images used in AI generation:

```
https://pub-{YOUR_CDN_ID}.r2.dev/showcases/ai-anime-generator/preset/style/
https://pub-{YOUR_CDN_ID}.r2.dev/showcases/ai-anime-generator/preset/effect/
```

---

## Page Component Pattern

### Template: `src/app/ai-image-effects/ai-anime-generator/page.tsx`

```typescript
import fs from 'fs';
import path from 'path';
import AiAnimeGeneratorExperience, { PresetAsset } from '@/components/AiAnimeGeneratorExperience';

// ============================================
// 1. SEO METADATA (CRITICAL FOR DISCOVERABILITY)
// ============================================
export const metadata = {
  title: 'AI Anime Generator | Transform Photos to Anime Style Free',
  description: 'Upload a photo and convert it to anime art instantly. Try shounen, shoujo, and chibi styles with realistic AI-powered transformations.',
  keywords: [
    'ai anime generator',
    'photo to anime',
    'anime style converter',
    'anime art ai',
    'cartoon yourself anime',
  ],
  openGraph: {
    title: 'AI Anime Generator | Transform Photos to Anime Style Free',
    description: 'Upload a photo and convert it to anime art instantly...',
    url: 'https://www.easynanobanana.com/ai-image-effects/ai-anime-generator',
    siteName: 'EasyNanoBanana',
    images: [
      {
        url: 'https://www.easynanobanana.com/images/showcases/ai-anime-generator/feature/showcase-1.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Anime Generator - Transform photos to anime style',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Anime Generator | Transform Photos to Anime Style Free',
    description: 'Upload a photo and convert it to anime art instantly...',
    images: ['https://www.easynanobanana.com/images/showcases/ai-anime-generator/feature/showcase-1.jpg'],
  },
};

// ============================================
// 2. ASSET LOADING (SERVER-SIDE)
// ============================================
const presetBasePath = path.join(process.cwd(), 'public/images/showcases/ai-anime-generator/preset');
const styleCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-anime-generator/preset/style';
const effectCdnPrefix = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-anime-generator/preset/effect';

// Helper: Convert filename to display name
const formatName = (file: string) =>
  file
    .replace(/\.[^/.]+$/, '')      // Remove extension
    .replace(/[-_]/g, ' ')          // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ')           // Normalize spaces
    .trim();

// Load preset images from filesystem
function getPresetImages(subfolder: 'style' | 'effect'): PresetAsset[] {
  const dir = path.join(presetBasePath, subfolder);
  let entries: string[] = [];

  try {
    entries = fs.readdirSync(dir);
  } catch (error) {
    console.error(`Failed to read preset images from ${dir}`, error);
    return [];
  }

  return entries
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .map((file) => {
      const displaySrc = `/images/showcases/ai-anime-generator/preset/${subfolder}/${file}`;
      const referenceSrc =
        subfolder === 'style'
          ? `${styleCdnPrefix}/${file}`
          : `${effectCdnPrefix}/${file}`;
      return {
        displaySrc,   // Low-res thumbnail for UI
        referenceSrc, // High-res reference for AI generation
        fileName: file,
        name: formatName(file),
      };
    });
}

// ============================================
// 3. PAGE EXPORT
// ============================================
export default function AiAnimeGeneratorPage() {
  const stylePresets = getPresetImages('style');
  const effectPresets = getPresetImages('effect');

  return <AiAnimeGeneratorExperience
    stylePresets={stylePresets}
    effectPresets={effectPresets}
  />;
}
```

### Key Concepts

- **Server-side execution**: File system access, no client hooks
- **SEO-first**: Comprehensive metadata for search engines
- **Static optimization**: Presets loaded at build time
- **Dual asset strategy**:
  - `displaySrc`: Low-res thumbnails for UI (local `/public`)
  - `referenceSrc`: High-res images for AI processing (CDN)

---

## Experience Component Pattern

### Template: `src/components/AiAnimeGeneratorExperience.tsx`

```typescript
'use client';

import { ChangeEvent, useRef, useState } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import ImagePreviewModal from './ui/ImagePreviewModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// ============================================
// 1. TYPE DEFINITIONS
// ============================================
export interface PresetAsset {
  displaySrc: string;    // Thumbnail for UI
  referenceSrc: string;  // High-res for AI
  fileName: string;
  name: string;
}

interface AiAnimeGeneratorExperienceProps {
  stylePresets: PresetAsset[];
  effectPresets: PresetAsset[];
}

// ============================================
// 2. CONFIGURATION CONSTANTS
// ============================================
const promptSuggestions = [
  'Convert to shounen anime style with dramatic lighting',
  'Transform into cute chibi character',
  'Apply shoujo manga style with sparkles',
  'Create cyberpunk anime character',
];

const highlightStats = [
  { label: 'Anime styles', value: '12' },
  { label: 'Average render time', value: '15s' },
];

const beforeImage = '/images/showcases/ai-anime-generator/feature/before.png';
const afterImage = '/images/showcases/ai-anime-generator/feature/after.png';

// ============================================
// 3. MAIN COMPONENT
// ============================================
export default function AiAnimeGeneratorExperience({
  stylePresets,
  effectPresets
}: AiAnimeGeneratorExperienceProps) {

  // Auth context
  const { user, profile, refreshProfile } = useAuth();

  // ============================================
  // 4. STATE MANAGEMENT
  // ============================================

  // File upload
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Prompt & presets
  const [prompt, setPrompt] = useState(promptSuggestions[0]);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [selectedStyle, setSelectedStyle] = useState<PresetAsset | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<PresetAsset | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const comparisonRef = useRef<HTMLDivElement>(null);
  const creditsRequired = 5;

  // ============================================
  // 5. EVENT HANDLERS
  // ============================================

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadedFileName(null);
      setUploadedImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setUploadedFileName(file.name);
  };

  const handlePromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  // ============================================
  // 6. PROMPT BUILDING LOGIC
  // ============================================

  const buildPrompt = () => {
    if (activeTab === 'preset') {
      const styleText = selectedStyle
        ? `Convert the photo to ${selectedStyle.name} anime style`
        : 'Convert to anime style';
      const effectText = selectedEffect
        ? ` with ${selectedEffect.name} effect`
        : '';
      return `${styleText}${effectText}. Maintain the person's identity and facial features.`;
    }
    return `Transform to anime style: ${prompt}. Preserve the person's likeness and features.`;
  };

  // ============================================
  // 7. API INTEGRATION
  // ============================================

  const handleGenerate = async () => {
    // Validation
    if (!uploadedImage) {
      setError('Please upload a photo to transform.');
      return;
    }

    if (!user) {
      setError('Please sign in to generate anime art.');
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(`Insufficient credits. You need ${creditsRequired} credits.`);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const presetDetails =
        activeTab === 'preset'
          ? {
              style: selectedStyle ? selectedStyle.name : 'default anime',
              effect: selectedEffect ? selectedEffect.name : 'none',
            }
          : null;

      const promptText = buildPrompt();
      const detailHint =
        activeTab === 'preset'
          ? `The anime style should match "${presetDetails?.style}" with "${presetDetails?.effect}" effects.`
          : '';
      const finalPrompt = `${promptText} ${detailHint} Create high-quality anime art with consistent facial features, expressive eyes, and clean linework. Powered by Nano Banana.`;

      const imageUrls = [uploadedImage];

      console.log('Sending request to generate image...');
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: 'gemini-2.0-flash',
          imageUrls,
          metadata: presetDetails || undefined,
        }),
      });

      console.log('Response received, status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      // Error handling
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to generate anime art.');
        } else if (response.status === 402) {
          setError(`Insufficient credits. You need ${data.required} credits but only have ${data.available}.`);
        } else if (response.status === 503) {
          setError(data.message || 'Service temporarily unavailable. Please try again in a moment.');
        } else {
          setError(data.error || 'Failed to generate anime art.');
        }
        return;
      }

      if (!data.imageUrl) {
        console.error('No imageUrl in response:', data);
        setError('Image generation completed but no image URL received. Please try again.');
        return;
      }

      console.log('Setting generated image:', data.imageUrl);
      setGeneratedImage(data.imageUrl);
      setDescription(data.description);
      setSliderPosition(50);
      await refreshProfile();
    } catch (err: any) {
      console.error('Error generating anime art:', err);

      // Specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. The server may be busy, please try again.');
      } else {
        setError('Failed to generate anime art. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================
  // 8. COMPARISON SLIDER HANDLERS
  // ============================================

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

  // Display images
  const beforeDisplayImage = uploadedImage || beforeImage;
  const afterDisplayImage = generatedImage || afterImage;
  const beforeTag = uploadedImage ? 'Original' : 'Before';
  const afterTag = generatedImage ? 'Result' : 'After';

  // ============================================
  // 9. JSX RENDER (Use AI Hairstyle as template)
  // ============================================

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-[#FFFBEA] to-white text-slate-900 pb-16">
        {/* Hero Section with Upload & Controls */}
        <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            {/* Left: Controls */}
            <div className="rounded-[32px] border border-[#FFE58F] bg-white/90 shadow-xl p-6 sm:p-10 space-y-6">
              {/* Title, upload, tabs, presets, generate button */}
              {/* See AI Hairstyle component for full structure */}
            </div>

            {/* Right: Before/After Comparison */}
            <div className="relative">
              <div className="rounded-[36px] border border-[#FFE7A1] bg-white shadow-xl p-4">
                <div
                  ref={comparisonRef}
                  className="relative aspect-square w-full overflow-hidden rounded-[28px] bg-gray-200 select-none"
                  onMouseDown={(event) => handleDragStart(event.clientX)}
                  onMouseMove={(event) => handleDragMove(event.clientX)}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
                  onTouchMove={(event) => handleDragMove(event.touches[0].clientX)}
                  onTouchEnd={handleDragEnd}
                >
                  {/* Comparison slider implementation */}
                  {/* See AI Hairstyle for full code */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900 mt-20">
          {/* 3-step guide with videos */}
        </section>

        {/* Features Section */}
        <section className="bg-gradient-to-b from-[#FFF7DA] via-white to-[#FFF7DA] text-slate-900">
          {/* Feature cards with images/videos */}
        </section>

        {/* FAQ Section */}
        <section className="bg-white text-slate-900">
          {/* Accordion FAQ */}
        </section>
      </main>

      {/* Modals */}
      {generatedImage && (
        <>
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            imageUrl={generatedImage}
            description={description || 'AI Anime art by Nano Banana'}
          />
          <ImagePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            imageUrl={generatedImage}
            title="AI Anime Preview"
          />
        </>
      )}
    </>
  );
}
```

---

## State Management

### State Categories

#### 1. **File Upload State**
```typescript
const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
```

#### 2. **Input State**
```typescript
const [prompt, setPrompt] = useState(promptSuggestions[0]);
const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
const [selectedStyle, setSelectedStyle] = useState<PresetAsset | null>(null);
const [selectedEffect, setSelectedEffect] = useState<PresetAsset | null>(null);
```

#### 3. **Generation State**
```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [generatedImage, setGeneratedImage] = useState<string | null>(null);
const [description, setDescription] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
```

#### 4. **UI State**
```typescript
const [sliderPosition, setSliderPosition] = useState(50);
const [isDragging, setIsDragging] = useState(false);
const [showShareModal, setShowShareModal] = useState(false);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [openFaq, setOpenFaq] = useState<number | null>(0);
```

### State Flow Diagram

```
User Action → State Update → UI Re-render

Upload File
  ↓
  setUploadedImage() + setUploadedFileName()
  ↓
  Image preview updates

Select Preset
  ↓
  setSelectedStyle() / setSelectedEffect()
  ↓
  Preset summary updates

Generate
  ↓
  setIsGenerating(true)
  ↓
  API call
  ↓
  setGeneratedImage() + setDescription()
  ↓
  setIsGenerating(false)
  ↓
  Comparison slider + download buttons appear
```

---

## API Integration

### Endpoint: `/api/generate-image`

#### Request Format

```typescript
POST /api/generate-image
Headers:
  Content-Type: application/json
  Authorization: Bearer {session_token}

Body:
{
  "prompt": "Final combined prompt with style instructions",
  "model": "gemini-2.0-flash",
  "imageUrls": ["data:image/jpeg;base64,..."],
  "metadata": {
    "style": "shounen",
    "effect": "cel-shaded"
  }
}
```

#### Response Format

**Success (200)**
```json
{
  "imageUrl": "https://cdn.example.com/generated/image-id.png",
  "description": "AI-generated anime character in shounen style"
}
```

**Error (401/402/503)**
```json
{
  "error": "Error message",
  "required": 5,
  "available": 2
}
```

### Error Handling Pattern

```typescript
if (!response.ok) {
  if (response.status === 401) {
    setError('Please sign in to generate images.');
  } else if (response.status === 402) {
    setError(`Insufficient credits. You need ${data.required} credits but only have ${data.available}.`);
  } else if (response.status === 503) {
    setError(data.message || 'Service temporarily unavailable. Please try again.');
  } else {
    setError(data.error || 'Failed to generate image.');
  }
  return;
}
```

### Validation Checks

Always validate before making API calls:

```typescript
// 1. Check image upload
if (!uploadedImage) {
  setError('Please upload a photo.');
  return;
}

// 2. Check authentication
if (!user) {
  setError('Please sign in.');
  return;
}

// 3. Check credits
if (!profile || (profile.credits || 0) < creditsRequired) {
  setError(`Insufficient credits. You need ${creditsRequired} credits.`);
  return;
}
```

---

## UI Components

### Required Reusable Components

#### 1. **Header** (`components/common/Header.tsx`)
- Navigation
- User profile
- Credit display

#### 2. **Button** (`components/ui/Button.tsx`)
```typescript
interface ButtonProps {
  type?: 'button' | 'submit';
  onClick?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  className?: string;
  children: ReactNode;
  disabled?: boolean;
}
```

#### 3. **FreeOriginalDownloadButton** (`components/ui/FreeOriginalDownloadButton.tsx`)
```typescript
interface FreeOriginalDownloadButtonProps {
  imageUrl?: string;
  filename?: string;
  disabled?: boolean;
  className?: string;
  cooldownMs?: number;
  onSuccess?: (type: DownloadType) => void;
  onError?: (error: string, type: DownloadType) => void;
}
```

#### 4. **ShareModal** (`components/ui/ShareModal.tsx`)
- Social sharing
- Copy link
- Share to platforms

#### 5. **ImagePreviewModal** (`components/ui/ImagePreviewModal.tsx`)
- Full-screen image view
- Zoom controls
- Download option

### Comparison Slider Pattern

```typescript
// Refs
const comparisonRef = useRef<HTMLDivElement>(null);

// State
const [sliderPosition, setSliderPosition] = useState(50);
const [isDragging, setIsDragging] = useState(false);

// Handlers
const updateSliderPosition = (clientX: number) => {
  const container = comparisonRef.current;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const relativeX = clientX - rect.left;
  const percentage = (relativeX / rect.width) * 100;
  setSliderPosition(Math.min(100, Math.max(0, percentage)));
};

// JSX
<div
  ref={comparisonRef}
  onMouseDown={(e) => handleDragStart(e.clientX)}
  onMouseMove={(e) => handleDragMove(e.clientX)}
  onMouseUp={handleDragEnd}
  onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
  onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
  onTouchEnd={handleDragEnd}
>
  {/* After image (full) */}
  <Image src={afterImage} alt="After" fill />

  {/* Before image (clipped) */}
  <div style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
    <Image src={beforeImage} alt="Before" fill />
  </div>

  {/* Slider handle */}
  <div style={{ left: `${sliderPosition}%` }}>⇆</div>
</div>
```

---

## Asset Management

### Directory Structure

```
public/images/showcases/ai-anime-generator/
├── feature/                    # Feature images and videos
│   ├── before.png             # Default before image
│   ├── after.png              # Default after image
│   ├── showcase-1.jpg         # OG image (1200x630)
│   ├── step1.mp4              # How-it-works video 1
│   ├── step2.mp4              # How-it-works video 2
│   └── step3.mp4              # How-it-works video 3
└── preset/                    # Preset thumbnails
    ├── style/                 # Style presets
    │   ├── shounen.png
    │   ├── shoujo.png
    │   └── chibi.png
    └── effect/                # Effect presets
        ├── cel-shaded.png
        └── watercolor.png
```

### Image Specifications

#### Feature Images
- **Before/After**: 1024x1024px, PNG or JPEG
- **OG Image**: 1200x630px, high-quality JPEG
- **Showcase Images**: 800x600px minimum

#### Videos
- **Format**: MP4 (H.264)
- **Duration**: 5-10 seconds
- **Loop**: Yes
- **Autoplay**: Yes
- **Muted**: Yes
- **Resolution**: 720p minimum

#### Preset Thumbnails
- **Size**: 200x200px (displayed at 90px)
- **Format**: WebP or PNG
- **Optimization**: Compressed for fast loading

### CDN Strategy

**Local Assets** (`/public/images/...`)
- Thumbnails for UI
- Low-res preview images
- Cached by Next.js

**CDN Assets** (R2/CloudFlare)
- High-resolution reference images
- Large video files
- Direct links for AI processing

```typescript
const preset = {
  displaySrc: '/images/showcases/ai-anime/preset/style/shounen.png',  // Local
  referenceSrc: 'https://cdn.example.com/.../shounen-hd.png',         // CDN
};
```

---

## SEO & Metadata

### Complete Metadata Template

```typescript
export const metadata = {
  // Basic SEO
  title: 'AI Anime Generator | Transform Photos to Anime Style Free',
  description: 'Upload a photo and convert it to anime art instantly. Try shounen, shoujo, and chibi styles with realistic AI-powered transformations.',

  // Keywords (important for search)
  keywords: [
    'ai anime generator',
    'photo to anime',
    'anime style converter',
    'anime art ai',
    'cartoon yourself anime',
  ],

  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    title: 'AI Anime Generator | Transform Photos to Anime Style Free',
    description: 'Upload a photo and convert it to anime art instantly...',
    url: 'https://www.easynanobanana.com/ai-image-effects/ai-anime-generator',
    siteName: 'EasyNanoBanana',
    images: [
      {
        url: 'https://www.easynanobanana.com/images/showcases/ai-anime-generator/feature/showcase-1.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Anime Generator - Transform photos to anime style',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'AI Anime Generator | Transform Photos to Anime Style Free',
    description: 'Upload a photo and convert it to anime art instantly...',
    images: ['https://www.easynanobanana.com/images/showcases/ai-anime-generator/feature/showcase-1.jpg'],
  },
};
```

### SEO Best Practices

1. **Title Format**: `[Tool Name] | [Value Proposition] | [CTA]`
   - Good: "AI Anime Generator | Transform Photos to Anime Style Free"
   - Bad: "Anime Generator"

2. **Description Length**: 150-160 characters
   - Include: What it does, key features, call to action

3. **Keywords**: 5-10 relevant terms
   - Focus on search intent
   - Mix broad and specific terms

4. **OG Image**: 1200x630px
   - Show before/after example
   - Include branding
   - High contrast text

5. **URL Structure**: `/ai-image-effects/[tool-name]`
   - Kebab-case
   - Descriptive
   - Category prefix

---

## Best Practices Checklist

### Development Phase

- [ ] Create directory: `src/app/ai-image-effects/[tool-name]/`
- [ ] Create page component: `page.tsx` (server-side)
- [ ] Create experience component: `[Tool]Experience.tsx` (client-side)
- [ ] Define `PresetAsset` interface
- [ ] Set up asset directories in `/public/images/showcases/[tool-name]/`
- [ ] Configure CDN links for high-res assets

### Component Structure

- [ ] Import all required UI components
- [ ] Set up authentication with `useAuth()`
- [ ] Define all state variables (upload, generation, UI, error)
- [ ] Implement file upload handler
- [ ] Create prompt building logic
- [ ] Implement preset selection (if applicable)
- [ ] Add validation checks before generation

### API Integration

- [ ] Configure API endpoint (`/api/generate-image`)
- [ ] Add authentication headers
- [ ] Handle all HTTP status codes (200, 401, 402, 503)
- [ ] Implement error messages for each failure case
- [ ] Refresh user profile after successful generation
- [ ] Log requests and responses for debugging

### UI/UX

- [ ] Implement before/after comparison slider
- [ ] Add drag and touch support for slider
- [ ] Show loading overlay during generation
- [ ] Display error messages clearly
- [ ] Add download button after generation
- [ ] Implement share modal
- [ ] Add image preview modal with magnifying glass icon
- [ ] Create FAQ accordion section

### Assets

- [ ] Add default before/after images
- [ ] Create preset thumbnails (200x200px)
- [ ] Generate OG image (1200x630px)
- [ ] Record/add step-by-step videos (MP4, loop, autoplay, muted)
- [ ] Optimize all images (WebP where possible)
- [ ] Upload high-res references to CDN

### SEO & Metadata

- [ ] Write compelling title (60 characters max)
- [ ] Write description (150-160 characters)
- [ ] Add 5-10 relevant keywords
- [ ] Configure Open Graph metadata
- [ ] Configure Twitter Card metadata
- [ ] Set canonical URL
- [ ] Add alt text to all images

### Testing

- [ ] Test file upload (various formats)
- [ ] Test preset selection
- [ ] Test custom prompt generation
- [ ] Test comparison slider (mouse & touch)
- [ ] Test error scenarios (no auth, no credits, API failure)
- [ ] Test download functionality
- [ ] Test share modal
- [ ] Test on mobile devices
- [ ] Check loading states
- [ ] Verify credit deduction

### Performance

- [ ] Optimize image sizes
- [ ] Use `next/image` for all images
- [ ] Lazy load videos with `loading="lazy"`
- [ ] Add `priority` to above-the-fold images
- [ ] Minimize state updates during slider drag
- [ ] Use `useCallback` for event handlers if needed

### Accessibility

- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Add focus states to buttons
- [ ] Use semantic HTML elements
- [ ] Provide alt text for all images
- [ ] Test with screen readers

---

## Quick Reference: AI Hairstyle vs AI Anime

### Structural Similarities

| Aspect | AI Hairstyle | AI Anime | Notes |
|--------|--------------|----------|-------|
| File structure | ✅ Same | ✅ Same | Two-component pattern |
| State management | ✅ Same | ✅ Same | Upload, generation, UI states |
| API endpoint | ✅ Same | ✅ Same | `/api/generate-image` |
| Comparison slider | ✅ Same | ✅ Same | Drag-based before/after |
| Download system | ✅ Same | ✅ Same | Uses `useImageDownload` hook |
| Modal system | ✅ Same | ✅ Same | Share + Preview modals |

### Key Differences

| Aspect | AI Hairstyle | AI Anime |
|--------|--------------|----------|
| Preset categories | Style + Color | Style + Effect |
| Prompt focus | Haircut descriptions | Anime art styles |
| Default images | Hair transformations | Photo-to-anime examples |
| Icon/emoji | ✂️ (scissors) | 🎨 (art palette) |
| Color scheme | Yellow/amber | Yellow/amber (keep consistent) |

---

## Common Pitfalls to Avoid

### 1. **Mixing Server and Client Code**
❌ **Wrong:**
```typescript
// page.tsx
'use client';
import fs from 'fs'; // Error: fs doesn't work in client components
```

✅ **Correct:**
```typescript
// page.tsx (no 'use client')
import fs from 'fs'; // Works in server components
```

### 2. **Not Handling All Error Cases**
❌ **Wrong:**
```typescript
const response = await fetch('/api/generate-image', ...);
const data = await response.json();
setGeneratedImage(data.imageUrl); // Crashes if error
```

✅ **Correct:**
```typescript
const response = await fetch('/api/generate-image', ...);
if (!response.ok) {
  // Handle specific status codes
  if (response.status === 401) { ... }
  else if (response.status === 402) { ... }
  return;
}
const data = await response.json();
if (!data.imageUrl) {
  setError('No image URL received');
  return;
}
setGeneratedImage(data.imageUrl);
```

### 3. **Forgetting to Refresh Profile After Generation**
❌ **Wrong:**
```typescript
setGeneratedImage(data.imageUrl);
// User's credit count is now stale!
```

✅ **Correct:**
```typescript
setGeneratedImage(data.imageUrl);
await refreshProfile(); // Updates credit balance
```

### 4. **Not Validating Before API Calls**
❌ **Wrong:**
```typescript
const handleGenerate = async () => {
  await fetch('/api/generate-image', ...); // May fail silently
};
```

✅ **Correct:**
```typescript
const handleGenerate = async () => {
  if (!uploadedImage) {
    setError('Please upload an image.');
    return;
  }
  if (!user) {
    setError('Please sign in.');
    return;
  }
  // Then make API call
};
```

### 5. **Hardcoding Asset Paths**
❌ **Wrong:**
```typescript
const presetBasePath = '/Users/john/project/public/images/...';
```

✅ **Correct:**
```typescript
const presetBasePath = path.join(process.cwd(), 'public/images/showcases/...');
```

### 6. **Missing Slider Touch Support**
❌ **Wrong:**
```typescript
<div onMouseDown={...} onMouseMove={...} onMouseUp={...}>
```

✅ **Correct:**
```typescript
<div
  onMouseDown={...} onMouseMove={...} onMouseUp={...}
  onTouchStart={...} onTouchMove={...} onTouchEnd={...}
>
```

### 7. **Not Using Next.js Image Optimization**
❌ **Wrong:**
```html
<img src="/images/preset.png" alt="Preset" />
```

✅ **Correct:**
```typescript
<Image src="/images/preset.png" alt="Preset" width={200} height={200} />
```

### 8. **Forgetting Loading States**
❌ **Wrong:**
```typescript
<button onClick={handleGenerate}>Generate</button>
```

✅ **Correct:**
```typescript
<Button loading={isGenerating} onClick={handleGenerate}>
  {isGenerating ? 'Generating...' : 'Generate'}
</Button>
```

---

## Development Workflow

### Step-by-Step Implementation

1. **Create directories**
   ```bash
   mkdir -p src/app/ai-image-effects/ai-anime-generator
   mkdir -p public/images/showcases/ai-anime-generator/feature
   mkdir -p public/images/showcases/ai-anime-generator/preset/style
   mkdir -p public/images/showcases/ai-anime-generator/preset/effect
   ```

2. **Copy template files**
   ```bash
   # Use AI Hairstyle as reference
   cp src/app/ai-image-effects/ai-hairstyle/page.tsx \
      src/app/ai-image-effects/ai-anime-generator/page.tsx

   cp src/components/AiHairstyleExperience.tsx \
      src/components/AiAnimeGeneratorExperience.tsx
   ```

3. **Update metadata**
   - Change title, description, keywords
   - Update OG image URLs
   - Adjust canonical URL

4. **Add assets**
   - Create before/after images
   - Generate preset thumbnails
   - Record step videos
   - Create OG image

5. **Customize prompt logic**
   - Adjust `promptSuggestions`
   - Update `buildPrompt()` function
   - Modify preset categories

6. **Update styling**
   - Change icon/emoji
   - Keep banana-yellow theme
   - Adjust copy text

7. **Test thoroughly**
   - Upload various images
   - Test all presets
   - Verify error handling
   - Check mobile responsiveness

8. **Deploy**
   - Build locally: `npm run build`
   - Fix any build errors
   - Deploy to production
   - Test live version

---

## Conclusion

This guide provides a complete blueprint for building AI tool pages on the EasyNanoBanana platform. By following these patterns and best practices, you ensure:

- **Consistency**: All AI tools follow the same architecture
- **Maintainability**: Clear separation between server and client code
- **Scalability**: Easy to add new tools without reinventing the wheel
- **Performance**: Optimized assets and Next.js features
- **User Experience**: Smooth interactions and clear feedback
- **SEO**: Discoverable and shareable pages

**Next Steps:**
1. Review the AI Hairstyle implementation in detail
2. Create your asset directory structure
3. Follow the development workflow
4. Use the checklist to ensure completeness
5. Test extensively before deployment

**Questions?** Refer back to the AI Hairstyle component as the reference implementation.
