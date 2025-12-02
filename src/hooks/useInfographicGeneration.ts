import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface InfographicParams {
  textInput?: string
  uploadedFiles?: File[]
  style?: string
  templateType?: string
}

interface StylePrompts {
  [key: string]: string
}

interface TemplatePrompts {
  [key: string]: string
}

export function useInfographicGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()

  const generateInfographic = async (params: InfographicParams) => {
    if (!user) {
      toast.error('Please sign in to generate infographics')
      return
    }

    if (profile && (profile.credits === null || profile.credits < 5)) {
      toast.error('Insufficient credits. You need 5 credits to generate an infographic.')
      setTimeout(() => router.push('/pricing'), 1500)
      return
    }

    setIsGenerating(true)
    setGeneratedUrl(null)

    try {
      // Build enhanced prompt for infographics
      const enhancedPrompt = buildInfographicPrompt(params)

      // Convert uploaded files to data URLs for the API
      let imageUrls: string[] | undefined
      if (params.uploadedFiles && params.uploadedFiles.length > 0) {
        try {
          imageUrls = await convertFilesToDataUrls(params.uploadedFiles)
        } catch (fileError) {
          console.error('Failed to read uploaded files:', fileError)
          toast.error('Failed to process uploaded images. Please try again.')
          return
        }
      }

      // Get access token
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token)
      if (!token) {
        toast.error('Authentication required')
        setIsGenerating(false)
        return
      }

      // Call existing generate-image API
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error('Please sign in to generate infographics')
          // Don't redirect - user already knows they need to sign in
        } else if (response.status === 402) {
          toast.error('Insufficient credits. You need 5 credits to generate an infographic.')
          setTimeout(() => router.push('/pricing'), 1500)
        } else {
          throw new Error(errorData.error || 'Generation failed')
        }
        return
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
  const hasUploadedFiles = params.uploadedFiles && params.uploadedFiles.length > 0
  const isFashionTemplate = params.templateType === 'fashion'

  // Special prompt for Fashion template with uploaded image
  if (isFashionTemplate && hasUploadedFiles) {
    return `Based on the protagonist and outfit style of the uploaded image, this illustration has been redrawn as a fashion deconstruction illustration.

The main character maintains the same appearance, hairstyle, body proportions, and pose as the uploaded image, but the overall style has shifted to a fashion illustration style, with a strong sense of trend and clean, crisp lines. The character is placed in the center of the image, fully displayed, wearing an illustrated version of the clothing from the uploaded image, with more advanced material details and lighting effects.

The layout references a fashion design draft: a beige paper background with soft textures, and explanatory small images and clothing breakdown diagrams distributed on the right and around the edges. Black lines and simple handwritten Chinese characters are used to label the clothing names, materials, and key details.

Around the main character, breakdown diagrams of accessories related to the outfit in the uploaded image are added, such as:
- Clothing shown individually
- Breakdown line drawings of skirts, pants, and coats
- Enlarged circular texture maps of materials
- Shoes, bags, cosmetics, or accessories
- Small illustrations related to the scene/atmosphere

The overall style is: fashion illustration + outfit guide + design sketch. The visual effect is clear, detailed, cute, and professional. Add Chinese annotations to the image, such as:
"材质说明" (Material Description)
"细节展示" (Details)
"配饰展示" (Accessory Showcase)
"搭配建议" (Styling Tips)

Maintain a high-quality illustration feel, with soft, textured colors and a slightly glossy, paper-textured background.
Present the outfits and character's style in the uploaded image in a more beautiful and sophisticated way. All text must be in Chinese.

${params.textInput ? `\nAdditional requirements: ${params.textInput}` : ''}`
  }

  // Standard infographic prompts
  const basePrompt = 'Create a professional infographic design.'

  const stylePrompts: StylePrompts = {
    'handdrawn': 'Use a hand-drawn, sketch-style aesthetic with playful illustrations and organic shapes. Incorporate doodle-like icons and casual typography.',
    'hand-drawn': 'Use a hand-drawn, sketch-style aesthetic with playful illustrations and organic shapes. Incorporate doodle-like icons and casual typography.',
    'modern': 'Use a sleek, modern design with clean geometric shapes, bold sans-serif fonts, and a contemporary color palette. Focus on minimalism and clarity.',
    'minimalist': 'Minimalist design with plenty of white space, 2-3 colors maximum, simple geometric shapes, and focus on clarity. Use clean typography and subtle accents.',
    'colorful': 'Use vibrant, eye-catching colors (orange, purple, blue, green, pink). Modern and engaging design with energetic color combinations and bold graphics.',
    'corporate': 'Use a clean, corporate style with professional blue and white colors. Include charts, graphs, and key metrics. Business-focused with data visualization elements.',
    'creative': 'Use an artistic, creative approach with unique layouts, interesting typography, mixed media elements, and unconventional color schemes. Think outside the box.'
  }

  const templatePrompts: TemplatePrompts = {
    'fashion': 'Fashion-focused layout with elegant typography, stylish imagery, trend highlights, and visual hierarchy emphasizing style and aesthetics.',
    'timeline': 'Timeline or process flow layout with connected steps, chronological progression, milestone markers, and icons for each phase. Use flowing arrows or lines to connect events.',
    'comparison': 'Side-by-side comparison layout with clear visual separation between categories. Use distinct colors for each side, include percentage bars, icons, and clear labels for easy comparison.',
    'statistics': 'Statistics-focused design with large bold numbers, data visualization charts (pie charts, bar graphs), key metrics prominently displayed, and clean geometric layouts.',
    'process': 'Process flow diagram showing workflow steps. Use numbered circles or squares connected by arrows, include brief descriptions for each step, and add relevant icons.',
    'list': 'List-based infographic with hierarchical information, bullet points or numbered items, clear categorization, and visual icons for each list item.',
    'geographic': 'Geographic or map-based infographic showing regional data, location-specific information, color-coded regions, and spatial relationships.',
    'map': 'Geographic or map-based infographic showing regional data, location-specific information, color-coded regions, and spatial relationships.'
  }

  const styleGuide = params.style ? stylePrompts[params.style] : stylePrompts['modern']
  const templateGuide = params.templateType ? templatePrompts[params.templateType] : ''

  const userContent = params.textInput || 'Create a general business infographic with data visualization and key information highlights'

  let prompt = hasUploadedFiles
    ? `Based on the uploaded image, create a professional infographic design.\n\n${styleGuide}`
    : `${basePrompt}\n\n${styleGuide}`

  if (templateGuide) {
    prompt += `\n\n${templateGuide}`
  }

  prompt += `\n\nContent to visualize:\n${userContent}`

  prompt += `\n\nRequirements:
- High resolution, suitable for presentations and social media
- Clear visual hierarchy with proper heading levels
- Professional typography with readable fonts
- Well-organized layout with logical flow
- Include relevant icons and graphics
- Ensure all text is clearly readable
- Use proper spacing and alignment
- Create a cohesive color scheme
- Make data and statistics stand out
- Design should be visually engaging and informative`

  return prompt
}

function convertFilesToDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(files.map(file => readFileAsDataUrl(file)))
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => {
      reader.abort()
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}
