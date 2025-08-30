'use client';

import { useState } from 'react';

export default function TemplateGallery() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStyle, setSelectedStyle] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  const filters = {
    categories: ['All', 'ID Photo', 'E-commerce', 'Avatar', 'Social Media', 'Marketing'],
    styles: ['All', 'Professional', 'Creative', 'Minimalist', 'Modern'],
    difficulties: ['All', 'Beginner', 'Intermediate', 'Advanced']
  };

  const trendingTemplates = [
    {
      title: 'ID Photo',
      subtitle: 'Professional ID photos',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=center',
      category: 'ID Photo'
    },
    {
      title: 'E-commerce',
      subtitle: 'Product listings',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop&crop=center',
      category: 'E-commerce'
    },
    {
      title: 'Avatar',
      subtitle: 'Unique avatars',
      image: 'https://images.unsplash.com/photo-1494790108755-2616c88d4c36?w=300&h=400&fit=crop&crop=center',
      category: 'Avatar'
    },
    {
      title: 'Social Media',
      subtitle: 'Engaging posts',
      image: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=300&h=400&fit=crop&crop=center',
      category: 'Social Media'
    },
    {
      title: 'Marketing',
      subtitle: 'Marketing materials',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=400&fit=crop&crop=center',
      category: 'Marketing'
    }
  ];

  const newTemplates = [
    {
      title: 'Vintage Poster',
      subtitle: 'Classic retro design',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=250&fit=crop&crop=center',
      category: 'Design'
    },
    {
      title: 'Neon Glow Text',
      subtitle: 'Bright and vibrant text effects',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=250&fit=crop&crop=center',
      category: 'Text Effects'
    }
  ];

  const allTemplates = [
    {
      title: 'Professional Headshot',
      subtitle: 'Create a professional headshot for your profile.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&h=300&fit=crop&crop=center',
      category: 'Professional'
    },
    {
      title: 'Product Listing for T-Shirt',
      subtitle: 'Generate a product listing image for a t-shirt.',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=250&h=300&fit=crop&crop=center',
      category: 'E-commerce'
    },
    {
      title: 'Avatar - Anime Style',
      subtitle: 'Design an anime-style avatar.',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=250&h=300&fit=crop&crop=center',
      category: 'Avatar'
    },
    {
      title: 'Social Media Post - Travel',
      subtitle: 'Create an engaging social media post for travel.',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=250&h=300&fit=crop&crop=center',
      category: 'Social Media'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Template Gallery
        </h1>
        <p className="text-gray-600 text-lg">
          Kickstart your creativity with our professionally designed templates.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select 
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {filters.categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Style Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Style:</label>
            <select 
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
            >
              {filters.styles.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Difficulty:</label>
            <select 
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              {filters.difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trending Templates */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Trending</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {trendingTemplates.map((template, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden">
                <img 
                  src={template.image} 
                  alt={template.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm">{template.title}</h3>
                <p className="text-xs text-gray-600">{template.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New This Week */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">New this week</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {newTemplates.map((template, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-[4/5] overflow-hidden">
                <img 
                  src={template.image} 
                  alt={template.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm">{template.title}</h3>
                <p className="text-xs text-gray-600">{template.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Templates */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {allTemplates.map((template, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-[4/5] overflow-hidden">
                <img 
                  src={template.image} 
                  alt={template.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1">{template.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.subtitle}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {template.category}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-lg">🎨</span>
          </div>
          <span className="text-lg font-medium text-gray-700">
            AI-powered image editor to generate and edit images with various tools and templates for your creative projects.
          </span>
        </div>
      </div>
    </div>
  );
}