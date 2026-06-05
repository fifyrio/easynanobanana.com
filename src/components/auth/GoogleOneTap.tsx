'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    nonce?: string;
    use_fedcm_for_prompt?: boolean;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: 'signin' | 'signup' | 'use';
  }) => void;
  prompt: () => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default function GoogleOneTap() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (!GOOGLE_CLIENT_ID) {
      console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      return;
    }

    let cancelled = false;

    const initOneTap = async () => {
      if (!window.google?.accounts?.id) return;

      const rawNonce = generateNonce();
      const hashedNonce = await sha256(rawNonce);

      if (cancelled) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: CredentialResponse) => {
          try {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce: rawNonce,
            });

            if (error) {
              console.error('One Tap sign-in failed:', error.message);
              return;
            }

            // Persist referral code handling parity with OAuth flow
            const referralCode =
              typeof window !== 'undefined'
                ? localStorage.getItem('referralCode')
                : null;
            if (referralCode) {
              try {
                await fetch('/api/profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ referralCode }),
                });
                localStorage.removeItem('referralCode');
              } catch (err) {
                console.error('Failed to apply referral code:', err);
              }
            }
          } catch (err) {
            console.error('One Tap callback error:', err);
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
      });

      window.google.accounts.id.prompt();
    };

    // gsi/client may not be loaded yet; poll briefly
    const interval = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        window.clearInterval(interval);
        void initOneTap();
      }
    }, 200);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        // noop
      }
    };
  }, [user, loading]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      async
      defer
    />
  );
}
