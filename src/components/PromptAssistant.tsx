'use client';

import { useState } from 'react';
import Button from './ui/Button';

export default function PromptAssistant() {
  const [activeTab, setActiveTab] = useState('text');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Photoreal');
  const [detailLevel, setDetailLevel] = useState('Basic');
  const [negativePrompt, setNegativePrompt] = useState('');

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

  const historyItems = [
    "A photorealistic image of a dog wearing a hat",
    "A cinematic image of a city at night",
    "A painterly image of a landscape",
    "A photorealistic image of a person smiling"
  ];

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
      </div>

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
                  {prompt.actions.map((action) => (
                    <button
                      key={action}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
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
              <span className="text-gray-700">{item}</span>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
              >
                Open in Editor
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}