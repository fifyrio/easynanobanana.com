'use client';

import { useState } from 'react';
import Button from './ui/Button';

export default function PromptAssistant() {
  const [activeTab, setActiveTab] = useState('text');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Photoreal');
  const [detailLevel, setDetailLevel] = useState('Basic');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');

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
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/prompt-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          tone,
          detailLevel,
          currentNegativePrompt: negativePrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance prompt');
      }

      const result = await response.json();
      setOptimizedPrompt(result.optimizedPrompt);
      setNegativePrompt(result.negativePrompt || negativePrompt);
      setExplanation(result.explanation || '');
      
      // Add to history
      setHistoryItems(prev => [result.optimizedPrompt, ...prev.slice(0, 9)]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance prompt');
      console.error('Prompt enhancement error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
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
            Analyze an image
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
        {/* Description Input */}
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
        <div className="flex justify-center">
          <Button 
            onClick={handleGeneratePrompt}
            disabled={isGenerating || !description.trim()}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-3 font-medium"
          >
            {isGenerating ? 'Generating...' : 'Enhance Prompt'}
          </Button>
        </div>
      </div>

      {/* Generated Prompt Result */}
      {optimizedPrompt && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Prompt</h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap">{optimizedPrompt}</p>
          </div>
          
          <div className="flex gap-3 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(optimizedPrompt)}
            >
              Copy Prompt
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(negativePrompt)}
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
                    onClick={() => copyToClipboard(prompt.title)}
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
                  onClick={() => copyToClipboard(item)}
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