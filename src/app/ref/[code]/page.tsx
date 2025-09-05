'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Header from '@/components/common/Header';

export default function ReferralPage() {
  const router = useRouter();
  const params = useParams();
  const { user, signInWithGoogle } = useAuth();
  const [referralInfo, setReferralInfo] = useState<{
    referrerName: string;
    valid: boolean;
    loading: boolean;
    error?: string;
  }>({ referrerName: '', valid: false, loading: true });

  const referralCode = params.code as string;

  useEffect(() => {
    // Store referral code in localStorage for later use during registration
    if (referralCode) {
      localStorage.setItem('referralCode', referralCode);
    }

    // Validate referral code and get referrer info
    const validateReferral = async () => {
      try {
        const response = await fetch(`/api/referral/validate?code=${referralCode}`);
        const data = await response.json();
        
        if (data.valid) {
          setReferralInfo({
            referrerName: data.referrerName,
            valid: true,
            loading: false
          });
        } else {
          setReferralInfo({
            referrerName: '',
            valid: false,
            loading: false,
            error: 'Invalid or expired referral code'
          });
        }
      } catch (error) {
        console.error('Error validating referral:', error);
        setReferralInfo({
          referrerName: '',
          valid: false,
          loading: false,
          error: 'Failed to validate referral code'
        });
      }
    };

    validateReferral();
  }, [referralCode]);

  useEffect(() => {
    // If user is already signed in and we have a valid referral, redirect to main page
    if (user && referralInfo.valid) {
      router.push('/');
    }
  }, [user, referralInfo.valid, router]);

  const handleSignInWithReferral = async () => {
    // The referral code is already stored in localStorage
    // It will be processed when the user profile is created
    await signInWithGoogle();
  };

  if (referralInfo.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Validating referral code...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!referralInfo.valid) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Referral Link</h1>
            <p className="text-gray-600 mb-8">{referralInfo.error}</p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg"
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    // User is already signed in
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome Back!</h1>
            <p className="text-gray-600 mb-8">
              You&apos;re already signed in. Redirecting you to the main page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🎁</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You&apos;ve Been Invited!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              <span className="font-medium">{referralInfo.referrerName}</span> invited you to join
            </p>
            <p className="text-2xl font-bold text-yellow-600 mb-8">EasyNanoBanana</p>
            
            <div className="bg-gradient-to-r from-yellow-50 to-green-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Your Signup Bonus</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-bold text-green-600">20</span>
                  <span className="text-gray-700">FREE credits to start creating</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-bold text-yellow-600">6</span>
                  <span className="text-gray-700">Welcome bonus credits</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl font-bold text-blue-600">26</span>
                    <span className="text-lg font-medium text-gray-900">Total FREE credits!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What you can create:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="text-sm font-medium">AI Art</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">📸</div>
                  <div className="text-sm font-medium">Photo Editing</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">🖼️</div>
                  <div className="text-sm font-medium">Image Effects</div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSignInWithReferral}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 text-lg font-medium mb-4"
            >
              Sign Up with Google & Get 26 FREE Credits
            </Button>

            <p className="text-xs text-gray-500">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}