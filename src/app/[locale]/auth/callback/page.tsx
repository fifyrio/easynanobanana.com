'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          if (window.opener) {
            setTimeout(() => window.close(), 2000);
          } else {
            setTimeout(() => router.push('/'), 3000);
          }
          return;
        }

        if (data.session) {
          if (referralCode) {
            try {
              const response = await fetch('/api/user/link-referral', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${data.session.access_token}`
                },
                body: JSON.stringify({ referralCode })
              });

              const result = await response.json();
              if (result.success) {
                console.log('Referral linked successfully:', result.message);
              } else {
                console.warn('Failed to link referral:', result.error);
              }
            } catch (err) {
              console.error('Failed to link referral:', err);
            }
          }

          if (typeof window !== 'undefined') {
            localStorage.removeItem('referralCode');
          }

          // If opened as popup, close the window — parent detects auth via onAuthStateChange
          if (window.opener) {
            window.close();
            return;
          }

          // Fallback: full-page redirect for non-popup flows (e.g. login page)
          window.history.replaceState({}, document.title, window.location.pathname);
          router.push('/');
        } else {
          const { data: userData } = await supabase.auth.getUser();

          if (userData.user) {
            if (window.opener) {
              window.close();
              return;
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            router.push('/');
          } else {
            console.log('No session found, redirecting to home');
            if (window.opener) {
              window.close();
              return;
            }
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed');
        if (window.opener) {
          setTimeout(() => window.close(), 2000);
        } else {
          setTimeout(() => router.push('/'), 3000);
        }
      }
    };

    const timer = setTimeout(handleAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <p className="text-red-600 mb-4">Authentication failed: {error}</p>
            <p className="text-gray-600">
              {window.opener ? 'Closing window...' : 'Redirecting to homepage...'}
            </p>
          </div>
        ) : (
          <div>
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Completing sign in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
