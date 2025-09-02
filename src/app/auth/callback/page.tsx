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
        // First, check for auth session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (data.session) {
          console.log('Authentication successful:', data.session.user);
          // Clear the URL hash and redirect
          window.history.replaceState({}, document.title, window.location.pathname);
          router.push('/');
        } else {
          // Try to get user session
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userData.user) {
            console.log('User authenticated:', userData.user);
            window.history.replaceState({}, document.title, window.location.pathname);
            router.push('/');
          } else {
            console.log('No session found, redirecting to home');
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError('Authentication failed');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    // Add a small delay to ensure DOM is ready
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
            <p className="text-gray-600">Redirecting to homepage...</p>
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