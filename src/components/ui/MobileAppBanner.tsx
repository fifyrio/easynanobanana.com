'use client';

import { useState, useEffect } from 'react';

const APP_STORE_URL = 'https://apps.apple.com/us/app/vido-ai-photo-to-video/id6758744274';

export default function MobileAppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('appBannerDismissed') !== 'true') {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('appBannerDismissed', 'true');
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Fixed banner at top */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-300 px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={dismiss}
            className="flex-shrink-0 text-yellow-800/60 hover:text-yellow-900 p-1 -ml-1"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-gray-900">Vido - AI Photo to Video</p>
              <span className="text-xs text-yellow-600">★★★★★</span>
            </div>
            <p className="text-xs text-gray-700">Get More AI Tools & Effects in App</p>
          </div>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            App Store
          </a>
        </div>
      </div>
      {/* Spacer to prevent content overlap — matches banner height */}
      <div className="h-[52px] lg:hidden" />
    </>
  );
}
