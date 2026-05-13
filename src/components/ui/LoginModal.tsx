'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const t = useTranslations('pages.auth.loginModal');

  // Auto-close when user logs in
  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-[calc(100%-2rem)] max-w-[380px] mx-auto px-8 py-10 relative animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-[72px] h-[72px] bg-gradient-to-br from-[#FFE066] to-[#FFD000] rounded-[20px] flex items-center justify-center shadow-[0_8px_24px_rgba(255,208,0,0.35)] mb-6">
            <span className="text-3xl leading-none">🍌</span>
          </div>
          <h2 className="text-[22px] font-bold text-gray-900 leading-tight mb-2">
            {t('title')}
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed max-w-[280px]">
            {t('subtitle')}
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl py-3.5 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all font-semibold text-[15px]"
        >
          <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{t('continueWithGoogle')}</span>
        </button>

        <p className="mt-6 text-center text-[13px] text-gray-400 leading-relaxed">
          {t('terms')}{' '}
          <a href="/terms" className="text-yellow-600 hover:text-yellow-700 underline underline-offset-2">{t('termsLink')}</a>
          {' '}{t('and')}{' '}
          <a href="/privacy" className="text-yellow-600 hover:text-yellow-700 underline underline-offset-2">{t('privacyLink')}</a>
        </p>
      </div>
    </div>
  );
}
