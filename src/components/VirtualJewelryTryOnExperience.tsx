'use client';

import { ChangeEvent, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import Header from './common/Header';
import Button from './ui/Button';
import ImagePreviewModal from './ui/ImagePreviewModal';
import ImageCropModal from './ui/ImageCropModal';
import RecentTaskCard from './ui/RecentTaskCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { JewelryStyle, JewelryCategory } from '../data/jewelry/jewelry';
import toast from 'react-hot-toast';
import { useDailyClaimStatus } from '@/hooks/useDailyClaimStatus';

interface VirtualJewelryTryOnExperienceProps {
  jewelryItems: JewelryStyle[];
}

const beforeImage = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/virtual-jewelry-try-on/feature/before.webp';
const afterImage = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/virtual-jewelry-try-on/feature/after.webp';

export default function VirtualJewelryTryOnExperience({ jewelryItems }: VirtualJewelryTryOnExperienceProps) {
  const t = useTranslations('virtualJewelryTryOn');
  const { user, profile, refreshProfile, signInWithGoogle } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const jewelryListRef = useRef<HTMLDivElement>(null);
  const jewelryItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Upload states
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Jewelry selection
  const [selectedJewelry, setSelectedJewelry] = useState<JewelryStyle | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<JewelryCategory>('all');

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<Date | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');

  // UI states
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
  const [tempFileNameForCrop, setTempFileNameForCrop] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isClaimingCredits, setIsClaimingCredits] = useState(false);

  // Daily claim status with localStorage caching
  const { hasClaimedToday, setClaimedToday } = useDailyClaimStatus();

  const creditsRequired = 5;

  const handleClaimCredits = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    setIsClaimingCredits(true);
    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      const response = await fetch('/api/credits/check-in', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Check-in failed');
      }

      const result = await response.json();
      toast.success(result.message);
      setClaimedToday(user, profile?.credits || 0);
      await refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim credits');
    } finally {
      setIsClaimingCredits(false);
    }
  };

  const howToVideos = [
    'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/videos/1.mp4',
    'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/videos/2.mp4',
    'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/videos/3.mp4',
  ];

  const useCaseCards = [
    {
      id: 1,
      icon: '🧥',
      matchTags: ['dainty', 'gold'],
      matchNames: ['dainty'],
    },
    {
      id: 2,
      icon: '💍',
      matchTags: ['diamond', 'elegant'],
      matchNames: ['diamond', 'pave'],
    },
    {
      id: 3,
      icon: '🎁',
      matchTags: ['heart', 'locket', 'pearl'],
      matchNames: ['heart', 'locket'],
    },
    {
      id: 4,
      icon: '🛍️',
      matchTags: ['tennis', 'diamond'],
      matchNames: ['tennis', 'halo', 'cross'],
    },
    {
      id: 5,
      icon: '✨',
      matchTags: ['diamond', 'metal'],
      matchNames: ['double', 'trio'],
    },
    {
      id: 6,
      icon: '🧳',
      matchTags: ['dainty', 'gold'],
      matchNames: ['dainty', 'gold'],
    },
    {
      id: 7,
      icon: '📸',
      matchTags: ['diamond'],
      matchNames: ['pave', 'statement'],
    },
    {
      id: 8,
      icon: '🛠️',
      matchTags: ['locket', 'pearl'],
      matchNames: ['locket', 'bezel'],
    },
  ];

  const getRecommendedJewelry = (useCaseId: number) => {
    const useCase = useCaseCards.find(card => card.id === useCaseId);
    if (!useCase || jewelryItems.length === 0) return null;

    const tagMatches = jewelryItems.filter(item => useCase.matchTags.some(tag => item.tags.includes(tag)));
    if (tagMatches.length > 0) {
      return tagMatches[Math.floor(Math.random() * tagMatches.length)];
    }

    const nameMatches = jewelryItems.filter(item =>
      useCase.matchNames.some(name => item.name.toLowerCase().includes(name))
    );
    if (nameMatches.length > 0) {
      return nameMatches[Math.floor(Math.random() * nameMatches.length)];
    }

    return jewelryItems[Math.floor(Math.random() * jewelryItems.length)];
  };

  const handleUseCaseSelect = (useCaseId: number) => {
    const recommended = getRecommendedJewelry(useCaseId);
    if (recommended) {
      setSelectedJewelry(recommended);
      setCategoryFilter(recommended.category as JewelryCategory);
    }
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (recommended) {
      setTimeout(() => {
        const target = jewelryItemRefs.current[recommended.id];
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } else {
          jewelryListRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }, 0);
    }
  };

  // Get unique categories from jewelry items
  const categories = useMemo(() => {
    const cats = new Set(jewelryItems.map(item => item.category));
    return ['all', ...Array.from(cats)] as JewelryCategory[];
  }, [jewelryItems]);

  // Filter jewelry by category
  const filteredJewelry = useMemo(() => {
    if (categoryFilter === 'all') return jewelryItems;
    return jewelryItems.filter(item => item.category === categoryFilter);
  }, [jewelryItems, categoryFilter]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadedFileName(null);
      setUploadedImage(null);
      setUploadedFile(null);
      setUploadedImageUrl(null);
      return;
    }

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImageForCrop(e.target?.result as string);
      setTempFileNameForCrop(file.name);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob, croppedImageUrl: string) => {
    // Create a File from the Blob
    const croppedFile = new File([croppedBlob], tempFileNameForCrop || 'cropped-image.jpg', {
      type: 'image/jpeg',
    });

    setUploadedImage(croppedImageUrl);
    setUploadedFile(croppedFile);
    setUploadedFileName(tempFileNameForCrop);
    setUploadedImageUrl(null);

    // Clear temp states
    setTempImageForCrop(null);
    setTempFileNameForCrop(null);
  };

  const handleCropModalClose = () => {
    setShowCropModal(false);
    setTempImageForCrop(null);
    setTempFileNameForCrop(null);
  };

  const buildPrompt = () => {
    if (!selectedJewelry) return '';

    const tags = selectedJewelry.tags.filter(tag => tag !== 'necklace' && tag !== selectedJewelry.category);
    const characteristics = tags.length > 0 ? ` with ${tags.join(', ')} style` : '';

    return `Add the "${selectedJewelry.name}" jewelry to the person in this photo.
This is a ${selectedJewelry.category}${characteristics}.
Position the ${selectedJewelry.category} naturally on the person's neck/chest area.
The jewelry should look photorealistic with proper lighting and reflections matching the scene.
Keep the person's face, expression, skin tone, clothing, and pose completely identical.
Preserve all original background elements unchanged.
Deliver a professional jewelry try-on result inspired by Nano Banana.`;
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError(t('error.upload'));
      return;
    }

    if (!selectedJewelry) {
      setError(t('error.selectJewelry'));
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
    setTaskStartTime(new Date());
    setCurrentPrompt(`Add ${selectedJewelry.name} to the photo`);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Step 1: Upload the file to R2 to get a public URL
      let imageUrl = uploadedImageUrl;
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

      // Step 2: Generate image with KIE API
      const promptText = buildPrompt();
      const jewelryDetails = {
        name: selectedJewelry.name,
        category: selectedJewelry.category,
        tags: selectedJewelry.tags,
      };

      const imageUrls = [imageUrl];

      // Add jewelry reference image if available
      if (selectedJewelry.imageUrl) {
        imageUrls.push(selectedJewelry.imageUrl);
      }

      console.log('Starting image generation task...');
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: promptText,
          imageUrls,
          metadata: jewelryDetails,
          aspectRatio: '1:1',
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
          setError(data.error || 'Failed to generate jewelry try-on preview.');
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
            await refreshProfile();
            return;
          } else {
            setError('Image generation completed but no result URL found.');
            return;
          }
        }

        if (statusData.status === 'failed') {
          setError(statusData.error || 'Image generation failed. Please try again.');
          return;
        }
      }

      setError('Image generation is taking longer than expected. Please check back later.');
    } catch (err: unknown) {
      console.error('Error generating jewelry try-on:', err);

      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err instanceof Error && err.message?.includes('timeout')) {
        setError('Request timed out. The server may be busy, please try again.');
      } else {
        setError('Failed to generate jewelry try-on preview. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSliderPosition = (clientX: number) => {
    const container = comparisonRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    updateSliderPosition(clientX);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    updateSliderPosition(clientX);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatPrice = (priceValue: number, symbol: string) => {
    return `${symbol}${(priceValue / 100).toLocaleString()}`;
  };

  // Before/After comparison always shows demo images unless there's a generated result
  const beforeDisplayImage = generatedImage ? uploadedImage || beforeImage : beforeImage;
  const afterDisplayImage = generatedImage || afterImage;
  const beforeTag = generatedImage ? t('preview.labels.original') : t('preview.labels.before');
  const afterTag = generatedImage ? t('preview.labels.result') : t('preview.labels.after');

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-[#FFFBEA] to-white text-slate-900 pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#F8FAFC] to-[#FFFBEA] py-12 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              {/* Left: Text Content */}
              <div className="space-y-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                  {t('newHero.title')} - <span className="text-[#C69312]">{t('newHero.titleHighlight')}</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {t('newHero.subtitle')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-6 py-3 rounded-full bg-[#FFD84D] text-slate-900 font-semibold shadow-lg hover:bg-[#ffe062] hover:-translate-y-0.5 transition-all"
                  >
                    {t('newHero.ctaPrimary')}
                  </button>
                  <button
                    type="button"
                    onClick={handleClaimCredits}
                    disabled={isClaimingCredits || hasClaimedToday}
                    className="px-6 py-3 rounded-full bg-white border-2 border-[#FFE7A1] text-slate-700 font-semibold hover:bg-[#FFF3B2] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isClaimingCredits ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-transparent" />
                        {t('newHero.ctaSecondary')}
                      </>
                    ) : hasClaimedToday ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                        </svg>
                        {t('newHero.ctaClaimed')}
                      </>
                    ) : (
                      t('newHero.ctaSecondary')
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="https://apps.apple.com/us/app/jewelry-ai-bling-match/id6757066964?ct=web&mt=8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-2xl border border-[#FFE7A1] bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(255,216,77,0.3)] transition hover:-translate-y-0.5 hover:bg-[#FFF3B2]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5 text-slate-900"
                    >
                      <path d="M16.71 2.06c-.9.06-1.95.62-2.6 1.39-.58.7-1.08 1.83-.9 2.9 1.02.08 2.06-.55 2.68-1.33.61-.73 1.08-1.84.82-2.96Zm1.08 6.48c-1.5-.9-3.62-.76-4.72.3-.59.55-1.1 1.37-1.1 2.5 0 1.36.72 3.34 1.6 4.62.78 1.1 1.62 2.33 2.79 2.29 1.11-.04 1.54-.72 2.89-.72 1.35 0 1.73.72 2.91.7 1.2-.02 1.96-1.12 2.73-2.22.86-1.23 1.22-2.42 1.24-2.48-.03-.01-2.38-.93-2.4-3.69-.02-2.31 1.88-3.41 1.97-3.47-1.07-1.56-2.73-1.73-3.32-1.77-1.5-.12-2.78.87-3.51.87-.73 0-1.85-.84-3.04-.82-1.57.03-3.02.92-3.83 2.33-1.63 2.83-.42 7.01 1.17 9.3.78 1.12 1.72 2.38 2.96 2.33 1.19-.05 1.64-.77 3.08-.77 1.44 0 1.85.77 3.1.74 1.28-.02 2.08-1.16 2.85-2.29.89-1.3 1.26-2.56 1.28-2.62-.03-.01-2.45-.94-2.48-3.73-.03-2.34 1.9-3.44 1.99-3.5-1.1-1.6-2.8-1.77-3.39-1.81Z" />
                    </svg>
                    <span>Download on the App Store</span>
                  </a>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#FFE7A1] bg-white px-3 py-2 shadow-[0_15px_40px_rgba(255,216,77,0.3)]">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[#FFE7A1] bg-[#FFF9E6]">
                      <Image
                        src="https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/virtual-jewelry-try-on/qrcode.svg"
                        alt="App Store QR code"
                        fill
                        sizes="64px"
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="text-xs text-slate-600">
                      <div className="font-semibold text-slate-900">Scan to download</div>
                      <div>iOS App</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Single Showcase Image */}
              <div className="relative flex justify-center items-center">
                <div className="w-64 md:w-80 aspect-[3/4] rounded-[28px] overflow-hidden border-4 border-white shadow-[0_25px_70px_rgba(247,201,72,0.3)] bg-white relative">
                  <video
                    src="https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/videos/jewelry-hero.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={heroRef} className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            {/* Left column */}
            <div className="rounded-[32px] border border-[#FFE58F] bg-white/90 shadow-[0_40px_120px_rgba(247,201,72,0.25)] p-6 sm:p-10 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFD84D] text-lg shadow-lg">
                  💎
                </div>
                {t('hero.badge')}
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900">
                  {t('hero.title')}
                </h1>
                <p className="text-base text-slate-600">
                  {t('hero.subtitle')}
                </p>
              </div>

              <div className="space-y-6">
                {/* Upload section */}
                <div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-inner">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('input.upload.label')}</p>
                      <p className="text-xs text-slate-500">
                        {t('input.upload.format')}
                      </p>
                    </div>
                    <label
                      htmlFor="jewelry-upload"
                      className="cursor-pointer rounded-full bg-[#FFD84D] px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:-translate-y-0.5 hover:bg-[#ffe062] transition"
                    >
                      {t('input.upload.button')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      id="jewelry-upload"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  {uploadedImage ? (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#F5C04B] bg-white/80 p-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#FFE7A1] flex-shrink-0">
                        <Image
                          src={uploadedImage}
                          alt="Uploaded photo"
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{uploadedFileName}</p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Ready
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImage(null);
                          setUploadedFile(null);
                          setUploadedFileName(null);
                          setUploadedImageUrl(null);
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#F5C04B]/70 px-3 py-2 text-sm text-slate-500">
                      {t('input.upload.placeholder')}
                    </div>
                  )}
                </div>

                {/* Jewelry selection */}
                <div>
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>{t('input.jewelry.label')}</span>
                    <span className="text-xs text-[#C69312]">{t('input.jewelry.swipe')}</span>
                  </div>

                  {/* Category filter */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setCategoryFilter(category)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                          categoryFilter === category
                            ? 'bg-[#FFD84D] text-slate-900 shadow'
                            : 'bg-white border border-[#FFE7A1] text-slate-600 hover:bg-[#FFF3B2]'
                        }`}
                      >
                        {t(`input.jewelry.categories.${category}`)}
                      </button>
                    ))}
                  </div>

                  {/* Jewelry grid */}
                  <div ref={jewelryListRef} className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                    <div className="flex gap-3 pr-6">
                      {filteredJewelry.map((jewelry) => {
                        const isSelected = selectedJewelry?.id === jewelry.id;
                        return (
                          <button
                            type="button"
                            key={jewelry.id}
                            ref={(node) => {
                              jewelryItemRefs.current[jewelry.id] = node;
                            }}
                            onClick={() => setSelectedJewelry(jewelry)}
                            className={`relative flex-shrink-0 w-32 rounded-2xl border-2 p-2 transition ${
                              isSelected
                                ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
                                : 'border-gray-200 bg-white hover:border-[#FFE7A1]'
                            }`}
                          >
                            <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100">
                              <Image
                                src={jewelry.imageUrl}
                                alt={jewelry.name}
                                fill
                                sizes="128px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="mt-2 text-[10px] font-semibold text-center leading-tight truncate text-slate-700">
                              {jewelry.name}
                            </div>
                            <div className="text-[10px] text-[#C69312] text-center font-medium">
                              {formatPrice(jewelry.priceValue, jewelry.priceSymbol)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected jewelry summary */}
                  {selectedJewelry && (
                    <div className="mt-4 rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#FFE7A1] flex-shrink-0">
                          <Image
                            src={selectedJewelry.imageUrl}
                            alt={selectedJewelry.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{selectedJewelry.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{selectedJewelry.category}</p>
                          <p className="text-sm font-semibold text-[#C69312]">
                            {formatPrice(selectedJewelry.priceValue, selectedJewelry.priceSymbol)}
                          </p>
                        </div>
                        <a
                          href={selectedJewelry.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#C69312] hover:underline whitespace-nowrap"
                        >
                          {t('input.jewelry.viewProduct')} →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  onClick={handleGenerate}
                  loading={isGenerating}
                  className="w-full rounded-2xl bg-[#FFD84D] px-6 py-3 text-center text-base font-semibold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                >
                  {isGenerating ? t('input.button.generating') : t('input.button.generate')}
                </Button>
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  {t('input.button.credits', { count: creditsRequired })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.styles.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.styles.label')}</div>
                </div>
                <div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
                  <div className="text-lg font-semibold text-slate-900">{t('input.stats.time.value')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('input.stats.time.label')}</div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="relative">
              {/* Show RecentTaskCard when generating or completed, otherwise show comparison */}
              {(taskStartTime && (isGenerating || generatedImage)) ? (
                <RecentTaskCard
                  timestamp={taskStartTime}
                  prompt={currentPrompt}
                  status={isGenerating ? 'generating' : 'completed'}
                  progress={0}
                  imageUrl={generatedImage || undefined}
                  downloadFilename="jewelry-try-on.png"
                  onViewFull={generatedImage ? () => setShowPreviewModal(true) : undefined}
                />
              ) : (
                <div className="rounded-[36px] border border-[#FFE7A1] bg-white shadow-[0_40px_140px_rgba(196,147,18,0.25)] p-4">
                  <div
                    ref={comparisonRef}
                    className="relative aspect-square w-full overflow-hidden rounded-[28px] bg-gray-200 select-none"
                    onMouseDown={(event) => handleDragStart(event.clientX)}
                    onMouseMove={(event) => handleDragMove(event.clientX)}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
                    onTouchMove={(event) => handleDragMove(event.touches[0].clientX)}
                    onTouchEnd={handleDragEnd}
                    role="presentation"
                  >
                    <Image
                      src={afterDisplayImage}
                      alt="AI generated jewelry try-on preview"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain"
                      priority
                      unoptimized
                    />
                    <div
                      className="absolute inset-0 left-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={beforeDisplayImage}
                          alt="Original photo"
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-contain"
                          priority
                          unoptimized
                        />
                      </div>
                    </div>

                    <div
                      className="absolute inset-y-0 w-px bg-white"
                      style={{
                        left: `calc(${sliderPosition}% - 0.5px)`,
                        boxShadow: '0 0 25px rgba(255,255,255,0.8)',
                      }}
                    />
                    <div
                      className="absolute top-1/2 -mt-6 h-12 w-12 -translate-x-1/2 rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-2xl flex items-center justify-center cursor-[ew-resize]"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      ⇆
                    </div>
                    <span className="absolute left-8 top-8 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600">
                      {beforeTag}
                    </span>
                    <span className="absolute right-8 top-8 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                      {afterTag}
                    </span>

                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How To Section */}
        <section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('howTo.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('howTo.title')}</h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="rounded-[28px] bg-white border border-[#FFE7A1] shadow-[0_30px_90px_rgba(255,216,77,0.35)] overflow-hidden flex flex-col hover:-translate-y-1 transition"
              >
                <div className="bg-[#FFF3B2]/40 p-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#FFD84D] text-slate-900 font-bold text-2xl flex items-center justify-center shadow-md">
                    {step}
                  </div>
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#FFE7A1] bg-white">
                    <video
                      src={howToVideos[step - 1]}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">{t(`howTo.steps.${step}.title`)}</h3>
                  <p className="text-sm text-slate-600">{t(`howTo.steps.${step}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-gradient-to-b from-[#FFF7DA] via-white to-[#FFF7DA] text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('benefits.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('benefits.title')}</h2>
            <p className="text-slate-600 max-w-3xl">
              {t('benefits.subtitle')}
            </p>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="rounded-[28px] bg-white border border-[#FFE7A1] shadow-[0_25px_70px_rgba(247,201,72,0.2)] p-6 hover:-translate-y-1 transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center text-xl text-[#C69312] mb-4">
                  {card === 1 && '👗'}
                  {card === 2 && '💎'}
                  {card === 3 && '🛒'}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{t(`benefits.cards.${card}.title`)}</h3>
                <p className="text-sm text-slate-600">{t(`benefits.cards.${card}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-gradient-to-b from-white via-[#FFF7DA] to-white text-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('useCases.badge')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t('useCases.title')}</h2>
            <p className="text-slate-600 max-w-3xl">
              {t('useCases.subtitle')}
            </p>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {useCaseCards.map((card) => {
              const bullets = t.raw(`useCases.cards.${card.id}.bullets`);
              const bulletList = Array.isArray(bullets) ? bullets : [];
              return (
              <div
                key={card.id}
                className="rounded-[28px] border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)] overflow-hidden flex flex-col hover:-translate-y-1 transition"
              >
                <div className="flex items-center gap-4 bg-[#FFF3B2]/40 px-5 py-4 border-b border-[#FFE7A1]">
                  <div className="h-12 w-12 rounded-2xl bg-[#FFD84D] text-slate-900 font-bold text-xl flex items-center justify-center shadow-md">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{t(`useCases.cards.${card.id}.title`)}</h3>
                    <p className="text-sm font-semibold text-[#C69312]">{t(`useCases.cards.${card.id}.subtitle`)}</p>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <p className="text-sm text-slate-600 leading-relaxed">{t(`useCases.cards.${card.id}.description`)}</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {bulletList.map((bullet: string, index: number) => (
                      <li key={`${card.id}-${index}`} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#F0A202]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleUseCaseSelect(card.id)}
                    className="mt-auto w-full rounded-2xl bg-[#FFD84D] px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_15px_40px_rgba(255,216,77,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                  >
                    {t('useCases.cta')}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white text-slate-900">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C69312]">{t('faq.badge')}</p>
            <h2 className="text-3xl font-semibold">{t('faq.title')}</h2>
            <p className="text-slate-600">
              {t('faq.subtitle')}
            </p>
          </div>
          <div className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
            {[1, 2, 3, 4].map((index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-3xl border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-slate-900">{t(`faq.items.${index}.question`)}</span>
                    <span className="text-[#C69312] text-2xl">{isOpen ? '–' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-600">
                      {t(`faq.items.${index}.answer`)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      {generatedImage && (
        <>
          <ImagePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            imageUrl={generatedImage}
            title="Jewelry Try-On Preview"
          />
        </>
      )}
      {tempImageForCrop && (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={handleCropModalClose}
          imageSrc={tempImageForCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
