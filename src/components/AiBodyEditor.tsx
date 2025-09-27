'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import Header from './common/Header';

export default function AiBodyEditor() {
  const { user, profile, refreshProfile } = useAuth();
  const [prompt, setPrompt] = useState('Redefine the natural curves and contours of your body. Whether it\'s your arms, legs, waistline, or buttocks, use this tool to make every body part look flawless.');
  const [bodyPart, setBodyPart] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [trialsLeft, setTrialsLeft] = useState(3);
  
  const creditsRequired = 2;

  const galleryImages = [
    { before: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/body-editor/samples/1-before.webp`, after: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/body-editor/samples/1-after.webp` },
    // { before: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/body-editor/samples/2-before.webp`, after: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/body-editor/samples/2-after.webp` },    
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
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }
    if (!bodyPart.trim()) {
      setError('Please specify the body part to edit');
      return;
    }
    
    if (!user) {
      setError('Please sign in to use body editor');
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(`Insufficient credits. You need ${creditsRequired} credits to use body editor.`);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const finalPrompt = `Enhance and reshape the ${bodyPart} in this image. ${prompt} Maintain natural proportions and realistic appearance while improving the contours and curves. Ensure the editing looks natural and seamless.`;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: 'gemini-2.0-flash',
          imageUrls: [uploadedImage]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to use body editor');
        } else if (response.status === 402) {
          setError(`Insufficient credits. You need ${data.required} credits but only have ${data.available}.`);
        } else {
          setError(data.error || 'Failed to edit body');
        }
        return;
      }

      setGeneratedImage(data.imageUrl);
      setDescription(data.description);
      setTrialsLeft(prev => Math.max(0, prev - 1));
      
      await refreshProfile();
      
    } catch (error) {
      console.error('Error editing body:', error);
      setError('Failed to edit body. Please try again.');
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
            AI Body Editor
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free AI Body Editor - Reshape Your Body
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto px-4">
            BodyAI Plus AI body editor lets you redefine the natural curves and contours of your body. Whether it&apos;s your arms, legs, waistline, or buttocks, use this tool to make every body part look flawless.
          </p>
        </div>

        {/* Main Interface */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Side - Body Editor Studio */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">💪 Smart Body Reshaping Lab</h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">Photo → Enhanced Body</p>
              </div>
              
              <div className="p-6">
                {/* Upload Photo Section */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Upload Photo (Reshape Your Body)
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
                        Drag and drop image here
                      </p>
                      <div className="mt-3">
                        <Button variant="outline" size="sm">
                          Upload Image
                        </Button>
                      </div>
                    
                    </label>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {trialsLeft} Trials Left Today
                  </p>
                </div>

                {/* Body Part Input */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Body Part to Enhance *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={bodyPart}
                    onChange={(e) => setBodyPart(e.target.value)}
                    placeholder="e.g. waist, arms, legs, buttocks, curves"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Specify which body part you want to enhance or reshape
                  </p>
                </div>

                {/* Enhancement Instructions */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Enhancement Instructions (Optional)
                  </label>
                  <textarea
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Additional instructions for how to enhance the body part
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
                  disabled={isGenerating || !user || !profile || (profile.credits || 0) < creditsRequired || !bodyPart.trim() || !uploadedImage}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enhancing Body...
                    </span>
                  ) : !user ? (
                    'Sign In to Reshape Body'
                  ) : !profile ? (
                    'Loading...'
                  ) : (profile.credits || 0) < creditsRequired ? (
                    'Insufficient Credits'
                  ) : !bodyPart.trim() ? (
                    'Enter Body Part to Enhance'
                  ) : !uploadedImage ? (
                    'Upload Image First'
                  ) : (
                    '✨ Reshape Body Now'
                  )}
                </Button>

                {!uploadedImage && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-center">
                    <span className="text-xs text-red-600">
                      ⚠ Please upload a photo to reshape your body
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Results Gallery */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">✨ Enhanced Body Showcase</h2>
                </div>
              </div>

              <div className="p-6">
                {generatedImage ? (
                  <div className="space-y-4">
                    {/* Generated Image */}
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={generatedImage} 
                        alt="Body Enhanced" 
                        className="w-full h-auto"
                      />
                    </div>
                    
                    {/* Description */}
                    {description && (
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-700">
                          <strong>Enhancement Description:</strong> {description}
                        </p>
                      </div>
                    )}

                    {/* Download and Share */}
                    <div className="space-y-3">
                      <FreeOriginalDownloadButton
                        imageUrl={generatedImage}
                        filename={`body-enhanced-${Date.now()}.png`}
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
                        Body successfully enhanced with natural-looking results
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
                          alt="Before body enhancement"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          Before
                        </div>
                      </div>
                      <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                        <img 
                          src={galleryImages[currentGalleryIndex].after} 
                          alt="After body enhancement"
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

                    {/* QR Code Section */}
                    <div className="mt-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-white rounded border-2 border-pink-300 flex items-center justify-center">
                          <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-pink-700 mb-1">
                            Unlock More Free Features
                          </p>
                          <p className="text-xs text-pink-600">
                            A Get 7-day Free Trial in the App
                          </p>
                        </div>
                      </div>
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
                💪 Advanced Body Enhancement Technology
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Professional-grade AI technology for natural body reshaping and enhancement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1 - Natural Reshaping */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="w-16 h-16 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  🎯 Natural Body Contouring
                </h3>
                <p className="text-gray-600 text-sm">
                  Enhance waist, arms, legs, and other body parts with AI that maintains natural proportions and realistic appearance.
                </p>
              </div>

              {/* Feature 2 - Intelligent Enhancement */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="w-16 h-16 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  🧠 Smart Body Analysis
                </h3>
                <p className="text-gray-600 text-sm">
                  Advanced AI analyzes body structure and applies enhancements that look natural and maintain proper lighting and shadows.
                </p>
              </div>

              {/* Feature 3 - Professional Results */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="w-16 h-16 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  ✨ Professional Quality
                </h3>
                <p className="text-gray-600 text-sm">
                  Get high-resolution results that look professional and natural. Perfect for portraits, fashion photos, and social media.
                </p>
              </div>

              {/* Feature 4 - Easy to Use */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="w-16 h-16 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  ⚡ Quick & Easy
                </h3>
                <p className="text-gray-600 text-sm">
                  Simply upload your photo, specify the body part to enhance, and get professional results in seconds.
                </p>
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
                🚀 Enhance Your Body in 3 Simple Steps
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Transform your photos with natural body enhancements using our intelligent AI system.
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
                  📷 Upload Your Photo
                </h3>
                <p className="text-gray-600 text-sm">
                  Upload any photo where you want to enhance body contours. Works with portraits and full-body shots.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
                <div className="w-20 h-20 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <div className="text-2xl font-bold text-yellow-700">02</div>
                </div>
                <div className="w-16 h-16 bg-yellow-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  💪 Choose Body Part
                </h3>
                <p className="text-gray-600 text-sm">
                  Specify which body part to enhance - waist, arms, legs, curves, or any other area you want to improve.
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
                  ✨ Download Enhanced Photo
                </h3>
                <p className="text-gray-600 text-sm">
                  Get your photo with natural body enhancements that look realistic and professional.
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 text-lg">
                Enhance Body Now →
              </Button>
            </div>
          </div>
        </section>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageUrl={generatedImage || ''}
          title="Check out my enhanced body photo!"
          description="Created with EasyNanoBanana AI Body Editor"
        />
      </div>
    </>
  );
}