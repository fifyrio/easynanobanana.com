'use client';

import { useState } from 'react';
import Button from './Button';
import toast from 'react-hot-toast';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralLink: string;
  shareMessage?: string;
}

export default function SocialShareModal({ 
  isOpen, 
  onClose, 
  referralLink, 
  shareMessage = "Join me on EasyNanoBanana and get 26 free credits to start creating amazing AI-generated images!" 
}: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy referral link');
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(referralLink);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedMessage}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedMessage}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const socialPlatforms = [
    {
      name: 'Twitter',
      icon: '𝕏',
      color: 'bg-black hover:bg-gray-800',
      platform: 'twitter'
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      platform: 'facebook'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      platform: 'linkedin'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-600 hover:bg-green-700',
      platform: 'whatsapp'
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-blue-500 hover:bg-blue-600',
      platform: 'telegram'
    },
    {
      name: 'Reddit',
      icon: '🟠',
      color: 'bg-orange-600 hover:bg-orange-700',
      platform: 'reddit'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Share & Earn</h3>
                <p className="text-sm text-gray-600">Invite friends to earn 10+30 credits</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Copy Link Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Referral Link
            </label>
            <div className="flex">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 p-3 border border-gray-200 rounded-l-lg bg-gray-50 text-gray-700 text-sm"
              />
              <Button 
                onClick={copyToClipboard}
                className={`rounded-l-none px-4 transition-colors ${
                  copied 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {copied ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Share to Social Media</h4>
            <div className="grid grid-cols-2 gap-3">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.platform}
                  onClick={() => shareToSocial(platform.platform)}
                  className={`flex items-center space-x-3 p-3 rounded-lg text-white font-medium transition-colors ${platform.color}`}
                >
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-sm">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Share Message Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Share message preview:</p>
            <p className="text-sm text-gray-800 italic">&ldquo;{shareMessage}&rdquo;</p>
          </div>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-lg">🎯</span>
              <h5 className="font-medium text-gray-900">Referral Benefits</h5>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• You earn <strong>10 credits</strong> per signup + <strong>30 credits</strong> when they purchase</li>
              <li>• Your friends get <strong>26 credits</strong> to start (6 welcome + 20 referral bonus)</li>
              <li>• No limit on referrals - invite as many as you want!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}