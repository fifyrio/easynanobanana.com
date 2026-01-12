'use client';

import { useState, type ChangeEvent } from 'react';
import Header from './common/Header';
import Button from './ui/Button';
import FreeOriginalDownloadButton from './ui/FreeOriginalDownloadButton';
import ShareModal from './ui/ShareModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

const DEFAULT_PROMPT = 'Wear clothes from another image, keep face/hairstyle';

const SAMPLE_PAIRS = [
  {
    before: '/images/showcases/ai-clothes-changer/Features/1-before.webp',
    after: '/images/showcases/ai-clothes-changer/Features/1-after.webp',
    captionKey: '1'
  },
  {
    before: '/images/showcases/ai-clothes-changer/Features/2-before.webp',
    after: '/images/showcases/ai-clothes-changer/Features/2-after.webp',
    captionKey: '2'
  },
  {
    before: '/images/showcases/ai-clothes-changer/Features/3-before.webp',
    after: '/images/showcases/ai-clothes-changer/Features/3-after.webp',
    captionKey: '3'
  }
];

export default function AiClothesChanger() {
  const t = useTranslations('aiClothesChanger');
  const { user, profile, refreshProfile } = useAuth();

  // Display previews (base64)
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);

  // File objects for upload
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [outfitFile, setOutfitFile] = useState<File | null>(null);

  // Uploaded R2 URLs
  const [subjectImageUrl, setSubjectImageUrl] = useState<string | null>(null);
  const [outfitImageUrl, setOutfitImageUrl] = useState<string | null>(null);

  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [sampleIndex, setSampleIndex] = useState(0);

  const creditsRequired = 5;

  const handleUpload = (event: ChangeEvent<HTMLInputElement>, type: 'subject' | 'outfit') => {
    const file = event.target.files?.[0];
    if (!file) {
      if (type === 'subject') {
        setSubjectImage(null);
        setSubjectFile(null);
        setSubjectImageUrl(null);
      } else {
        setOutfitImage(null);
        setOutfitFile(null);
        setOutfitImageUrl(null);
      }
      return;
    }

    // Read as data URL for preview display
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (type === 'subject') {
        setSubjectImage(dataUrl);
      } else {
        setOutfitImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);

    // Store the file object for later upload
    if (type === 'subject') {
      setSubjectFile(file);
      setSubjectImageUrl(null);
    } else {
      setOutfitFile(file);
      setOutfitImageUrl(null);
    }
  };

  const handleGenerate = async () => {
    if (!subjectImage || !outfitImage) {
      setError(t('input.error.upload'));
      return;
    }

    if (!user) {
      setError(t('input.error.signIn'));
      return;
    }

    if (!profile || (profile.credits || 0) < creditsRequired) {
      setError(t('input.error.credits', { required: creditsRequired }));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Step 1: Upload subject image to R2 if not already uploaded
      let subjectUrl = subjectImageUrl;
      if (!subjectUrl) {
        if (!subjectFile) {
          setError('No subject file selected');
          return;
        }

        console.log('Uploading subject image to R2...');
        const formData = new FormData();
        formData.append('file', subjectFile);

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          setError('Failed to upload subject image: ' + (uploadError.error || 'Unknown error'));
          return;
        }

        const { imageUrl: newSubjectUrl } = await uploadResponse.json();
        if (!newSubjectUrl) {
          setError('Failed to upload subject image: Missing image URL');
          return;
        }
        subjectUrl = newSubjectUrl;
        setSubjectImageUrl(newSubjectUrl);
        console.log('Subject image uploaded to R2:', newSubjectUrl);
      }

      // Step 2: Upload outfit image to R2 if not already uploaded
      let outfitUrl = outfitImageUrl;
      if (!outfitUrl) {
        if (!outfitFile) {
          setError('No outfit file selected');
          return;
        }

        console.log('Uploading outfit image to R2...');
        const formData = new FormData();
        formData.append('file', outfitFile);

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          setError('Failed to upload outfit image: ' + (uploadError.error || 'Unknown error'));
          return;
        }

        const { imageUrl: newOutfitUrl } = await uploadResponse.json();
        if (!newOutfitUrl) {
          setError('Failed to upload outfit image: Missing image URL');
          return;
        }
        outfitUrl = newOutfitUrl;
        setOutfitImageUrl(newOutfitUrl);
        console.log('Outfit image uploaded to R2:', newOutfitUrl);
      }

      // Step 3: Generate image with KIE API using the uploaded URLs
      const finalPrompt = `${prompt}. Maintain the person's original face, skin tone, and hairstyle. Replace only the outfit, accessories, and fabrics based on the clothing reference photo. Keep lighting realistic and seamless.`;

      const imageUrls = [subjectUrl, outfitUrl];

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
          setError(t('input.error.signIn'));
        } else if (response.status === 402) {
          setError(t('input.error.credits', { required: data.required }));
        } else if (response.status === 503) {
          setError(data.message || 'Service temporarily unavailable. Please try again in a moment.');
        } else {
          setError(data.error || 'Failed to generate outfit swap.');
        }
        return;
      }

      // Step 4: Poll for task completion
      const taskId = data.taskId;
      if (!taskId) {
        setError('No task ID received. Please try again.');
        return;
      }

      console.log('Task created, polling for completion:', taskId);

      // Poll every 10 seconds, max 600 seconds (30 attempts)
      const maxAttempts = 30;
      const pollInterval = 10000;

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
            setDescription('Outfit changed successfully');
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
      console.error('Error generating clothes change:', err);

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. The server may be busy, please try again.');
      } else {
        setError('Failed to generate outfit swap. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-white py-12 text-center">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">{t('hero.badge')}</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('hero.title')}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto px-4">
            {t('hero.subtitle')}
          </p>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Input column */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">👗</span> {t('input.title')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{t('input.subtitle')}</p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t('input.subject.label')}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      id="subjectImage"
                      className="hidden"
                      onChange={(e) => handleUpload(e, 'subject')}
                    />
                    <label htmlFor="subjectImage" className="cursor-pointer block">
                      {subjectImage ? (
                        <img src={subjectImage} alt="Subject" className="w-24 h-24 object-cover rounded-lg mx-auto mb-3" />
                      ) : (
                        <div className="w-12 h-12 mx-auto mb-3 text-gray-400">
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">{t('input.subject.placeholder')}</p>
                      <p className="text-xs text-gray-500">{t('input.subject.format')}</p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t('input.outfit.label')}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      id="outfitImage"
                      className="hidden"
                      onChange={(e) => handleUpload(e, 'outfit')}
                    />
                    <label htmlFor="outfitImage" className="cursor-pointer block">
                      {outfitImage ? (
                        <img src={outfitImage} alt="Outfit" className="w-24 h-24 object-cover rounded-lg mx-auto mb-3" />
                      ) : (
                        <div className="w-12 h-12 mx-auto mb-3 text-gray-400">
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">{t('input.outfit.placeholder')}</p>
                      <p className="text-xs text-gray-500">{t('input.outfit.help')}</p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('input.prompt.label')}</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('input.prompt.help')}</p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 rounded-lg"
                >
                  {isGenerating ? t('input.button.generating') : t('input.button.generate', { credits: creditsRequired })}
                </Button>
              </div>
            </div>

            {/* Result column */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm">
              <div className="p-6 border-b border-yellow-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('result.title')}</h2>
                  <p className="text-sm text-yellow-800">{t('result.subtitle')}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                  {t('result.badge')}
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-white rounded-xl w-full overflow-hidden p-4 border border-yellow-100">
                  {generatedImage ? (
                    <div className="relative aspect-[9/16] w-full mx-auto">
                      <img src={generatedImage} alt="Result" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-sm" />
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                            {t('result.before')}
                          </div>
                          <div className="relative aspect-[9/16]">
                            <img
                              src={SAMPLE_PAIRS[sampleIndex].before}
                              alt="Sample before"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                            {t('result.after')}
                          </div>
                          <div className="relative aspect-[9/16]">
                            <img
                              src={SAMPLE_PAIRS[sampleIndex].after}
                              alt="Sample after"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{t(`result.caption.${SAMPLE_PAIRS[sampleIndex].captionKey}`)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSampleIndex((prev) => (prev - 1 + SAMPLE_PAIRS.length) % SAMPLE_PAIRS.length)}
                            className="px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition"
                          >
                            {t('result.prev')}
                          </button>
                          <button
                            onClick={() => setSampleIndex((prev) => (prev + 1) % SAMPLE_PAIRS.length)}
                            className="px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition"
                          >
                            {t('result.next')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <FreeOriginalDownloadButton
                  imageUrl={generatedImage || undefined}
                  className="border-yellow-200 bg-white"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => generatedImage && setShowShareModal(true)}
                    disabled={!generatedImage}
                    className="w-full flex items-center justify-center gap-2 border-yellow-300 text-yellow-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v1a9 9 0 0018 0v-1m-9 4v-8m0 8l-3-3m3 3l3-3" />
                    </svg>
                    {t('result.button.share')}
                  </Button>
                  <Button
                    onClick={() => {
                      setGeneratedImage(null);
                      setDescription(null);
                      setShowShareModal(false);
                    }}
                    variant="ghost"
                    className="w-full text-yellow-900 hover:bg-yellow-100"
                  >
                    {t('result.button.reset')}
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">{t('result.tips.title')}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t('result.tips.1')}</li>
                    <li>{t('result.tips.2')}</li>
                    <li>{t('result.tips.3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('benefits.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: '1', icon: '🏷️' },
                { key: '2', icon: '🎨' },
                { key: '3', icon: '🛍️' }
              ].map((item) => (
                <div key={item.key} className="border border-gray-100 rounded-xl p-5 hover:border-yellow-200 transition">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t(`benefits.items.${item.key}.title`)}</h4>
                  <p className="text-sm text-gray-600">{t(`benefits.items.${item.key}.description`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">{t('faq.badge')}</p>
              <h3 className="text-2xl font-bold text-gray-900">{t('faq.title')}</h3>
              <p className="text-gray-600 mt-2">{t('faq.subtitle')}</p>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="border border-gray-200 rounded-xl">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    >
                      <span className="font-semibold text-gray-900">{t(`faq.items.${index}.question`)}</span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-gray-600 border-t border-gray-100">
                        {t(`faq.items.${index}.answer`)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {generatedImage && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageUrl={generatedImage}
          title="AI outfit swap by Nano Banana"
          description={description || 'Created with the AI Clothes Changer'}
        />
      )}
    </>
  );
}