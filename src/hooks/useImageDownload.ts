import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';

export type DownloadType = 'preview' | 'original';

interface UseImageDownloadOptions {
  creditsRequired?: number;
  cooldownMs?: number;
  onSuccess?: (type: DownloadType) => void;
  onError?: (error: string, type: DownloadType) => void;
}

export function useImageDownload(options: UseImageDownloadOptions = {}) {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { creditsRequired = 1, cooldownMs = 1000, onSuccess, onError } = options;
  
  const [downloading, setDownloading] = useState<DownloadType | null>(null);
  const [cooldown, setCooldown] = useState<DownloadType | null>(null);

  const downloadImage = async (
    imageUrl: string, 
    type: DownloadType, 
    filename: string = 'image.png'
  ) => {
    if (!imageUrl || downloading === type || cooldown === type) return;
    
    setDownloading(type);

    // For original quality, check authentication and credits on frontend
    if (type === 'original') {
      if (!user) {
        const errorMsg = 'Please sign in to download original quality. Redirecting...';
        toast.error(errorMsg);
        onError?.(errorMsg, type);
        setDownloading(null);
        setTimeout(() => router.push('/pricing'), 1500);
        return;
      }
      
      if (!profile || (profile.credits || 0) < creditsRequired) {
        const errorMsg = 'Insufficient credits. Redirecting to pricing...';
        toast.error(errorMsg);
        onError?.(errorMsg, type);
        setDownloading(null);
        setTimeout(() => router.push('/pricing'), 1500);
        return;
      }
    }
    
    try {
      // Use download proxy API to handle CORS and credit deduction
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      
      const response = await fetch('/api/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(type === 'original' && token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          type: type,
          filename: filename
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = '';
        
        if (response.status === 401) {
          errorMsg = 'Please sign in to download original quality. Redirecting...';
          setTimeout(() => router.push('/pricing'), 1500);
        } else if (response.status === 402) {
          errorMsg = 'Insufficient credits. Redirecting to pricing...';
          setTimeout(() => router.push('/pricing'), 1500);
        } else {
          errorMsg = errorData.error || 'Download failed';
        }
        
        toast.error(errorMsg);
        onError?.(errorMsg, type);
        setDownloading(null);
        return;
      }
      
      // Get the image blob from response
      const blob = await response.blob();
      saveAs(blob, filename);
      
      // Show success message and refresh profile if credits were deducted
      if (type === 'original') {
        const successMsg = `${creditsRequired} credit${creditsRequired > 1 ? 's' : ''} deducted. Original quality image downloaded!`;
        toast.success(successMsg);
        await refreshProfile();
        onSuccess?.(type);
      } else {
        const successMsg = 'Image downloaded successfully!';
        toast.success(successMsg);
        onSuccess?.(type);
      }
      
      // Set cooldown period
      setDownloading(null);
      setCooldown(type);
      setTimeout(() => {
        setCooldown(null);
      }, cooldownMs);
      
    } catch (err) {
      const errorMsg = 'Download failed. Please try again.';
      console.error('Download failed:', err);
      toast.error(errorMsg);
      onError?.(errorMsg, type);
      setDownloading(null);
    }
  };

  return {
    downloadImage,
    canDownloadOriginal: user && profile && (profile.credits || 0) >= creditsRequired,
    isDownloading: (type: DownloadType) => downloading === type,
    isInCooldown: (type: DownloadType) => cooldown === type,
    isDisabled: (type: DownloadType) => downloading === type || cooldown === type
  };
}