'use client';

import { useState } from 'react';
import Button from './ui/Button';

export default function BackgroundRemover() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [settings, setSettings] = useState({
    refineEdge: false,
    hairDetail: false,
    shadow: true
  });
  const [background, setBackground] = useState('transparent');

  const backgroundOptions = [
    { id: 'transparent', name: 'Transparent', color: 'transparent', border: true },
    { id: 'white', name: 'White', color: '#ffffff' },
    { id: 'yellow', name: 'Yellow', color: '#fbbf24' },
    { id: 'none', name: 'None', color: 'transparent', striped: true }
  ];

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
    // Handle file drop
  };

  const sampleImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=600&fit=crop&crop=center";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Background Remover
        </h1>
        <p className="text-gray-600 text-lg">
          Instantly create transparent backgrounds for your photos and product shots.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          {!uploadedImage ? (
            <div 
              className={`bg-white rounded-xl shadow-sm border-2 border-dashed p-12 text-center transition-colors ${
                dragOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mb-6">
                <i className="ri-upload-cloud-2-line text-6xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drag & drop an image here
              </h3>
              <p className="text-gray-600 mb-6">
                or click the button below to upload
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Upload Image
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Result Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Original</h4>
                  <img src={sampleImage} alt="Original" className="w-full rounded-lg" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Result</h4>
                  <div 
                    className="w-full aspect-[4/5] rounded-lg flex items-center justify-center"
                    style={{
                      background: background === 'transparent' 
                        ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)'
                        : backgroundOptions.find(bg => bg.id === background)?.color || 'transparent',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  >
                    <img src={sampleImage} alt="Result" className="max-w-full max-h-full rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={settings.refineEdge}
                  onChange={(e) => setSettings({...settings, refineEdge: e.target.checked})}
                  className="w-4 h-4 text-yellow-400 bg-gray-100 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <span className="text-gray-700">Refine edge</span>
              </label>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={settings.hairDetail}
                  onChange={(e) => setSettings({...settings, hairDetail: e.target.checked})}
                  className="w-4 h-4 text-yellow-400 bg-gray-100 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <span className="text-gray-700">Hair detail</span>
              </label>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={settings.shadow}
                  onChange={(e) => setSettings({...settings, shadow: e.target.checked})}
                  className="w-4 h-4 text-yellow-400 bg-gray-100 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <span className="text-gray-700">Shadow</span>
              </label>
            </div>
          </div>

          {/* Background */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Background</h3>
            <div className="grid grid-cols-4 gap-3">
              {backgroundOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setBackground(option.id)}
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    background === option.id ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'
                  }`}
                  style={{
                    backgroundColor: option.color,
                    backgroundImage: option.striped ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%)' : undefined,
                    backgroundSize: option.striped ? '8px 8px' : undefined
                  }}
                  title={option.name}
                />
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full flex justify-between items-center text-left"
              >
                <span>PNG (Transparent)</span>
                <i className="ri-download-line"></i>
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex justify-between items-center text-left"
              >
                <span>JPG (Solid)</span>
                <i className="ri-download-line"></i>
              </Button>
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium mt-4">
                Open in Image Editor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center">
        <div className="flex items-center justify-center space-x-3 text-gray-500">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-lg">✨</span>
          </div>
          <span className="text-sm">
            Playful, clean, and professional AI image editing.
          </span>
        </div>
      </div>
    </div>
  );
}