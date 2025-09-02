'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import Button from './ui/Button';
import { removeImageBackground, replaceImageBackground, loadImageFromFile, downloadImage } from '@/lib/backgroundRemoval';

interface ProcessedImage {
  original: string;
  processed: string;
  originalFile?: File;
}

export default function BackgroundRemover() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [settings, setSettings] = useState({
    refineEdge: false,
    hairDetail: false,
    shadow: true
  });
  const [background, setBackground] = useState('transparent');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backgroundOptions = useMemo(() => [
    { id: 'transparent', name: 'Transparent', color: 'transparent', border: true },
    { id: 'white', name: 'White', color: '#ffffff' },
    { id: 'yellow', name: 'Yellow', color: '#fbbf24' },
    { id: 'none', name: 'None', color: 'transparent', striped: true }
  ], []);

  const processImageWithBackground = useCallback(async (imageFile: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const originalUrl = URL.createObjectURL(imageFile);
      
      let processedUrl: string;
      
      if (background === 'transparent') {
        // Use Replicate API for background removal, returns R2 URL
        processedUrl = await removeImageBackground(imageFile);
      } else if (background !== 'none') {
        const bgColor = backgroundOptions.find(bg => bg.id === background)?.color;
        if (bgColor && bgColor !== 'transparent') {
          // First remove background, then composite with color
          processedUrl = await replaceImageBackground(imageFile, bgColor);
        } else {
          processedUrl = await removeImageBackground(imageFile);
        }
      } else {
        processedUrl = originalUrl;
      }

      setUploadedImage({
        original: originalUrl,
        processed: processedUrl,
        originalFile: imageFile
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      console.error('Background removal error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [background, backgroundOptions]);

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
      processImageWithBackground(imageFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageWithBackground(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownload = (format: 'png' | 'jpg') => {
    if (!uploadedImage?.processed) return;
    
    const filename = `background-removed.${format}`;
    
    // For R2 URLs, create direct download link
    if (uploadedImage.processed.startsWith('http')) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = uploadedImage.processed;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For data URLs (legacy), use existing download function
      downloadImage(uploadedImage.processed, filename);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Background Remover
        </h1>
        <p className="text-gray-600 text-lg">
          Instantly create transparent backgrounds for your photos and product shots.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          {!uploadedImage && (
            <div className="mb-6">
              <div 
                className={`bg-white rounded-xl shadow-sm border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="mb-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Drag & drop an image here
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  or click the button below to upload
                </p>
                <Button 
                  onClick={handleUploadClick}
                  disabled={isProcessing}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 font-medium"
                >
                  {isProcessing ? 'Processing...' : 'Upload Image'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Result Preview - Always Visible */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Result Preview</h3>
            
            {isProcessing ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing image...</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Image Container with Slider */}
                <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200">
                  {/* Background Pattern for Transparency */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />
                  
                  {/* Demo or Uploaded Image */}
                  {uploadedImage ? (
                    <>
                      {/* Original Image (Right side) */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          clipPath: `polygon(${sliderPosition}% 0%, 100% 0%, 100% 100%, ${sliderPosition}% 100%)`
                        }}
                      >
                        <img 
                          src={uploadedImage.original} 
                          alt="Original" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      {/* Processed Image (Left side) */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`
                        }}
                      >
                        <img 
                          src={uploadedImage.processed} 
                          alt="Result" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Demo Images */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          clipPath: `polygon(${sliderPosition}% 0%, 100% 0%, 100% 100%, ${sliderPosition}% 100%)`
                        }}
                      >
                        <img 
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=center" 
                          alt="Demo Original" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div 
                        className="absolute inset-0"
                        style={{
                          clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`
                        }}
                      >
                        <img 
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=center" 
                          alt="Demo Result" 
                          className="w-full h-full object-cover opacity-90"
                          style={{ filter: 'brightness(1.1) contrast(1.1)' }}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Slider Line */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                    style={{ left: `${sliderPosition}%` }}
                  />
                  
                  {/* Slider Handle */}
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-gray-300 rounded-full shadow-lg cursor-pointer hover:border-blue-400 transition-colors"
                    style={{ left: `${sliderPosition}%` }}
                  />
                  
                  {/* Slider Input */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {/* Labels */}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                    {uploadedImage ? 'Result Image' : 'Demo Result'}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                    {uploadedImage ? 'Original Image' : 'Demo Original'}
                  </div>
                </div>
                
                {!uploadedImage && (
                  <div className="text-center mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-700 text-sm">
                      ✨ Try the slider above to see how background removal works, then upload your own image!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
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
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-700">Refine edge</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={settings.hairDetail}
                    onChange={(e) => setSettings({...settings, hairDetail: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-700">Hair detail</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={settings.shadow}
                    onChange={(e) => setSettings({...settings, shadow: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
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
                    onClick={() => {
                      setBackground(option.id);
                      if (uploadedImage?.originalFile) {
                        processImageWithBackground(uploadedImage.originalFile);
                      }
                    }}
                    disabled={isProcessing}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      background === option.id ? 'border-yellow-500 ring-2 ring-yellow-100' : 'border-gray-200'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-yellow-300'}`}
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
                  className="w-full flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100"
                  onClick={() => handleDownload('png')}
                  disabled={!uploadedImage || isProcessing}
                >
                  <span>PNG (Transparent)</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100"
                  onClick={() => handleDownload('jpg')}
                  disabled={!uploadedImage || isProcessing}
                >
                  <span>JPG (Solid)</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </Button>
                <Button 
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium mt-4"
                  disabled={!uploadedImage || isProcessing}
                >
                  Open in Image Editor
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>    
  );
}