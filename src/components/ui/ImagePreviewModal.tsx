'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export default function ImagePreviewModal({ isOpen, onClose, imageUrl, title }: ImagePreviewModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#FFF9E6] to-white">
          <h3 className="text-lg font-semibold text-slate-900">
            {title || 'Preview'}
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#FFE7A1] text-slate-600 hover:bg-[#FFF3B2] hover:text-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label="Close preview"
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

        {/* Image Container */}
        <div className="relative w-full overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <div className="flex items-center justify-center min-h-[400px] p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={imageUrl}
                alt={title || 'Preview image'}
                width={1200}
                height={1200}
                className="max-w-full h-auto rounded-2xl shadow-2xl border-4 border-white"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 bg-gradient-to-r from-[#FFF9E6] to-white border-t border-gray-200">
          <p className="text-xs text-center text-slate-500">
            Click outside or press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-semibold">ESC</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
