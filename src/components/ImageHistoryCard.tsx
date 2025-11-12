'use client';

import Button from './ui/Button';
import { useImageDownload } from '@/hooks/useImageDownload';

interface ImageHistoryCardProps {
  id: string;
  title: string | null;
  prompt: string | null;
  processedImageUrl: string;
  thumbnailUrl: string | null;
  imageType: string;
  cost: number;
  createdAt: string;
  metadata?: any;
  onViewDetail: () => void;
}

export default function ImageHistoryCard({
  id,
  title,
  prompt,
  processedImageUrl,
  thumbnailUrl,
  imageType,
  cost,
  createdAt,
  metadata,
  onViewDetail
}: ImageHistoryCardProps) {
  const { downloadImage, isDownloading } = useImageDownload({
    creditsRequired: 0,
    cooldownMs: 1000
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      generation: 'AI Generation',
      background_removal: 'Background Removal',
      edit: 'Image Edit',
      template: 'Template'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      generation: 'bg-purple-100 text-purple-700',
      background_removal: 'bg-blue-100 text-blue-700',
      edit: 'bg-green-100 text-green-700',
      template: 'bg-orange-100 text-orange-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const handleDownload = () => {
    // Simple direct download approach - open in new tab with download attribute
    const link = document.createElement('a');
    link.href = processedImageUrl;
    link.download = `image-${id}.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image Preview */}
      <div
        className="relative aspect-square bg-gray-100 cursor-pointer overflow-hidden"
        onClick={onViewDetail}
      >
        <img
          src={thumbnailUrl || processedImageUrl}
          alt={title || 'Generated image'}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(imageType)}`}>
            {getTypeLabel(imageType)}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        {title && (
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
            {title}
          </h3>
        )}

        {/* Prompt Preview */}
        {prompt && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {prompt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDate(createdAt)}</span>
          </div>
          <div className="flex items-center text-yellow-600 font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{cost} credits</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onViewDetail}
            variant="outline"
            size="sm"
            className="w-full p-2"
            title="View details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="w-full p-2"
            title="Download image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </Button>
          <Button
            onClick={() => {
              const encodedPrompt = encodeURIComponent(prompt || '');
              window.location.href = `/image-editor?prompt=${encodedPrompt}`;
            }}
            variant="outline"
            size="sm"
            className="w-full p-2"
            title="Regenerate with this prompt"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
