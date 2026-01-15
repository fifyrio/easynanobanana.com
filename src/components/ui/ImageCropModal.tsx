'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
}

type AspectRatioOption = {
  label: string;
  value: number | null; // null means free aspect ratio
};

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '3:2', value: 3 / 2 },
  { label: 'Free', value: null },
];

// Helper function to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<{ blob: Blob; url: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to center before rotating
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped area
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No 2d context');
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      },
      'image/jpeg',
      0.95
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [cropperKey, setCropperKey] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setSelectedAspectRatio(null); // Default to Free mode
      setCropperKey((prev) => prev + 1); // Force re-render to apply initialCroppedAreaPercentages
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleResetCrop = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropperKey((prev) => prev + 1); // Force re-render to reset crop area
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleApply = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setIsApplying(true);
    try {
      const { blob, url } = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(blob, url);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsApplying(false);
    }
  }, [croppedAreaPixels, imageSrc, rotation, onCropComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-[0_40px_120px_rgba(247,201,72,0.25)] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#FFE7A1] bg-gradient-to-r from-[#FFF9E6] to-white">
          <h3 className="text-xl font-semibold text-slate-900">Crop Image</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#FFE7A1] text-slate-600 hover:bg-[#FFF3B2] hover:text-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Cropper Area */}
          <div className="flex-1 relative bg-slate-100" style={{ minHeight: '400px' }}>
            <Cropper
              key={cropperKey}
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={selectedAspectRatio ?? undefined}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaComplete}
              cropShape="rect"
              showGrid={true}
              objectFit="contain"
              initialCroppedAreaPercentages={{ x: 0, y: 0, width: 100, height: 100 }}
              style={{
                containerStyle: {
                  backgroundColor: '#f1f5f9',
                },
                cropAreaStyle: {
                  border: '2px solid #FFD84D',
                },
              }}
            />
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-64 p-6 bg-gradient-to-b from-[#FFFBF0] to-white border-t lg:border-t-0 lg:border-l border-[#FFE7A1]">
            {/* Preset Ratios */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-900 mb-3">Preset Ratios</p>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => {
                  const isSelected = selectedAspectRatio === ratio.value;
                  return (
                    <button
                      key={ratio.label}
                      onClick={() => setSelectedAspectRatio(ratio.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'bg-[#FFD84D] text-slate-900 shadow-[0_4px_12px_rgba(255,216,77,0.4)]'
                          : 'bg-white border border-[#FFE7A1] text-slate-600 hover:bg-[#FFF3B2] hover:border-[#FFD84D]'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-900 mb-3">Zoom</p>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-[#FFE7A1] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FFD84D] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Actions</p>
              <button
                onClick={handleResetCrop}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-[#FFE7A1] text-slate-700 hover:bg-[#FFF3B2] transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-[#C69312]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                <span className="text-sm font-medium">Reset Crop</span>
              </button>
              <button
                onClick={handleRotate}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-[#FFE7A1] text-slate-700 hover:bg-[#FFF3B2] transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-[#C69312]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
                  />
                </svg>
                <span className="text-sm font-medium">Rotate 90°</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#FFE7A1] bg-gradient-to-r from-[#FFF9E6] to-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-white border border-[#FFE7A1] hover:bg-[#FFF3B2] transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-900 bg-[#FFD84D] hover:bg-[#ffe062] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Applying...
              </span>
            ) : (
              'Apply'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
