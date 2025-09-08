'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';

export default function ImageEditor() {
  const { user, profile, refreshProfile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'text-to-image' | 'image-to-image'>('image-to-image');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  
  const creditsRequired = 5;

  const sampleImages = [
    {
      title: "Character transformation",
      beforeImage: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/1-before.webp`,
      afterImage: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/1-after.webp`,
      prompt: "Create a realistic 1/7 scale PVC figurine based on the character in the photo. The figure is placed on a round transparent acrylic base with no text, and sits on a computer desk in an indoor environment. Behind it, there’s a BANDAI-style toy packaging box featuring a 2D illustration of the same character. On the nearby screen, show the ZBrush modeling process of this figure.have a easynanobanana text on the box."
    },
    {
      title: "Virtual try on", 
      beforeImage: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/2-before.webp`,
      afterImage: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/2-after.webp`,
      prompt: "The character in Figure 1 is wearing the clothing and accessories from Figure 2."
    },
    {
      title: "Product design mockup",
      beforeImage: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/3-before.webp`,
      afterImage: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/3-after.webp`,
      prompt: "Generate a photo of a girl cosplaying this illustration, with the background set at Eiffel Tower"
    }
  ];

  const handleTryExample = () => {
    const currentSample = sampleImages[currentSampleIndex];
    setPrompt(currentSample.prompt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextSample = () => {
    setCurrentSampleIndex((prev) => (prev + 1) % sampleImages.length);
  };

  const prevSample = () => {
    setCurrentSampleIndex((prev) => (prev - 1 + sampleImages.length) % sampleImages.length);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedImages(prev => {
            // Only add if we haven't reached the limit of 3 images
            if (prev.length < 3) {
              return [...prev, result];
            }
            return prev;
          });
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Reset the input value so same file can be selected again if needed
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    if (mode === 'image-to-image' && uploadedImages.length === 0) {
      setError('Please upload at least one image first');
      return;
    }
    
    if (!user) {
      setError('Please sign in to generate images');
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(`Insufficient credits. You need ${creditsRequired} credits to generate an image.`);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          model: 'gemini-2.0-flash',
          imageUrls: mode === 'image-to-image' ? uploadedImages : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to generate images');
        } else if (response.status === 402) {
          setError(`Insufficient credits. You need ${data.required} credits but only have ${data.available}.`);
        } else {
          setError(data.error || 'Failed to generate image');
        }
        return;
      }

      setGeneratedImage(data.imageUrl);
      setDescription(data.description);
      
      await refreshProfile();
      
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Nano Banana Image Editor
        </h1>
        <p className="text-gray-600 text-lg">
          Generate and edit images with the power of AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Input Area */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-gray-900 text-xl font-semibold mb-4">Nano Banana AI</h2>
              
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'image-to-image'
                      ? 'bg-yellow-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setMode('image-to-image')}
                >
                  Image to Image
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'text-to-image'
                      ? 'bg-yellow-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setMode('text-to-image')}
                >
                  Text to Image
                </button>
              </div>

              {/* Model Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Model</label>
                <select className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                  <option>Nano Banana</option>
                </select>
              </div>

              {/* Upload Images (Only show in Image to Image mode) */}
              {mode === 'image-to-image' && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Upload Images (Required) - Max 3 images
                  </label>
                  
                  {/* Show uploaded images */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={image}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-auto object-contain rounded-lg"
                            />
                          </div>
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload area */}
                  {uploadedImages.length < 3 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="imageUpload"
                        multiple
                      />
                      <label htmlFor="imageUpload" className="cursor-pointer">
                        <div className="w-12 h-12 mx-auto mb-2 text-gray-400">
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Add {uploadedImages.length === 0 ? 'images' : `${3 - uploadedImages.length} more image${3 - uploadedImages.length > 1 ? 's' : ''}`}
                        </p>
                      </label>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Drag or Click to upload up to 3 images. You can select multiple files at once.
                  </p>
                </div>
              )}

              {/* Prompt Input */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Prompt (Required)</label>
                <textarea
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Transform this photo into a character figurine story's look with the character's image behind it. Futuristic city background, cyberpunk style, neon lights, character design"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Describe everything you want to add/edit
                </p>
              </div>
            </div>

            {/* Credits and Error Display */}
            {user && profile && (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
                <div className="flex items-center">
                  <span className="text-lg mr-2">💎</span>
                  <span className="text-sm text-yellow-700">
                    You have <strong>{profile.credits || 0}</strong> credits
                  </span>
                </div>
                <span className="text-xs text-yellow-600">
                  Cost: {creditsRequired} credits
                </span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || (mode === 'image-to-image' && uploadedImages.length === 0) || !user || !profile || (profile.credits || 0) < creditsRequired}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : !user ? 'Sign In to Generate' : !profile ? 'Loading...' : (profile.credits || 0) < creditsRequired ? 'Insufficient Credits' : `✨ Create`}
            </Button>
          </div>
        </div>

        {/* Right Side - Sample Images & Result Area */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            {generatedImage ? (
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Generated Image</h3>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="w-full h-auto"
                  />
                </div>
                {description && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Enhanced Description:</strong> {description}
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  <FreeOriginalDownloadButton
                    imageUrl={generatedImage}
                    filename={`generated-${Date.now()}.png`}
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                    className="w-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {/* Sample Image Section */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sample Image</h3>
                  <p className="text-sm text-gray-500">(The created image results will appear here)</p>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="relative">
                      <img 
                        src={sampleImages[currentSampleIndex].beforeImage}
                        alt="Before"
                        className="w-full aspect-[9/16] object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Before
                      </div>
                    </div>
                    <div className="relative">
                      <img 
                        src={sampleImages[currentSampleIndex].afterImage}
                        alt="After"
                        className="w-full aspect-[9/16] object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        After
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      onClick={prevSample}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="flex space-x-1">
                      {sampleImages.map((_, index) => (
                        <div 
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentSampleIndex ? 'bg-yellow-400' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <button 
                      onClick={nextSample}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <Button 
                    onClick={handleTryExample}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    Try The Example
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our AI-powered image editor and generation tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "How does the AI image generator work?",
                description: "Our AI image generator uses advanced machine learning models to create stunning images from text descriptions. Simply describe what you want to see, and our AI will bring your vision to life in seconds."
              },
              {
                title: "What image formats are supported?",
                description: "We support all major image formats including JPG, PNG, WebP, and more. You can upload images up to 10MB in size and download your creations in high resolution."
              },
              {
                title: "Can I edit existing images?",
                description: "Yes! Our image editor allows you to enhance, modify, and transform existing images using AI-powered tools. Upload any image and apply various effects and modifications."
              },
              {
                title: "How many images can I generate for free?",
                description: "New users get free credits to try our image generation and editing tools. You can earn additional credits through our referral program or purchase credit packages for unlimited use."
              },
              {
                title: "What makes Nano Banana different?",
                description: "Nano Banana combines multiple AI models to deliver the best results. Our platform offers both image generation and advanced editing tools in one seamless interface, perfect for creators and businesses."
              },
              {
                title: "Can I use generated images commercially?",
                description: "Yes, images generated with Nano Banana can be used for commercial purposes. We provide full rights to the images you create, making it perfect for marketing, content creation, and business use."
              },
              {
                title: "How fast is the image generation?",
                description: "Most images are generated within 10-30 seconds depending on complexity and current server load. Our optimized infrastructure ensures quick turnaround times for all your creative needs."
              },
              {
                title: "Do you offer API access?",
                description: "We're working on API access for developers and businesses who want to integrate our AI image generation capabilities into their own applications. Contact us for early access information."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {faq.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Still have questions? We&apos;re here to help!
            </p>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        imageUrl={generatedImage || ''}
        title="Check out my AI-generated image!"
        description={description || "Created with EasyNanoBanana AI Image Generator"}
      />
    </div>
  );
}