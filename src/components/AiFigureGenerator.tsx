'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';

export default function AiFigureGenerator() {
  const { user, profile, refreshProfile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  
  const creditsRequired = 5;

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
        finalPrompt = "Create a realistic 1/7 scale PVC action figure based on the character in the photo. The figure is placed on a round transparent acrylic base with no text, and sits on a computer desk in an indoor environment. Behind it, there's a BANDAI-style toy packaging box featuring a 2D illustration of the same character. On the nearby screen, show the ZBrush modeling process of this figure. Have a nanobanana.art text on the box.";
      } else {
        finalPrompt = `Create a realistic 1/7 scale PVC action figure: ${prompt}. The figure is placed on a round transparent acrylic base with no text, and sits on a computer desk in an indoor environment. Behind it, there's a BANDAI-style toy packaging box featuring a 2D illustration of the same character. On the nearby screen, show the ZBrush modeling process of this figure. Have a nanobanana.art text on the box.`;
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: 'gemini-2.0-flash'
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-50 to-yellow-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-yellow-600 font-semibold mb-2">
              AI Action Figure Generator
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Turn Your photo to AI action figure
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Use Nano Banana on nanobanana.art to make your own AI action figure, toy figure, or figurine
              from a selfie or a text prompt. Create boxes, accessories, and poses. Simple, fast, and free to
              start.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - AI Figure Studio */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-6 h-6 bg-yellow-400 rounded mr-3"></div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Figure Studio</h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">Photo → Action Figure</p>

                {/* Tab Buttons */}
                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'upload'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Upload Photo (Make Yourself an Action Figure)
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'text'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Text Description
                  </button>
                </div>

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                  <div className="mb-6">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-yellow-300 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="imageUpload"
                      />
                      <label htmlFor="imageUpload" className="cursor-pointer">
                        {uploadedImage ? (
                          <img
                            src={uploadedImage}
                            alt="Uploaded"
                            className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                          />
                        ) : (
                          <div className="mb-4">
                            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        )}
                        <p className="text-gray-600 mb-2">
                          {uploadedImage ? 'Click to change image' : 'Click or drag to upload photos for action figure creation'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Supports JPG, PNG, WebP formats, max 10MB each
                        </p>
                      </label>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Support uploading multiple images for editing, up to 5 images, max 10MB each
                    </p>
                  </div>
                )}

                {/* Text Tab */}
                {activeTab === 'text' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Figure Style Description *
                    </label>
                    <textarea
                      className="w-full h-24 p-4 border border-gray-200 rounded-lg resize-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Create a realistic 1/7 scale PVC figurine based on the character in the photo. The figure is placed on a round transparent acrylic base with no text..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Tell us the look, outfit, box design, and accessories for your figure
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">⚠️</span>
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* Credits Info */}
                {user && profile && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
                    <div className="flex items-center justify-between">
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
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !user || !profile || (profile.credits || 0) < creditsRequired}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-4 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Action Figures (Free)
                    </span>
                  ) : !user ? (
                    'Sign In to Generate'
                  ) : !profile ? (
                    'Loading...'
                  ) : (profile.credits || 0) < creditsRequired ? (
                    'Insufficient Credits'
                  ) : (
                    `✨ Start Creating Action Figures (Free)`
                  )}
                </Button>

                <p className="text-xs text-red-500 text-center">
                  ⚠ Please upload a photo to transform into an action figure
                </p>
              </div>
            </div>

            {/* Right Side - Action Figure Gallery */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-6 h-6 bg-yellow-400 rounded mr-3"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Action Figure Gallery</h2>
                </div>

                {generatedImage ? (
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={generatedImage} 
                        alt="Generated Action Figure" 
                        className="w-full h-auto"
                      />
                    </div>
                    
                    {description && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Description:</strong> {description}
                        </p>
                      </div>
                    )}

                    {/* Download and Share Options */}
                    <div className="space-y-3">
                      <FreeOriginalDownloadButton
                        imageUrl={generatedImage}
                        filename={`action-figure-${Date.now()}.png`}
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

                    <p className="text-xs text-center text-gray-500">
                      Transform portrait into a detailed action figure with articulated joints and accessories
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zM8 8v8M12 8v8M16 8v8" />
                        </svg>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4 opacity-40">
                      <div className="bg-gray-200 h-20 rounded"></div>
                      <div className="bg-gray-200 h-20 rounded"></div>
                      <div className="bg-gray-200 h-20 rounded"></div>
                      <div className="bg-gray-200 h-20 rounded"></div>
                    </div>
                    <p className="text-gray-600 mb-2">Generated action figure will appear here</p>
                    <p className="text-sm text-gray-500">Upload a photo or enter a description to create your action figure</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-wide text-yellow-600 font-semibold mb-2">
              FEATURES
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Powerful, Simple, and Free to Start
            </h2>
            <p className="text-lg text-gray-600">
              One streamlined tool for photo-to-action-figure and text-to-action-figure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Instant Photo to AI Action Figure */}
            <div>
              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop"
                  alt="Photo to Action Figure Process" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Instant Photo to AI Action Figure
              </h3>
              <p className="text-gray-600 mb-6">
                Upload a selfie or portrait and instantly turn yourself into an action figure. Our AI action figure generator works like a magic wand. Simply snap a photo, upload it, and watch as our magic gets a high pose, and get a collectible 3D-style render. Perfect for anyone searching "make action figure of myself", "my action figure AI" or "how to make an AI action figure" — fast, simple, and free to start!
              </p>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                Make Your Own Action Figure (Free) →
              </Button>
            </div>

            {/* Create AI Action Figure from Text */}
            <div>
              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop"
                  alt="Text to Action Figure Process" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Create AI Action Figure from Text
              </h3>
              <p className="text-gray-600 mb-6">
                Don't have a photo? Type a prompt like "cyberpunk hero with glowing sword" or "WWE champion with belt," and the action figure image generator will create a complete AI-generated action figure. Ideal for queries like "create action figure AI", "action figure creator", and "chatgpt action figure generator".
              </p>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                Create Action Figure AI Now →
              </Button>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-16">
            <div>
              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop"
                  alt="Action Figure Packaging" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI Action Figure Packaging & Accessories
              </h3>
              <p className="text-gray-600 mb-6">
                Design blister packs, window boxes, logos, card backs, stands, weapons, pets, and alternate heads — all inside the AI toy figure generator. Go beyond a single render and make store-ready mockups for collectors or merch.
              </p>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                Design Boxes & Accessories →
              </Button>
            </div>

            <div>
              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop"
                  alt="Download High-Res Action Figures" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Download High-Res AI Action Figures
              </h3>
              <p className="text-gray-600 mb-6">
                Export PNG/JPG in high resolution for social posts, posters, or as reference for 3D printing. Free users can download one figure at a time; Pro unlocks batch creation and commercial rights. Covers high-intent needs like "free action figure generators", "get your own action figure", and "make yourself into an action figure".
              </p>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                Download Your AI Action Figure →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-wide text-yellow-600 font-semibold mb-2">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              How to Make an AI Action Figure (3 Steps)
            </h2>
            <p className="text-lg text-gray-600">
              No 3D skills needed — the AI action figure generator handles it for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-yellow-100 rounded-lg p-8 mb-6">
                <div className="text-2xl font-bold text-yellow-800 mb-4">01</div>
                <div className="w-24 h-24 bg-yellow-200 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Upload or Describe
              </h3>
              <p className="text-gray-600">
                Add a selfie or type a prompt like "WWE champion with entrance gear" or "retro arcade hero."
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-yellow-100 rounded-lg p-8 mb-6">
                <div className="text-2xl font-bold text-yellow-800 mb-4">02</div>
                <div className="w-24 h-24 bg-yellow-200 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Customize & Preview
              </h3>
              <p className="text-gray-600">
                Pick styles, colors, poses, and packaging. Watch your AI action figure update live.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-yellow-100 rounded-lg p-8 mb-6">
                <div className="text-2xl font-bold text-yellow-800 mb-4">03</div>
                <div className="w-24 h-24 bg-yellow-200 rounded-lg mx-auto flex items-center justify-center">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Download & Share
              </h3>
              <p className="text-gray-600">
                Get high-res PNG/JPG. Post it, print it, or use it for merch mockups.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3">
              Turn Photo To Action Figure Now →
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              You Might Also Be Interested In
            </h2>
            <p className="text-lg text-gray-600">
              Curious to learn more about bringing your imagination to life? Explore these
              common questions and discover how nanobanana.art makes creating your own
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
                description: "nanobanana.art is not just an action figure creator; it's a versatile ai toy figure generator that lets you design all..."
              },
              {
                title: "ai action figure generator chatgpt free",
                description: "Experience the power of advanced AI with our ai action figure generator, powered by intelligence similar to..."
              },
              {
                title: "ai action figure generator prompt",
                description: "Unleash your creativity with the perfect ai action figure generator prompt! At nanobanana.art, your prompt is the..."
              },
              {
                title: "can you make your own action figure",
                description: "Yes, you absolutely can make your own action figure with nanobanana.art! We've made the process incredibly..."
              },
              {
                title: "ai action figure generator trend",
                description: "The ai action figure generator trend is booming, and nanobanana.art is at the forefront of this exciting wave!..."
              },
              {
                title: "how do i make my own action figures",
                description: "Making your own action figures with nanobanana.art is surprisingly easy and fun! Here's a simple guide to get..."
              },
              {
                title: "ai action figure generator in box",
                description: "What makes nanobanana.art's ai action figure generator truly special is that it doesn't just create the figure itself..."
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
              Loved by creators and teams
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
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
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
  );
}