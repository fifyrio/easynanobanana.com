# AI Infographic Generator - Implementation Plan

## 📋 Overview
This document outlines the implementation plan for the "Create an Infographic with AI" feature, reusing the existing image generation infrastructure.

---

## 🏗️ Current Architecture Analysis

### Existing Image Generation Flow
1. **Frontend** → User inputs prompt + optional images
2. **API Route** (`/api/generate-image`) → Validates auth, checks credits, rate limits
3. **OpenRouter API** → Calls `google/gemini-2.5-flash-image-preview` model
4. **R2 Storage** → Uploads generated image
5. **Database** → Records image metadata, deducts credits
6. **Response** → Returns image URL to frontend

### Key Components Already Available
- ✅ **Authentication**: Supabase auth with JWT tokens
- ✅ **Credit System**: Credit checking, deduction, transaction recording
- ✅ **Rate Limiting**: `imageLimiter` with configurable limits
- ✅ **Image Upload**: `uploadImageToR2()` function
- ✅ **Retry Logic**: `withRetry()` with exponential backoff
- ✅ **Database Tables**: `images`, `credit_transactions`, `user_profiles`

---

## 🎯 Implementation Strategy

### Option 1: Reuse `/api/generate-image` (Recommended)
**Pros:**
- ✅ No duplicate code
- ✅ Same credit system
- ✅ Same rate limiting
- ✅ Less maintenance

**Cons:**
- ⚠️ Prompt engineering happens on frontend
- ⚠️ Need to optimize prompts for infographics

### Option 2: Create New `/api/generate-infographic`
**Pros:**
- ✅ Specialized prompt engineering
- ✅ Infographic-specific parameters
- ✅ Different credit cost if needed
- ✅ Separate rate limits

**Cons:**
- ❌ Code duplication
- ❌ More maintenance
- ❌ Need to replicate auth/credit logic

### **Recommendation: Use Option 1 with Enhanced Prompts**

---

## 📝 Detailed Implementation Plan

### Phase 1: Frontend Integration (2-3 hours)

#### 1.1 Create Hook: `useInfographicGeneration`
**Location:** `src/hooks/useInfographicGeneration.ts`

```typescript
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface InfographicParams {
  textInput?: string
  uploadedFile?: File
  style?: 'business' | 'colorful' | 'minimal' | 'timeline' | 'comparison'
}

export function useInfographicGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const { user, profile, refreshProfile } = useAuth()

  const generateInfographic = async (params: InfographicParams) => {
    if (!user) {
      toast.error('Please sign in to generate infographics')
      return
    }

    if (profile && profile.credits < 5) {
      toast.error('Insufficient credits')
      return
    }

    setIsGenerating(true)

    try {
      // Build enhanced prompt for infographics
      const enhancedPrompt = buildInfographicPrompt(params)

      // Handle file upload if provided
      let imageUrls: string[] = []
      if (params.uploadedFile) {
        const uploadedUrl = await uploadToTemporary(params.uploadedFile)
        imageUrls = [uploadedUrl]
      }

      // Call existing generate-image API
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Generation failed')
      }

      const data = await response.json()
      setGeneratedUrl(data.imageUrl)

      // Refresh user credits
      await refreshProfile()

      toast.success('Infographic generated successfully!')
      return data.imageUrl

    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Failed to generate infographic')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateInfographic,
    isGenerating,
    generatedUrl,
    setGeneratedUrl
  }
}

// Helper: Build optimized prompt for infographics
function buildInfographicPrompt(params: InfographicParams): string {
  const basePrompt = `Create a professional infographic design.`

  const stylePrompts = {
    business: 'Use a clean, corporate style with blue and white colors. Include charts, graphs, and key metrics.',
    colorful: 'Use vibrant, eye-catching colors (orange, purple, blue, green). Modern and engaging design.',
    minimal: 'Minimalist design with plenty of white space, 2-3 colors maximum, focus on clarity.',
    timeline: 'Timeline or process flow layout with connected steps, icons for each milestone.',
    comparison: 'Side-by-side comparison layout with clear visual separation between categories.'
  }

  const styleGuide = params.style ? stylePrompts[params.style] : stylePrompts.business

  const userContent = params.textInput || 'General business infographic with data visualization'

  return `${basePrompt}

${styleGuide}

Content to visualize:
${userContent}

Requirements:
- High resolution, print quality
- Clear visual hierarchy
- Professional typography
- Well-organized layout
- Include relevant icons and graphics
- Ensure text is readable
- Use proper spacing and alignment`
}
```

#### 1.2 Update HeroSection Component
**Location:** `src/components/infographic/HeroSection.tsx`

Add:
- File input handler
- Style selector (optional)
- Generate button click handler
- Loading state
- Result display

#### 1.3 Create Results Display Component
**Location:** `src/components/infographic/InfographicResult.tsx`

Features:
- Display generated infographic
- Download button (reuse existing download logic)
- Regenerate button
- Share to social media
- Save to history

---

### Phase 2: Prompt Engineering (1-2 hours)

#### 2.1 Infographic-Specific Prompt Templates
Create templates for different infographic types:

**Business Data:**
```
Create a professional business infographic showing {data}.
Include bar charts, pie charts, and key metrics displayed prominently.
Use corporate blue and white color scheme.
Ensure all numbers are clearly visible and properly labeled.
Add section headers and icons for visual hierarchy.
```

**Timeline:**
```
Design a timeline infographic displaying {events/process}.
Use connected circles or hexagons for each milestone.
Include year/date labels and brief descriptions.
Use a flowing layout from left to right or top to bottom.
Color code different phases or periods.
```

**Comparison:**
```
Create a comparison infographic contrasting {items}.
Use side-by-side layout with clear visual separation.
Include icons, percentage bars, and key differentiators.
Make it easy to scan and compare at a glance.
Use distinct colors for each category.
```

#### 2.2 Prompt Enhancement Strategy
1. Always specify "infographic" explicitly
2. Include layout requirements (portrait/landscape)
3. Specify text readability requirements
4. Request proper spacing and margins
5. Ask for professional design standards

---

### Phase 3: API Enhancement (Optional, 1 hour)

If we want specialized infographic handling, create:

**Location:** `src/app/api/generate-infographic/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
// ... import existing helpers

export async function POST(request: NextRequest) {
  // Reuse all validation logic from generate-image
  // ... auth, credits, rate limiting ...

  const { textInput, fileUrl, style, dimensions } = await request.json()

  // Build infographic-specific prompt
  const prompt = buildInfographicPrompt({ textInput, style })

  // Set infographic-specific parameters
  const infographicParams = {
    prompt,
    imageUrls: fileUrl ? [fileUrl] : undefined,
    // Infographic-specific settings
    dimensions: dimensions || '1024x1024',
    quality: 'high'
  }

  // Call OpenRouter API with infographic optimizations
  const response = await generateImage(infographicParams)

  // Save with infographic-specific metadata
  await saveInfographicRecord({
    user_id: user.id,
    prompt: textInput,
    style,
    image_url: response.url,
    image_type: 'infographic' // New type
  })

  return NextResponse.json(response)
}
```

---

### Phase 4: Database Updates (Optional, 30 min)

If tracking infographics separately:

#### 4.1 Update `images` table
Add to existing `image_type` enum:
```sql
ALTER TYPE image_type ADD VALUE IF NOT EXISTS 'infographic';
```

#### 4.2 Add metadata fields
The `metadata` JSONB field can store:
```json
{
  "infographic_style": "business",
  "infographic_type": "comparison",
  "has_data_visualization": true,
  "text_input_length": 250
}
```

---

## 💰 Credit System

### Recommendation: Same as Image Generation
- **Cost per infographic:** 5 credits
- **Reason:** Similar computational cost to image generation
- **Alternative:** 3 credits (if we want to encourage adoption)

### Credit Flow
1. Check user has ≥ 5 credits
2. Generate infographic
3. Upload to R2
4. Create image record with `image_type: 'infographic'`
5. Create credit transaction: `-5 credits`
6. Update user profile credits

---

## 🎨 UI/UX Flow

### User Journey
1. **Input Phase**
   - User lands on `/ai-infographic-generator`
   - Sees example prompts (already implemented ✅)
   - Can input text OR upload file OR both
   - Optional: Select style preset

2. **Generation Phase**
   - Click "Generate Infographic" button
   - Show loading state with progress message
   - Display credit cost (5 credits)
   - Check authentication/credits

3. **Result Phase**
   - Display generated infographic
   - Show download button
   - Option to regenerate with modifications
   - Save to history automatically

4. **Error Handling**
   - Insufficient credits → Redirect to pricing
   - Rate limit → Show countdown timer
   - Generation failed → Show retry option
   - Invalid input → Show helpful error message

---

## 🔧 Technical Implementation Details

### File Upload Handling
```typescript
// For file upload, use existing pattern:
const handleFileUpload = async (file: File) => {
  // Option 1: Upload to temporary storage first
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload-temp', {
    method: 'POST',
    body: formData
  })

  const { url } = await response.json()
  return url
}

// Option 2: Convert to base64 and send directly
const reader = new FileReader()
reader.readAsDataURL(file)
// Send base64 in request body
```

### Style Presets
```typescript
const stylePresets = {
  business: {
    colors: ['#2563EB', '#FFFFFF', '#F3F4F6'],
    layout: 'structured',
    tone: 'professional'
  },
  colorful: {
    colors: ['#F59E0B', '#8B5CF6', '#3B82F6', '#10B981'],
    layout: 'dynamic',
    tone: 'engaging'
  },
  minimal: {
    colors: ['#1F2937', '#FFFFFF'],
    layout: 'clean',
    tone: 'sophisticated'
  }
}
```

---

## 📊 Testing Strategy

### Unit Tests
- [ ] Prompt building logic
- [ ] Credit calculation
- [ ] File upload handling

### Integration Tests
- [ ] Full generation flow (text input)
- [ ] Generation with file upload
- [ ] Credit deduction
- [ ] Error handling

### Manual Testing Checklist
- [ ] Generate with text only
- [ ] Generate with file only
- [ ] Generate with both text and file
- [ ] Test each style preset
- [ ] Test with insufficient credits
- [ ] Test rate limiting
- [ ] Test download functionality
- [ ] Verify credit deduction
- [ ] Check image saved to history

---

## 🚀 Deployment Checklist

### Environment Variables
Already configured (no changes needed):
- ✅ `OPENROUTER_API_KEY`
- ✅ `R2_ACCOUNT_ID`
- ✅ `R2_ACCESS_KEY_ID`
- ✅ `R2_SECRET_ACCESS_KEY`
- ✅ `R2_BUCKET_NAME`
- ✅ `NEXT_PUBLIC_R2_ENDPOINT`

### Database
Already configured (no changes needed):
- ✅ `images` table supports the feature
- ✅ `credit_transactions` table ready
- ✅ `user_profiles` has credits field

### Frontend
- [ ] Deploy updated HeroSection component
- [ ] Deploy new hook `useInfographicGeneration`
- [ ] Deploy result display component
- [ ] Update translations if needed

---

## 📈 Success Metrics

### Key Performance Indicators
1. **Generation Success Rate:** Target >95%
2. **Average Generation Time:** Target <15 seconds
3. **User Satisfaction:** Based on regeneration rate
4. **Credit Conversion:** Users purchasing credits for infographics

### Monitoring
- Track generation requests in database
- Monitor OpenRouter API latency
- Track error rates by type
- Monitor credit usage patterns

---

## 🔄 Reusable Components Summary

### Already Available (No New Code Needed)
1. ✅ **Authentication:** Complete JWT system
2. ✅ **Credit Management:** Check, deduct, record
3. ✅ **Rate Limiting:** Configurable limits per user
4. ✅ **Image Storage:** R2 upload with CDN
5. ✅ **Error Handling:** Retry logic with backoff
6. ✅ **Database:** All necessary tables exist
7. ✅ **API Client:** OpenRouter integration

### New Components Needed
1. 🆕 `useInfographicGeneration` hook (~100 lines)
2. 🆕 Prompt builder helper (~50 lines)
3. 🆕 File upload handler (~30 lines)
4. 🆕 Result display component (~80 lines)
5. 🆕 Generate button integration (~20 lines)

**Total New Code:** ~280 lines
**Reused Code:** ~500 lines from existing system

---

## 💡 Recommendations

### Immediate Implementation (MVP)
1. **Use existing `/api/generate-image`** API
2. **Create `useInfographicGeneration` hook** with smart prompt building
3. **Update HeroSection** with generate button
4. **Reuse download/history logic** from existing components
5. **Keep same credit cost** (5 credits)

### Future Enhancements
1. Template library integration
2. Custom color scheme selector
3. Multi-page infographic support
4. Export to different formats (PDF, SVG)
5. Collaborative editing features
6. AI suggestions based on input data

---

## ⏱️ Estimated Timeline

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Create `useInfographicGeneration` hook | 2 hours | High |
| 2 | Update HeroSection with generation logic | 1 hour | High |
| 3 | Create result display component | 1 hour | High |
| 4 | Prompt engineering and testing | 2 hours | High |
| 5 | Error handling and edge cases | 1 hour | Medium |
| 6 | UI polish and loading states | 1 hour | Medium |
| 7 | Testing and bug fixes | 2 hours | High |

**Total Estimated Time:** 10 hours (1-2 days)

---

## 🎯 Conclusion

The implementation can **reuse ~80% of existing code**, making it efficient to implement. The key is smart prompt engineering to guide the AI model to generate infographic-style images rather than generic images.

**Next Steps:**
1. Create the `useInfographicGeneration` hook
2. Integrate with HeroSection component
3. Test with various prompts and styles
4. Iterate on prompt templates based on results
