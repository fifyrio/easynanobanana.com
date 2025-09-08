'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import Header from './common/Header';

export default function AiFigureGenerator() {
  const { user, profile, refreshProfile } = useAuth();
  const [prompt, setPrompt] = useState('Create a realistic 1/7 scale PVC figurine based on the character in the photo. The figure is placed on a round transparent acrylic base with no text, and sits on a computer desk in an indoor environment. Behind it, there\'s a BANDAI-style toy packaging box featuring a 2D illustration of the same character. On the nearby screen, show the ZBrush modeling process of this figure have a easynanobanana text on the box.');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  
  const creditsRequired = 5;

  // Gallery placeholder data
  const galleryImages = [
    { before: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/ActionFigureGallery/1-before.webp`, after: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/ActionFigureGallery/1-after.webp` },
    { before: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/ActionFigureGallery/2-before.webp`, after: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/ActionFigureGallery/2-after.webp` },
    { before: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/ActionFigureGallery/3-before.webp`, after: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/ActionFigureGallery/3-after.webp` },    
  ];

  const nextGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const previousGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (activeTab === 'upload' && !uploadedImage) {
      setError('Please upload an image first');
      return;
    }
    if (activeTab === 'text' && !prompt.trim()) {
      setError('Please enter a description');
      return;
    }
    
    if (!user) {
      setError('Please sign in to generate action figures');
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(`Insufficient credits. You need ${creditsRequired} credits to generate an action figure.`);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let finalPrompt = '';
      if (activeTab === 'upload') {
        finalPrompt = "Create a realistic 1/7 scale PVC action figure based on the character in the photo. The figure is placed on a round transparent acrylic base with no text, and sits on a computer desk in an indoor environment. Behind it, there's a BANDAI-style toy packaging box featuring a 2D illustration of the same character. On the nearby screen, show the ZBrush modeling process of this figure. Have a easynanobanana text on the box.";
      } else {
        finalPrompt = `Create a realistic 1/7 scale PVC action figure: ${prompt}. The figure is placed on a round transparent acrylic base with no text, and sits on a computer desk in an indoor environment. Behind it, there's a BANDAI-style toy packaging box featuring a 2D illustration of the same character. On the nearby screen, show the ZBrush modeling process of this figure. Have a easynanobanana text on the box.`;
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: 'gemini-2.0-flash',
          imageUrls: activeTab === 'upload' && uploadedImage ? [uploadedImage] : []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to generate action figures');
        } else if (response.status === 402) {
          setError(`Insufficient credits. You need ${data.required} credits but only have ${data.available}.`);
        } else {
          setError(data.error || 'Failed to generate action figure');
        }
        return;
      }

      setGeneratedImage(data.imageUrl);
      setDescription(data.description);
      
      await refreshProfile();
      
    } catch (error) {
      console.error('Error generating action figure:', error);
      setError('Failed to generate action figure. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-center py-12 bg-white">
        <div className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
          AI Action Figure Generator
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Turn Your photo to AI action figure
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto px-4">
          Use Nano Banana on easynanobanana to make your own AI action figure, toy figure, or figurine
          from a selfie or a text prompt. Create boxes, accessories, and poses. Simple, fast, and free to
          start.
        </p>
      </div>

      {/* Main Interface */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - AI Figure Studio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">🎭 Your Personal Action Figure Lab</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">Photo → Action Figure</p>
            </div>
            
            <div className="p-6">
              {/* Upload Photo Section */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Upload Photo (Make Yourself an Action Figure)
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer block">
                    {uploadedImage ? (
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-24 h-24 object-cover rounded-lg mx-auto mb-3"
                      />
                    ) : (
                      <div className="w-12 h-12 mx-auto mb-3">
                        <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    )}
                    <p className="text-gray-600 text-sm mb-1">
                      Click or drag to upload photos for action figure creation
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports JPG, PNG, WebP formats, max 10MB each
                    </p>
                  </label>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Support uploading multiple images for editing, up to 5 images, max 10MB each
                </p>
              </div>

              {/* Action Figure Style Description */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Action Figure Style Description *
                </label>
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tell us the look, outfit, box design, and accessories for your figure
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Credits Info */}
              {user && profile && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className="mr-2">💎</span>
                      <span className="text-yellow-700">
                        You have <strong>{profile.credits || 0}</strong> credits
                      </span>
                    </div>
                    <span className="text-yellow-600 text-xs">
                      Cost: {creditsRequired} credits
                    </span>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !user || !profile || (profile.credits || 0) < creditsRequired}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Start Creating Action Figures (Free)
                  </span>
                ) : !user ? (
                  'Sign In to Generate'
                ) : !profile ? (
                  'Loading...'
                ) : (profile.credits || 0) < creditsRequired ? (
                  'Insufficient Credits'
                ) : (
                  '✨ Start Creating Action Figures (Free)'
                )}
              </Button>

              {!uploadedImage && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-center">
                  <span className="text-xs text-red-600">
                    ⚠ Please upload a photo to transform into an action figure
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Action Figure Gallery */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">🏆 Epic Action Figure Showcase</h2>
              </div>
            </div>

            <div className="p-6">
              {generatedImage ? (
                <div className="space-y-4">
                  {/* Generated Image */}
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={generatedImage} 
                      alt="Generated Action Figure" 
                      className="w-full h-auto"
                    />
                  </div>
                  
                  {/* Description */}
                  {description && (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700">
                        <strong>Enhanced Description:</strong> {description}
                      </p>
                    </div>
                  )}

                  {/* Download and Share */}
                  <div className="space-y-3">
                    <FreeOriginalDownloadButton
                      imageUrl={generatedImage}
                      filename={`action-figure-${Date.now()}.png`}
                      className="text-sm"
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowShareModal(true)}
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share
                    </Button>
                  </div>

                  <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      Transform portrait into a detailed action figure with articulated joints and accessories
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sample Gallery */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                      <img 
                        src={galleryImages[currentGalleryIndex].before} 
                        alt="Before transformation"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Before
                      </div>
                    </div>
                    <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                      <img 
                        src={galleryImages[currentGalleryIndex].after} 
                        alt="After transformation"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        After
                      </div>
                    </div>
                  </div>                  

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-4">
                    <button 
                      onClick={previousGalleryImage}
                      className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Previous
                    </button>
                    <div className="flex space-x-2">
                      {galleryImages.map((_, index) => (
                        <div 
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentGalleryIndex ? 'bg-yellow-400' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={nextGalleryImage}
                      className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-wide text-yellow-600 font-semibold mb-2">
              FEATURES
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🚀 Superpowers Made Simple (And Free!)
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              One streamlined tool for photo-to-action-figure and text-to-action-figure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 - Photo to AI Action Figure */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/Features/1-before.webp`}
                    alt="Before transformation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/Features/1-after.webp`}
                    alt="After transformation"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  📸 ➡️ 🦸 Magic Photo Transformation
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Upload a selfie or portrait and instantly turn yourself into an action figure. Our AI action figure generator works like a magic wand. Simply snap a photo, upload it, and watch as our magic gets a high pose, and get a collectible 3D-style render. Perfect for anyone searching &ldquo;make action figure of myself&rdquo;, &ldquo;my action figure AI&rdquo; or &ldquo;how to make an AI action figure&rdquo; — fast, simple, and free to start!
                </p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2">
                  Make Your Own Action Figure (Free) →
                </Button>
              </div>
            </div>

            {/* Feature 2 - Text to AI Action Figure */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/Features/2-before.webp`}
                    alt="Before transformation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/Features/2-after.webp`}
                    alt="After transformation"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  ✨ Words Into Warriors Generator
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Don&apos;t have a photo? Type a prompt like &ldquo;cyberpunk hero with glowing sword&rdquo; or &ldquo;WWE champion with belt,&rdquo; and the action figure image generator will create a complete AI-generated action figure. Ideal for queries like &ldquo;create action figure AI&rdquo;, &ldquo;action figure creator&rdquo;, and &ldquo;chatgpt action figure generator&rdquo;.
                </p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2">
                  Create Action Figure AI Now →
                </Button>
              </div>
            </div>

            {/* Feature 3 - AI Packaging & Accessories */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/Features/3-before.webp`}
                    alt="Before transformation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/Features/3-after.webp`}
                    alt="After transformation"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  📦 Complete Toy Store Experience
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Design blister packs, window boxes, logos, card backs, stands, weapons, pets, and alternate heads — all inside the AI toy figure generator. Go beyond a single render and make store-ready mockups for collectors or merch.
                </p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2">
                  Design Boxes & Accessories →
                </Button>
              </div>
            </div>

            {/* Feature 4 - Download High-Res */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/Features/4-before.webp`}
                    alt="Before transformation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ai-figure-generator/Features/4-after.webp`}
                    alt="After transformation"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  💎 Museum-Quality Figure Downloads
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Export PNG/JPG in high resolution for social posts, posters, or as reference for 3D printing. Free users can download one figure at a time; Pro unlocks batch creation and commercial rights. Covers high-intent needs like &ldquo;free action figure generators&rdquo;, &ldquo;get your own action figure&rdquo;, and &ldquo;make yourself into an action figure&rdquo;.
                </p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2">
                  Download Your AI Action Figure →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-wide text-yellow-600 font-semibold mb-2">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🎯 Your Hero Journey in 3 Easy Steps
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              No 3D skills needed — the AI action figure generator handles it for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl font-bold text-yellow-700">01</div>
              </div>
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🎨 Dream It or Snap It
              </h3>
              <p className="text-gray-600 text-sm">
                Add a selfie or type a prompt like &ldquo;WWE champion with entrance gear&rdquo; or &ldquo;retro arcade hero.&rdquo;
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl font-bold text-yellow-700">02</div>
              </div>
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🎪 Watch the Magic Happen
              </h3>
              <p className="text-gray-600 text-sm">
                Pick styles, colors, poses, and packaging. Watch your AI action figure update live.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl font-bold text-yellow-700">03</div>
              </div>
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🎉 Show Off Your Creation
              </h3>
              <p className="text-gray-600 text-sm">
                Get high-res PNG/JPG. Post it, print it, or use it for merch mockups.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 text-lg">
              Turn Photo To Video Now →
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              🤔 Curious Minds Want to Know
            </h2>
            <p className="text-lg text-gray-600">
              Curious to learn more about bringing your imagination to life? Explore these
              common questions and discover how easynanobanana makes creating your own
              action figures incredibly fun and easy!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "ai action figure generator free online",
                description: "Discover the magic of creating your own custom action figures without spending a single penny! Our ai action figure generator..."
              },
              {
                title: "ai toy figure generator",
                description: "easynanobanana is not just an action figure creator; it's a versatile ai toy figure generator that lets you design all..."
              },
              {
                title: "ai action figure generator chatgpt free",
                description: "Experience the power of advanced AI with our ai action figure generator, powered by intelligence similar to..."
              },
              {
                title: "ai action figure generator prompt",
                description: "Unleash your creativity with the perfect ai action figure generator prompt! At easynanobanana, your prompt is the..."
              },
              {
                title: "can you make your own action figure",
                description: "Yes, you absolutely can make your own action figure with easynanobanana! We've made the process incredibly..."
              },
              {
                title: "ai action figure generator trend",
                description: "The ai action figure generator trend is booming, and easynanobanana is at the forefront of this exciting wave!..."
              },
              {
                title: "how do i make my own action figures",
                description: "Making your own action figures with easynanobanana is surprisingly easy and fun! Here's a simple guide to get..."
              },
              {
                title: "ai action figure generator in box",
                description: "What makes easynanobanana's ai action figure generator truly special is that it doesn't just create the figure itself..."
              }
            ].map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {faq.description}
                </p>
                <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium mt-3 flex items-center">
                  Read more
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3">
              Create Your Free AI Action Figure Now!
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-wide text-yellow-600 font-semibold mb-2">
              WHAT USERS SAY
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              💝 Fans Can&apos;t Stop Raving About Us
            </h2>
            <p className="text-lg text-gray-600">
              Real feedback from our community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex T.",
                role: "User",
                content: "Free, insanely quick — the AI action figure generator nailed my likeness!",
                rating: 5
              },
              {
                name: "Sarah M.",
                role: "User",
                content: "Birthday gift in under a minute. The action figure maker is pure magic.",
                rating: 5
              },
              {
                name: "Jamie R.",
                role: "User", 
                content: "Packaging looks store-ready. Best free AI action figure creator I've tried.",
                rating: 5
              },
              {
                name: "Lena P.",
                role: "User",
                content: "Retro toy of myself? Yes please! Nano Banana rocks.",
                rating: 5
              },
              {
                name: "Chris K.",
                role: "User",
                content: "Feels like having a personal figure artist on speed dial.",
                rating: 5
              },
              {
                name: "Dana L.",
                role: "User",
                content: "From upload to share in 60 seconds — shockingly good.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3">
              Start Now →
            </Button>
          </div>
        </div>
      </section>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        imageUrl={generatedImage || ''}
        title="Check out my AI-generated action figure!"
        description="Created with EasyNanoBanana AI Action Figure Generator"
      />
      </div>
    </>
  );
}