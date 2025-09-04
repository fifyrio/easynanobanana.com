import { ReactNode } from 'react';
import Button from './Button';
import { useImageDownload, DownloadType } from '@/hooks/useImageDownload';

interface FreeOriginalDownloadButtonProps {
  imageUrl?: string;
  filename?: string;
  disabled?: boolean;
  className?: string;
  cooldownMs?: number;
  onSuccess?: (type: DownloadType) => void;
  onError?: (error: string, type: DownloadType) => void;
}

export default function FreeOriginalDownloadButton({
  imageUrl,
  filename = 'image.png',
  disabled = false,
  className = '',
  cooldownMs = 1000,
  onSuccess,
  onError,
}: FreeOriginalDownloadButtonProps) {
  const { 
    downloadImage, 
    isDownloading, 
    isInCooldown, 
    isDisabled 
  } = useImageDownload({ 
    creditsRequired: 0, // Free download
    cooldownMs,
    onSuccess, 
    onError 
  });

  const handleClick = () => {
    if (!imageUrl || isDisabled('preview')) return;
    // Use 'preview' type to avoid credit checks, but download original quality
    downloadImage(imageUrl, 'preview', filename);
  };

  const buttonDisabled = disabled || !imageUrl || isDisabled('preview');
  const showLoading = isDownloading('preview');
  const showCooldown = isInCooldown('preview');

  return (
    <Button
      variant="outline"
      className={`w-full flex justify-between items-center text-left bg-blue-50 hover:bg-blue-100 border-blue-200 ${className} ${showLoading ? 'opacity-75' : ''}`}
      onClick={handleClick}
      disabled={buttonDisabled}
    >
      {showLoading ? (
        <div className="flex items-center justify-center w-full">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Downloading...</span>
        </div>
      ) : showCooldown ? (
        <div className="flex items-center justify-center w-full">
          <span className="text-blue-600">Downloaded ✓</span>
        </div>
      ) : (
        <>
          <div>
            <span className="font-medium">Original Quality</span>
            <p className="text-sm text-gray-600">Full resolution image</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-medium text-sm">FREE</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </>
      )}
    </Button>
  );
}