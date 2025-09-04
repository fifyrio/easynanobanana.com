'use client';

import { useState } from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  RedditShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  TelegramIcon,
  RedditIcon,
} from 'react-share';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  description?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  imageUrl,
  title = "Check out this AI-generated image!",
  description = "Created with EasyNanoBanana AI Image Generator"
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/image-editor' : '';
  const fullDescription = `${description} - ${shareUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      toast.success('Image URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-image.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded!');
    } catch (err) {
      toast.error('Failed to download image');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Share Image</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Image Preview */}
          <div className="mb-6 text-center">
            <img 
              src={imageUrl} 
              alt="Generated image" 
              className="w-32 h-32 object-cover rounded-lg mx-auto mb-3"
            />
            <p className="text-sm text-gray-600">{title}</p>
          </div>

          {/* Social Media Share Buttons */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Share on social media:</h4>
            <div className="grid grid-cols-3 gap-3">
              <FacebookShareButton
                url={shareUrl}
                title={title}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FacebookIcon size={32} round />
                <span className="text-xs mt-1 text-gray-600">Facebook</span>
              </FacebookShareButton>

              <TwitterShareButton
                url={shareUrl}
                title={title}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TwitterIcon size={32} round />
                <span className="text-xs mt-1 text-gray-600">Twitter</span>
              </TwitterShareButton>

              <LinkedinShareButton
                url={shareUrl}
                title={title}
                summary={description}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LinkedinIcon size={32} round />
                <span className="text-xs mt-1 text-gray-600">LinkedIn</span>
              </LinkedinShareButton>

              <WhatsappShareButton
                url={shareUrl}
                title={fullDescription}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <WhatsappIcon size={32} round />
                <span className="text-xs mt-1 text-gray-600">WhatsApp</span>
              </WhatsappShareButton>

              <TelegramShareButton
                url={shareUrl}
                title={fullDescription}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TelegramIcon size={32} round />
                <span className="text-xs mt-1 text-gray-600">Telegram</span>
              </TelegramShareButton>

              <RedditShareButton
                url={shareUrl}
                title={title}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RedditIcon size={32} round />
                <span className="text-xs mt-1 text-gray-600">Reddit</span>
              </RedditShareButton>
            </div>
          </div>

          {/* Copy Link */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Or copy image URL:</h4>
            <div className="flex">
              <input
                type="text"
                value={imageUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm text-gray-600 bg-gray-50"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-r-lg transition-colors"
              >
                {copied ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={downloadImage}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}