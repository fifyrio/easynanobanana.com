'use client';

import { useState } from 'react';
import Button from './ui/Button';

export default function ImageEditor() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [model, setModel] = useState('Nano V1');
  const [quality, setQuality] = useState('Standard');
  const [guidance, setGuidance] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gemini-2.0-flash'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      setDescription(data.description);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
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
      title: "A hyperrealistic portrait of a cyborg banana.",
      image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop&crop=center",
      prompt: "Try it"
    },
    {
      title: "An impressionist painting of a banana plantation at sunrise",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&crop=center", 
      prompt: "Try it"
    },
    {
      title: "3D render of a banana character wearing sunglasses",
      image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=300&h=200&fit=crop&crop=center",
      prompt: "Try it"
    }
  ];

  const userCreations = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1494790108755-2616c88d4c36?w=150&h=150&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=150&h=150&fit=crop&crop=center"
  ];

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
                className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="Standard">Standard</option>
                  <option value="High">High</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seed</label>
                <input 
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. 12345"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Guidance</label>
              <div className="px-3">
                <input
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

            <div className="flex space-x-3">
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
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
                ) : 'Generate'}
              </Button>
              <a 
                href="/prompt-assistant"
                className="px-4 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center transition-colors"
                title="AI Prompt Assistant"
              >
                <i className="ri-magic-line text-xl"></i>
              </a>
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
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    Share
                  </Button>
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
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-3">&quot;{sample.title}&quot;</p>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {sample.prompt}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Creations */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Creations</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {userCreations.map((creation, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden aspect-square">
              <img 
                src={creation} 
                alt={`Creation ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}