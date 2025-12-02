"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import FreeOriginalDownloadButton from '@/components/ui/FreeOriginalDownloadButton'
import { useInfographicGeneration } from '@/hooks/useInfographicGeneration'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const slides = [
  {
    src: "/images/infographic/image-1764543907761-bdf8g1-1x1-1024x1024.webp",
    alt: "Sample Infographic - Hand-drawn Style",
  },
  {
    src: "/images/infographic/business-data-visualization-infographic.webp",
    alt: "Business Data Infographic",
  },
  {
    src: "/images/infographic/modern-statistics-infographic-design.webp",
    alt: "Statistics Infographic",
  },
  {
    src: "/images/infographic/colorful-timeline-process-infographic.webp",
    alt: "Timeline Infographic",
  },
]

const styleOptions = [
  { id: "handdrawn", name: "Hand-drawn", preview: "/images/infographic/image-1764543907761-bdf8g1-1x1-1024x1024.webp" },
  { id: "modern", name: "Modern", preview: "/images/infographic/business-data-visualization-infographic.webp" },
  { id: "minimalist", name: "Minimalist", preview: "/images/infographic/modern-statistics-infographic-design.webp" },
  { id: "colorful", name: "Colorful", preview: "/images/infographic/colorful-timeline-process-infographic.webp" },
  { id: "corporate", name: "Corporate", preview: "/images/infographic/business-data-infographic.webp" },
  { id: "creative", name: "Creative", preview: "/images/infographic/colorful-chart-infographic.webp" },
]

const templateOptions = [
  { id: "fashion", name: "Fashion", icon: "👗" },
  { id: "timeline", name: "Timeline", icon: "📅" },
  { id: "comparison", name: "Comparison", icon: "⚖️" },
  { id: "statistics", name: "Statistics", icon: "📊" },
  { id: "process", name: "Process Flow", icon: "🔄" },
  { id: "list", name: "List / Steps", icon: "📋" },
  { id: "map", name: "Geographic", icon: "🗺️" },
]

export default function InfographicHeroSection() {
  const t = useTranslations('aiInfographicGenerator.hero')

  // Use the infographic generation hook
  const { generateInfographic, isGenerating, generatedUrl, setGeneratedUrl, remainingFree } = useInfographicGeneration()
  const { user, refreshProfile } = useAuth()

  // Basic states
  const [isDragging, setIsDragging] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [textInput, setTextInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New states
  const [activeTab, setActiveTab] = useState<"upload" | "text">("upload")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const hasContent = uploadedFiles.length > 0 || textInput.trim().length > 0

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const claimShareReward = async (platform: string) => {
    if (!user) return

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      const res = await fetch('/api/credits/social-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ platform, content: 'Infographic' })
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(t('shareModal.creditsReward') + ": +3", {
          icon: '🎁',
          duration: 4000
        })
        await refreshProfile()
      }
    } catch (e) {
      console.error('Error claiming share reward:', e)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files])
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleGenerate = async () => {
    // Validate that user has some content
    if (!hasContent) {
      return
    }

    // Call the actual generation hook
    await generateInfographic({
      textInput: textInput.trim(),
      uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      style: selectedStyle || undefined,
      templateType: selectedTemplate || undefined,
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
    claimShareReward('copy_link')
  }

  const handleReset = () => {
    setGeneratedUrl(null)
    setUploadedFiles([])
    setTextInput("")
    setSelectedStyle(null)
    setSelectedTemplate(null)
  }

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent("Check out my AI-generated infographic!")

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      email: `mailto:?subject=Check out my infographic&body=${url}`
    }

    window.open(urls[platform as keyof typeof urls], "_blank")
    claimShareReward(platform)
  }

  return (
    <section className="py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 text-balance">
            {t('title')}
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto text-pretty">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
          {/* Left Column - Input */}
          <div className="flex flex-col gap-4">
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "upload"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('uploadTab')}
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "text"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('textTab')}
              </button>
            </div>

            {/* Upload Tab Content */}
            {activeTab === "upload" && (
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging ? "border-yellow-500 bg-yellow-50" : "border-gray-300 bg-gray-50 hover:border-yellow-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {uploadedFiles.length === 0 ? (
                  <>
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-900 font-medium mb-1">{t('dragDrop')}</p>
                    <p className="text-xs text-gray-500 mb-4">{t('supportImages')}</p>
                  </>
                ) : (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="max-w-[120px] truncate text-gray-900">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 text-sm text-yellow-600 hover:underline"
                    >
                      + {t('addMoreFiles')}
                    </button>
                  </div>
                )}

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 w-full max-w-xs bg-transparent"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {t('browseFiles')}
                </Button>
              </div>
            )}

            {/* Text Input Tab Content */}
            {activeTab === "text" && (
              <div className="border-2 border-gray-300 rounded-2xl p-4 bg-gray-50">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t('textPlaceholder')}
                  className="w-full h-40 bg-white border border-gray-300 rounded-xl p-4 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>{textInput.length} {t('characters')}</span>
                  <span>{t('textHint')}</span>
                </div>
              </div>
            )}

            {/* Style & Template Selector (shown when has content) */}
            {hasContent && (
              <div className="border-2 border-yellow-300 rounded-2xl p-4 bg-yellow-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">{t('chooseStyleTemplate')}</span>
                  <span className="text-xs text-gray-600">({t('optional')})</span>
                </div>

                {/* Style Selection */}
                <div className="mb-4">
                  <label className="text-sm text-gray-600 mb-2 block">{t('style')}</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {styleOptions.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
                        className={`flex-shrink-0 group relative rounded-xl overflow-hidden border-2 transition-all ${
                          selectedStyle === style.id
                            ? "border-yellow-500 ring-2 ring-yellow-300"
                            : "border-gray-300 hover:border-yellow-400"
                        }`}
                      >
                        <img
                          src={style.preview}
                          alt={style.name}
                          className="w-20 h-20 object-cover"
                        />
                        <div className="absolute inset-0 flex items-end justify-center pb-1 bg-gradient-to-t from-black/60 to-transparent">
                          <span className="text-xs text-white font-medium">{style.name}</span>
                        </div>
                        {selectedStyle === style.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">{t('templateType')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {templateOptions.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${
                          selectedTemplate === template.id
                            ? "border-yellow-500 bg-yellow-100 text-gray-900"
                            : "border-gray-300 bg-white hover:border-yellow-400 text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <span className="text-base">{template.icon}</span>
                        <span className="truncate text-xs">{template.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              className="bg-yellow-500 text-white hover:bg-yellow-600 w-full py-6 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasContent || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  {t('generateButton')}
                  {remainingFree !== null && remainingFree > 0 ? (
                    <span className="ml-2 text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded-full">
                      {t('freeToday', { count: remainingFree })}
                    </span>
                  ) : remainingFree === 0 ? (
                    <span className="ml-2 text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded-full">
                      {t('credits')}
                    </span>
                  ) : (
                     <span className="ml-2 text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded-full">
                      {t('freeToday', { count: 3 })}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Preview */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 p-4 relative">
              {isGenerating ? (
                <div className="absolute inset-4 flex flex-col items-center justify-center bg-white rounded-xl">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin"></div>
                    <div
                      className="absolute inset-3 rounded-full border-4 border-yellow-400 border-b-transparent animate-spin"
                      style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                    ></div>
                    <svg className="absolute inset-0 m-auto w-6 h-6 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">{t('creatingInfographic')}</p>
                  <p className="text-sm text-gray-600">{t('aiWorking')}</p>
                  <div className="mt-4 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : generatedUrl ? (
                <img
                  src={generatedUrl}
                  alt="Generated Infographic"
                  className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover rounded-xl"
                />
              ) : (
                slides.map((slide, index) => (
                  <img
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    className={`absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover rounded-xl transition-opacity duration-500 ${
                      index === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))
              )}
            </div>

            {generatedUrl ? (
              <div className="mt-4 flex flex-col gap-3 w-full max-w-md mx-auto">
                <FreeOriginalDownloadButton
                  imageUrl={generatedUrl}
                  filename="infographic.png"
                  className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowShareModal(true)}
                    variant="outline"
                    className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-transparent relative"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {t('share')}
                    <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                      +3 {t('credits')}
                    </span>
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 text-gray-600 hover:text-gray-900 bg-transparent border-gray-300"
                  >
                    {t('createNew')}
                  </Button>
                </div>
              </div>
            ) : (
              !isGenerating && (
                <>
                  <div className="absolute top-6 right-6 flex flex-col gap-2">
                    {slides.slice(0, 3).map((slide, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 shadow-lg transition-all ${
                          index === currentSlide
                            ? "border-yellow-500 ring-2 ring-yellow-300 scale-105"
                            : "border-white hover:border-yellow-400"
                        }`}
                      >
                        <img
                          src={slide.src}
                          alt={slide.alt}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentSlide ? "bg-yellow-500 w-6" : "bg-gray-400 hover:bg-gray-500"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-br from-yellow-500 via-yellow-500 to-amber-400 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/30 blur-xl" />
                <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-xl" />
              </div>
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('shareModal.title')}</h3>
                <p className="text-white/80 text-sm">{t('shareModal.subtitle')}</p>
                <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-white font-bold text-lg">+3 {t('credits')}</span>
                  <span className="text-white/80 text-sm">{t('shareModal.forSharing')}</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 -mt-6 relative z-10">
              <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
                <img
                  src={generatedUrl || ""}
                  alt="Generated Infographic"
                  className="w-full h-40 object-cover rounded-xl"
                />
              </div>
            </div>

            {/* Share Options */}
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-600 mb-4 text-center">{t('shareModal.shareVia')}</p>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1DA1F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Twitter</span>
                </button>
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Facebook</span>
                </button>
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">LinkedIn</span>
                </button>
                <button
                  onClick={() => shareToSocial('email')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Email</span>
                </button>
              </div>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-yellow-500 hover:bg-yellow-50 transition-all"
              >
                {linkCopied ? (
                  <>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-500 font-medium">{t('shareModal.linkCopied')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-gray-600">{t('shareModal.copyLink')}</span>
                  </>
                )}
              </button>

              {/* Encouragement */}
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl text-center border border-yellow-300">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-yellow-600">+3</span>
                  <span className="text-sm font-medium text-gray-900">{t('shareModal.creditsReward')}</span>
                </div>
                <p className="text-xs text-gray-600">{t('shareModal.encouragement')}</p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-4 py-3 text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                {t('shareModal.maybeLater')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
