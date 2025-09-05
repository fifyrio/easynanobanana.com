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
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [model, setModel] = useState('Nano V1');
  const [quality, setQuality] = useState('Standard');
  const [guidance, setGuidance] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const creditsRequired = 5;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Check if user is logged in
    if (!user) {
      setError('Please sign in to generate images');
      return;
    }

    // Check if user has enough credits
    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(`Insufficient credits. You need ${creditsRequired} credits to generate an image.`);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          model: 'gemini-2.0-flash'
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
      
      // Refresh user profile to update credits display
      await refreshProfile();
      
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickPresets = [
    { name: 'Anime', active: false },
    { name: 'Realistic', active: true },
    { name: 'Illustration', active: false },
    { name: 'Product', active: false },
    { name: 'Portrait', active: false }
  ];

  const sampleImages = [
    {
      title: "Professional headshot for LinkedIn profile, studio lighting, business attire",
      image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/1.webp`,
      prompt: "Professional headshot for LinkedIn profile, studio lighting, business attire"
    },
    {
      title: "Modern minimalist logo design for tech startup, clean geometric shapes",
      image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/2.webp`,
      prompt: "Modern minimalist logo design for tech startup, clean geometric shapes"
    },
    {
      title: "Product mockup of smartphone on wooden desk with natural lighting",
      image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/ImageEditor/sampleImages/3.webp`,
      prompt: "Product mockup of smartphone on wooden desk with natural lighting"
    }
  ];

  const handleTryPrompt = (promptText: string) => {
    setPrompt(promptText);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Input Area */}
        <div className="lg:col-span-2">
          {/* Prompt Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <textarea
                className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="🍌 A playful banana logo in a minimalist style..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* Quick Presets */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Presets:</h3>
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.name}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      preset.active
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                <select 
                  id="aspectRatio"
                  name="aspectRatio"
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                >
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="4:3">4:3</option>
                  <option value="3:2">3:2</option>
                </select>
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select 
                  id="model"
                  name="model"
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="Nano V1">Nano V1</option>
                  <option value="Nano V2">Nano V2</option>
                  <option value="Nano Pro">Nano Pro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                <select 
                  id="quality"
                  name="quality"
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="Standard">Standard</option>
                  <option value="High">High</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label htmlFor="seed" className="block text-sm font-medium text-gray-700 mb-2">Seed</label>
                <input 
                  id="seed"
                  name="seed"
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. 12345"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="guidance" className="block text-sm font-medium text-gray-700 mb-2">Guidance</label>
              <div className="px-3">
                <input
                  id="guidance"
                  name="guidance"
                  type="range"
                  min="1"
                  max="20"
                  value={guidance}
                  onChange={(e) => setGuidance(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(guidance/20)*100}%, #e5e7eb ${(guidance/20)*100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </div>

            {/* Credits Info and Error Display */}
            <div className="mb-4">
              {user && profile && (
                <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">💎</span>
                    <span className="text-sm text-yellow-700">
                      You have <strong>{profile.credits || 0}</strong> credits
                    </span>
                  </div>
                  <span className="text-xs text-yellow-600">
                    Generation cost: {creditsRequired} credits
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
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !user || !profile || (profile.credits || 0) < creditsRequired}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-4 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : !user ? 'Sign In to Generate' : !profile ? 'Loading...' : (profile.credits || 0) < creditsRequired ? 'Insufficient Credits' : `Generate (${creditsRequired} credits)`}
              </Button>
              
            </div>
          </div>
        </div>

        {/* Right Side - Result Area */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            {generatedImage ? (
              <div className="space-y-4">
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
                {/* Download and Share Options */}
                <div className="space-y-3">
                  {/* Original Quality Download (Free) */}
                  <FreeOriginalDownloadButton
                    imageUrl={generatedImage}
                    filename={`generated-original-${Date.now()}.png`}
                    className="text-sm"
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowShareModal(true)}
                      className="flex-1 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <div className="mb-4">
                  <i className="ri-image-line text-4xl text-gray-400"></i>
                </div>
                <p className="text-gray-600 mb-2">Generated image will appear here</p>
                <p className="text-sm text-gray-500">Enter a prompt and click Generate to create an image</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sample Images */}
      <div className="mt-12">
        <p className="text-center text-gray-600 mb-6">
          No signup required for low-res outputs. Here are some samples:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {sampleImages.map((sample, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <img 
                src={sample.image} 
                alt={sample.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-3">&quot;{sample.title}&quot;</p>
                <Button 
                  size="sm" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={() => handleTryPrompt(sample.prompt)}
                >
                  Try it
                </Button>
              </div>
            </div>
          ))}
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
              Still have questions? We're here to help!
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