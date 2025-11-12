'use client';

import Button from './ui/Button';

interface ImageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: {
    id: string;
    title: string | null;
    prompt: string | null;
    processedImageUrl: string;
    imageType: string;
    cost: number;
    createdAt: string;
    dimensions?: string;
    style?: string;
    metadata?: any;
  } | null;
}

export default function ImageDetailModal({ isOpen, onClose, image }: ImageDetailModalProps) {
  if (!isOpen || !image) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const handleDownload = () => {
    // Simple direct download approach - open in new tab with download attribute
    const link = document.createElement('a');
    link.href = image.processedImageUrl;
    link.download = `image-${image.id}.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              {image.title || 'Image Details'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Image */}
            <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={image.processedImageUrl}
                alt={image.title || 'Generated image'}
                className="w-full h-auto"
              />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Type</label>
                <p className="text-gray-900">{getTypeLabel(image.imageType)}</p>
              </div>

              {/* Created At */}
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Created</label>
                <p className="text-gray-900">{formatDate(image.createdAt)}</p>
              </div>

              {/* Credits Used */}
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Credits Used</label>
                <p className="text-gray-900 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {image.cost}
                </p>
              </div>

              {/* Dimensions */}
              {image.dimensions && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Dimensions</label>
                  <p className="text-gray-900">{image.dimensions}</p>
                </div>
              )}

              {/* Style */}
              {image.style && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Style</label>
                  <p className="text-gray-900 capitalize">{image.style}</p>
                </div>
              )}

              {/* Model */}
              {image.metadata?.model && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Model</label>
                  <p className="text-gray-900">{image.metadata.model}</p>
                </div>
              )}
            </div>

            {/* Prompt */}
            {image.prompt && (
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-500 block mb-2">Prompt</label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{image.prompt}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Image
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
