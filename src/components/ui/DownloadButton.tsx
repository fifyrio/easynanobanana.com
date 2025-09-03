import { ReactNode } from 'react';
import Button from './Button';
import { useImageDownload, DownloadType } from '@/hooks/useImageDownload';
import { useAuth } from '@/contexts/AuthContext';

interface DownloadButtonProps {
  imageUrl?: string;
  type: DownloadType;
  filename?: string;
  creditsRequired?: number;
  cooldownMs?: number;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  children?: ReactNode;
  onSuccess?: (type: DownloadType) => void;
  onError?: (error: string, type: DownloadType) => void;
}

export default function DownloadButton({
  imageUrl,
  type,
  filename = 'image.png',
  creditsRequired = 1,
  cooldownMs = 1000,
  disabled = false,
  className = '',
  variant = 'outline',
  children,
  onSuccess,
  onError,
}: DownloadButtonProps) {
  const { profile } = useAuth();
  const { 
    downloadImage, 
    canDownloadOriginal, 
    isDownloading, 
    isInCooldown, 
    isDisabled 
  } = useImageDownload({ 
    creditsRequired, 
    cooldownMs,
    onSuccess, 
    onError 
  });

  const handleClick = () => {
    if (!imageUrl || isDisabled(type)) return;
    downloadImage(imageUrl, type, filename);
  };

  // Show credit status for original downloads
  const isOriginal = type === 'original';
  const hasEnoughCredits = canDownloadOriginal;
  const buttonDisabled = disabled || !imageUrl || (isOriginal && !hasEnoughCredits) || isDisabled(type);
  const showLoading = isDownloading(type);
  const showCooldown = isInCooldown(type);

  return (
    <Button
      variant={variant}
      className={`${className} ${showLoading ? 'opacity-75' : ''}`}
      onClick={handleClick}
      disabled={buttonDisabled}
    >
      {showLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Processing...</span>
        </div>
      ) : showCooldown ? (
        <div className="flex items-center justify-center">
          <span>Downloaded ✓</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}

// Pre-styled download options for common use cases
export function PreviewDownloadButton({ 
  imageUrl, 
  filename, 
  disabled, 
  className = "",
  cooldownMs = 1000,
  onSuccess,
  onError 
}: Omit<DownloadButtonProps, 'type' | 'children' | 'variant' | 'creditsRequired'>) {
  const { isDownloading, isInCooldown } = useImageDownload({ cooldownMs });
  const showLoading = isDownloading('preview');
  const showCooldown = isInCooldown('preview');
  
  return (
    <DownloadButton
      imageUrl={imageUrl}
      type="preview"
      filename={filename}
      disabled={disabled}
      cooldownMs={cooldownMs}
      variant="outline"
      className={`w-full flex justify-between items-center text-left bg-green-50 hover:bg-green-100 border-green-200 ${className}`}
      onSuccess={onSuccess}
      onError={onError}
    >
      {showLoading ? (
        <div className="flex items-center justify-center w-full">
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Downloading...</span>
        </div>
      ) : showCooldown ? (
        <div className="flex items-center justify-center w-full">
          <span className="text-green-600">Downloaded ✓</span>
        </div>
      ) : (
        <>
          <div>
            <span className="font-medium">Preview Quality</span>
            <p className="text-sm text-gray-600">Compressed image</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-medium text-sm">FREE</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </>
      )}
    </DownloadButton>
  );
}

export function OriginalDownloadButton({ 
  imageUrl, 
  filename, 
  disabled, 
  className = "",
  creditsRequired = 1,
  cooldownMs = 1000,
  onSuccess,
  onError 
}: Omit<DownloadButtonProps, 'type' | 'children' | 'variant'>) {
  const { isDownloading, isInCooldown } = useImageDownload({ creditsRequired, cooldownMs });
  const showLoading = isDownloading('original');
  const showCooldown = isInCooldown('original');
  
  return (
    <DownloadButton
      imageUrl={imageUrl}
      type="original"
      filename={filename}
      disabled={disabled}
      creditsRequired={creditsRequired}
      cooldownMs={cooldownMs}
      variant="outline"
      className={`w-full flex justify-between items-center text-left bg-blue-50 hover:bg-blue-100 border-blue-200 ${className}`}
      onSuccess={onSuccess}
      onError={onError}
    >
      {showLoading ? (
        <div className="flex items-center justify-center w-full">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Processing...</span>
        </div>
      ) : showCooldown ? (
        <div className="flex items-center justify-center w-full">
          <span className="text-blue-600">Downloaded ✓</span>
        </div>
      ) : (
        <>
          <div>
            <span className="font-medium">Original Quality</span>
            <p className="text-sm text-gray-600">Full resolution</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 font-medium text-sm">
              {creditsRequired} CREDIT{creditsRequired > 1 ? 'S' : ''}
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </>
      )}
    </DownloadButton>
  );
}