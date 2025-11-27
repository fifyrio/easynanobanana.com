'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();

  // Show success message after subscription
  useEffect(() => {
    const subscribed = searchParams?.get('subscribed');
    if (subscribed === 'true') {
      toast.success('Subscription activated successfully! Your credits have been added.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Billing & Subscription
                </h1>
                <p className="text-gray-600">
                  Manage your subscription and billing information
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Current Balance</div>
                <div className="text-3xl font-bold text-yellow-600">{profile?.credits || 0}</div>
                <div className="text-xs text-gray-500 mt-1">credits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Subscription Card */}
          <div className="mb-8">
            <SubscriptionCard />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/pricing"
                className="flex items-center justify-between p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">View Plans</div>
                    <div className="text-sm text-gray-600">Upgrade or change plan</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/history"
                className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Usage History</div>
                    <div className="text-sm text-gray-600">View your generations</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Billing Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">Payment Method</div>
                  <div className="text-sm text-gray-600">Managed by Creem.io</div>
                </div>
                <span className="text-sm text-gray-500">Secure payment gateway</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">Account Email</div>
                  <div className="text-sm text-gray-600">{user?.email}</div>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <div className="font-medium text-gray-900">Account Status</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Have questions about your subscription or billing? Our support team is here to help.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('mailto:support@easynanobanana.com', '_blank')}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
