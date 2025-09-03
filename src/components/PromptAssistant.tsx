'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from './ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
import toast from 'react-hot-toast';

export default function PromptAssistant() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('text');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Photoreal');
  const [detailLevel, setDetailLevel] = useState('Basic');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  
  // Image analysis states
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const creditsRequired = config.credits.promptEnhancement;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image upload handlers
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    setUploadedImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    
    // Clear previous results when new image is uploaded
    setOptimizedPrompt('');
    setNegativePrompt('');
    setExplanation('');
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    } else {
      toast.error('Please drop a valid image file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const toneOptions = [
    { name: 'Photoreal', active: true },
    { name: 'Cinematic', active: false },
    { name: 'Painterly', active: false }
  ];

  const detailOptions = [
    { name: 'Basic', active: true },
    { name: 'Rich', active: false }
  ];

  const optimizedPrompts = [
    {
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=200&fit=crop&crop=center",
      title: "A photorealistic image of a cat wearing sunglasses",
      actions: ['Copy', 'Favorite', 'Open in Editor']
    },
    {
      image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&h=200&fit=crop&crop=center", 
      title: "A photorealistic image of a cat with sunglasses",
      actions: ['Copy', 'Favorite', 'Open in Editor']
    },
    {
      image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=300&h=200&fit=crop&crop=center",
      title: "A photorealistic image of a cat in sunglasses", 
      actions: ['Copy', 'Favorite', 'Open in Editor']
    }
  ];

  const [historyItems, setHistoryItems] = useState([
    "A photorealistic image of a dog wearing a hat",
    "A cinematic image of a city at night",
    "A painterly image of a landscape",
    "A photorealistic image of a person smiling"
  ]);

  const handleGeneratePrompt = async () => {
    // Validate input based on active tab
    if (activeTab === 'text' && !description.trim()) {
      setError('Please enter a description');
      return;
    }
    
    if (activeTab === 'image' && !uploadedImage) {
      setError('Please upload an image');
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast.error('Please sign in to enhance prompts. Redirecting...');
      setTimeout(() => router.push('/pricing'), 1500);
      return;
    }

    // Check if user has enough credits
    if (!profile || profile.credits < creditsRequired) {
      toast.error('Insufficient credits. Redirecting to pricing...');
      setTimeout(() => router.push('/pricing'), 1500);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      
      let response;
      
      if (activeTab === 'text') {
        // Text-based prompt enhancement
        response = await fetch('/api/prompt-enhance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            description,
            tone,
            detailLevel,
            currentNegativePrompt: negativePrompt,
          }),
        });
      } else {
        // Image-based prompt generation
        const formData = new FormData();
        formData.append('image', uploadedImage!);
        formData.append('tone', tone);
        formData.append('detailLevel', detailLevel);
        
        response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error('Please sign in to enhance prompts. Redirecting...');
          setTimeout(() => router.push('/pricing'), 1500);
        } else if (response.status === 402) {
          toast.error('Insufficient credits. Redirecting to pricing...');
          setTimeout(() => router.push('/pricing'), 1500);
        } else {
          throw new Error(errorData.error || 'Failed to enhance prompt');
        }
        return;
      }

      const result = await response.json();
      setOptimizedPrompt(result.optimizedPrompt);
      setNegativePrompt(result.negativePrompt || negativePrompt);
      setExplanation(result.explanation || '');
      
      // If image analysis, populate the description textarea for further editing
      if (activeTab === 'image') {
        setDescription(result.optimizedPrompt);
        // Switch to text tab to allow further editing
        setActiveTab('text');
        toast.success(`${result.creditsUsed} credits deducted. Image analyzed! Prompt added to text editor.`);
      } else {
        toast.success(`${result.creditsUsed} credits deducted. Prompt enhanced!`);
      }
      
      // Add to history
      setHistoryItems(prev => [result.optimizedPrompt, ...prev.slice(0, 9)]);
      
      // Refresh profile
      await refreshProfile();
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to enhance prompt';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Prompt enhancement error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const message = type ? `${type} copied to clipboard!` : 'Copied to clipboard!';
      toast.success(message);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Prompt Assistant
        </h1>
        <p className="text-gray-600 text-lg">
          Lowering the prompt barrier for you
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'text'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('text')}
          >
            Describe with text
          </button>
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'image'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('image')}
          >
            Describe with an image
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        {activeTab === 'text' ? (
          /* Text Description Input */
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your goal in plain words...
            </label>
            <textarea
              className="w-full h-24 p-4 border border-gray-200 rounded-lg resize-none text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="e.g., A golden retriever puppy playing in a field of sunflowers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        ) : (
          /* Image Upload Section */
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload an image to analyze...
            </label>
            {!imagePreview ? (
              <div 
                className={`w-full h-48 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
              >
                <div className="mb-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Drag & drop an image here
                </h3>
                <p className="text-gray-600 text-sm">
                  or click to upload from your device
                </p>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Uploaded" 
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setImagePreview(null);
                    if (imagePreview) {
                      URL.revokeObjectURL(imagePreview);
                    }
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tone</label>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.name}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tone === option.name
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                  onClick={() => setTone(option.name)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Detail Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Detail Level</label>
            <div className="flex flex-wrap gap-2">
              {detailOptions.map((option) => (
                <button
                  key={option.name}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    detailLevel === option.name
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                  onClick={() => setDetailLevel(option.name)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Negative Prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Negative prompt (optional)
          </label>
          <textarea
            className="w-full h-20 p-4 border border-gray-200 rounded-lg resize-none text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            placeholder="e.g., blurry, cartoon, ugly, text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
          />
        </div>

        {/* Generate Button */}
        <div className="flex flex-col items-center space-y-3">
          {user && profile && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Available Credits: <span className="font-medium text-gray-900">{profile.credits}</span></span>
              <span className="text-gray-300">•</span>
              <span>Cost: <span className="font-medium text-blue-600">{creditsRequired} credits</span></span>
            </div>
          )}
          <Button 
            onClick={handleGeneratePrompt}
            disabled={
              isGenerating || 
              (activeTab === 'text' && !description.trim()) ||
              (activeTab === 'image' && !uploadedImage) ||
              (user && profile && profile.credits < creditsRequired)
            }
            className={`px-8 py-3 font-medium flex items-center space-x-2 ${
              user && profile && profile.credits < creditsRequired
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <span>{activeTab === 'text' ? 'Enhancing...' : 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <span>{activeTab === 'text' ? 'Enhance Prompt' : 'Analyze Image'}</span>
                {user && profile && (
                  <span className="ml-2 px-2 py-1 bg-white/20 rounded text-xs">
                    -{creditsRequired} credits
                  </span>
                )}
              </>
            )}
          </Button>
          {!user && (
            <p className="text-sm text-gray-500 text-center">
              Sign in to use {activeTab === 'text' ? 'prompt enhancement' : 'image analysis'} feature
            </p>
          )}
        </div>
      </div>

      {/* Generated Prompt Result */}
      {optimizedPrompt && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {activeTab === 'text' ? 'Enhanced Prompt' : 'Generated Prompt from Image'}
          </h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap">{optimizedPrompt}</p>
          </div>
          
          <div className="flex gap-3 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(optimizedPrompt, 'Prompt')}
            >
              Copy Prompt
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(negativePrompt, 'Negative prompt')}
              disabled={!negativePrompt}
            >
              Copy Negative
            </Button>
          </div>
          
          {explanation && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>Enhancement explanation:</strong> {explanation}
            </div>
          )}
        </div>
      )}

      {/* Optimized Prompts */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Optimized Prompts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {optimizedPrompts.map((prompt, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <img 
                src={prompt.image} 
                alt={prompt.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-4">{prompt.title}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    onClick={() => copyToClipboard(prompt.title, 'Prompt')}
                  >
                    Copy
                  </button>
                  <button
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    onClick={() => setDescription(prompt.title)}
                  >
                    Use as Input
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">History</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {historyItems.map((item, index) => (
            <div 
              key={index} 
              className={`flex justify-between items-center p-4 ${
                index !== historyItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="text-gray-700 flex-1 mr-4">{item}</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => copyToClipboard(item, 'Prompt')}
                >
                  Copy
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setDescription(item)}
                >
                  Use as Input
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}