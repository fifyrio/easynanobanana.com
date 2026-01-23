'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import Header from './common/Header';
import { useTranslations } from 'next-intl';

export default function AiObjectRemoval() {
  const t = useTranslations('aiObjectRemoval');
  const { user, profile, refreshProfile } = useAuth();
  const [prompt, setPrompt] = useState('Remove the specified object from the image while seamlessly filling in the background. Maintain natural lighting, shadows, and textures to create a clean, realistic result.');
  const [objectToRemove, setObjectToRemove] = useState('');

  // Display preview (base64)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // File object for upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Uploaded R2 URL
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  const creditsRequired = 3;

  // Gallery placeholder data - using action figure images as placeholder for now
  const galleryImages = [
    { before: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/object-removal/samples/1-before.webp`, after: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/object-removal/samples/1-after.webp` },
    { before: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/object-removal/samples/2-before.webp`, after: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/object-removal/samples/2-after.webp` },    
  ];

  const nextGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const previousGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadedImage(null);
      setUploadedFile(null);
      setUploadedImageUrl(null);
      return;
    }

    // Read as data URL for preview display
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Store the file object for later upload
    setUploadedFile(file);
    setUploadedImageUrl(null);
  };

  const handleGenerate = async () => {
    if (activeTab === 'upload' && !uploadedImage) {
      setError(t('error.upload'));
      return;
    }
    if (activeTab === 'text' && !prompt.trim()) {
      setError(t('error.description'));
      return;
    }
    if (!objectToRemove.trim()) {
      setError(t('error.specify'));
      return;
    }

    if (!user) {
      setError(t('error.signIn'));
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(t('error.credits', { required: creditsRequired }));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Step 1: Upload image to R2 if in upload mode and not already uploaded
      let imageUrl = uploadedImageUrl;
      if (activeTab === 'upload') {
        if (!imageUrl) {
          if (!uploadedFile) {
            setError('No file selected');
            return;
          }

          console.log('Uploading image to R2...');
          const formData = new FormData();
          formData.append('file', uploadedFile);

          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.json();
            setError('Failed to upload image: ' + (uploadError.error || 'Unknown error'));
            return;
          }

          const { imageUrl: newImageUrl } = await uploadResponse.json();
          if (!newImageUrl) {
            setError('Failed to upload image: Missing image URL');
            return;
          }
          imageUrl = newImageUrl;
          setUploadedImageUrl(newImageUrl);
          console.log('Image uploaded to R2:', newImageUrl);
        }
      }

      // Step 2: Generate image with KIE API
      let finalPrompt = '';
      if (activeTab === 'upload') {
        finalPrompt = `Remove the "${objectToRemove}" from the image while seamlessly filling in the background. Maintain natural lighting, shadows, and textures to create a clean, realistic result without any trace of the removed object.`;
      } else {
        finalPrompt = `${prompt} Remove the "${objectToRemove}" from the scene.`;
      }

      const imageUrls = activeTab === 'upload' && imageUrl ? [imageUrl] : [];

      console.log('Starting image generation task...');
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrls,
        }),
      });

      console.log('Response received, status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        if (response.status === 401) {
          setError(t('error.signIn'));
        } else if (response.status === 402) {
          setError(t('error.credits', { required: data.required }));
        } else if (response.status === 503) {
          setError(data.message || 'Service temporarily unavailable. Please try again in a moment.');
        } else {
          setError(data.error || 'Failed to remove object');
        }
        return;
      }

      // Step 3: Poll for task completion
      const taskId = data.taskId;
      if (!taskId) {
        setError('No task ID received. Please try again.');
        return;
      }

      console.log('Task created, polling for completion:', taskId);

      // Poll every 10 seconds, max 600 seconds (30 attempts)
      const maxAttempts = 30;
      const pollInterval = 5000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(`/api/kie/task-status?taskId=${taskId}`);
        if (!statusResponse.ok) {
          console.error('Failed to check task status');
          continue;
        }

        const statusData = await statusResponse.json();
        console.log(`Poll attempt ${attempt}/${maxAttempts}, status:`, statusData.status);

        if (statusData.status === 'completed') {
          if (statusData.resultUrls && statusData.resultUrls.length > 0) {
            console.log('Task completed! Image URL:', statusData.resultUrls[0]);
            setGeneratedImage(statusData.resultUrls[0]);
            setDescription('Object removed successfully');
            await refreshProfile(); // Refresh credits
            return; // Success!
          } else {
            setError('Image generation completed but no result URL found.');
            return;
          }
        }

        if (statusData.status === 'failed') {
          setError(statusData.error || 'Image generation failed. Please try again.');
          return;
        }

        // Status is still 'pending' or 'processing', continue polling
      }

      // Timeout after max attempts
      setError('Image generation is taking longer than expected. Please check back later.');
    } catch (err: any) {
      console.error('Error removing object:', err);

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. The server may be busy, please try again.');
      } else {
        setError('Failed to remove object. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-center py-12 bg-white">
        <div className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
          {t('hero.badge')}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto px-4">
          {t('hero.subtitle')}
        </p>
      </div>

      {/* Main Interface */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Object Removal Studio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">{t('input.title')}</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">{t('input.subtitle')}</p>
            </div>
            
            <div className="p-6">
              {/* Upload Photo Section */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  {t('input.upload.label')}
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer block">
                    {uploadedImage ? (
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-24 h-24 object-cover rounded-lg mx-auto mb-3"
                      />
                    ) : (
                      <div className="w-12 h-12 mx-auto mb-3">
                        <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    )}
                    <p className="text-gray-600 text-sm mb-1">
                      {t('input.upload.placeholder')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('input.upload.format')}
                    </p>
                  </label>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  {t('input.upload.help')}
                </p>
              </div>

              {/* Object to Remove Input */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  {t('input.object.label')}
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  value={objectToRemove}
                  onChange={(e) => setObjectToRemove(e.target.value)}
                  placeholder={t('input.object.placeholder')}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {t('input.object.help')}
                </p>
              </div>

              {/* Object Removal Style Description */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  {t('input.instructions.label')}
                </label>
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {t('input.instructions.help')}
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Credits Info */}
              {user && profile && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className="mr-2">💎</span>
                      <span className="text-yellow-700">
                        {t.rich('input.credits.available', {
                          amount: profile.credits || 0,
                          strong: (chunks) => <strong>{chunks}</strong>
                        })}
                      </span>
                    </div>
                    <span className="text-yellow-600 text-xs">
                      {t('input.credits.cost', { amount: creditsRequired })}
                    </span>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !user || !profile || (profile.credits || 0) < creditsRequired || !objectToRemove.trim()}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('input.button.generating')}
                  </span>
                ) : !user ? (
                  t('input.button.signIn')
                ) : !profile ? (
                  t('input.button.loading')
                ) : (profile.credits || 0) < creditsRequired ? (
                  t('input.button.credits')
                ) : !objectToRemove.trim() ? (
                  t('input.button.enterObject')
                ) : (
                  t('input.button.generate')
                )}
              </Button>

              {!uploadedImage && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-center">
                  <span className="text-xs text-red-600">
                    {t('input.upload.empty')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Results Gallery */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">{t('result.title')}</h2>
              </div>
            </div>

            <div className="p-6">
              {generatedImage ? (
                <div className="space-y-4">
                  {/* Generated Image */}
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={generatedImage} 
                      alt="Object Removed" 
                      className="w-full h-auto"
                    />
                  </div>
                  
                  {/* Description */}
                  {description && (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700">
                        <strong>{t('result.enhanced')}</strong> {description}
                      </p>
                    </div>
                  )}

                  {/* Download and Share */}
                  <div className="space-y-3">
                    <FreeOriginalDownloadButton
                      imageUrl={generatedImage}
                      filename={`object-removed-${Date.now()}.png`}
                      className="text-sm"
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowShareModal(true)}
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      {t('result.share')}
                    </Button>
                  </div>

                  <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      {t('result.success')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sample Gallery */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                      <img 
                        src={galleryImages[currentGalleryIndex].before} 
                        alt="Before object removal"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {t('result.placeholder.before')}
                      </div>
                    </div>
                    <div className="relative bg-gray-200 rounded-lg aspect-square overflow-hidden">
                      <img 
                        src={galleryImages[currentGalleryIndex].after} 
                        alt="After object removal"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {t('result.placeholder.after')}
                      </div>
                    </div>
                  </div>                  

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-4">
                    <button 
                      onClick={previousGalleryImage}
                      className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                      {t('result.placeholder.prev')}
                    </button>
                    <div className="flex space-x-2">
                      {galleryImages.map((_, index) => (
                        <div 
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentGalleryIndex ? 'bg-yellow-400' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={nextGalleryImage}
                      className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                    >
                      {t('result.placeholder.next')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-wide text-yellow-600 font-semibold mb-2">
              {t('features.badge')}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 - Smart Detection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.cards.1.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('features.cards.1.desc')}
              </p>
            </div>

            {/* Feature 2 - Seamless Background Fill */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.cards.2.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('features.cards.2.desc')}
              </p>
            </div>

            {/* Feature 3 - High Quality Results */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.cards.3.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('features.cards.3.desc')}
              </p>
            </div>

            {/* Feature 4 - Fast Processing */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.cards.4.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('features.cards.4.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-wide text-yellow-600 font-semibold mb-2">
              {t('howTo.badge')}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('howTo.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('howTo.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl font-bold text-yellow-700">01</div>
              </div>
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t('howTo.steps.1.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('howTo.steps.1.desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl font-bold text-yellow-700">02</div>
              </div>
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t('howTo.steps.2.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('howTo.steps.2.desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl font-bold text-yellow-700">03</div>
              </div>
              <div className="w-16 h-16 bg-yellow-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t('howTo.steps.3.title')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('howTo.steps.3.desc')}
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 text-lg">
              {t('howTo.cta')}
            </Button>
          </div>
        </div>
      </section>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        imageUrl={generatedImage || ''}
        title="Check out my clean photo with objects removed!"
        description="Created with EasyNanoBanana AI Object Removal"
      />
      </div>
    </>
  );
}