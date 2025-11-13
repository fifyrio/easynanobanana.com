'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import toast from 'react-hot-toast';

export default function SubscriptionCard() {
  const { subscription, hasSubscription, loading, cancelSubscription } = useSubscription();
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!confirm('Cancel your subscription? You\'ll keep access until the end of your billing period.')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelSubscription();
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!hasSubscription || !subscription) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 border border-yellow-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-4">Subscribe to get monthly credits automatically and unlock premium features.</p>
            <Link
              href="/pricing"
              className="inline-flex items-center text-yellow-700 hover:text-yellow-800 font-medium"
            >
              View Plans
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const periodEndDate = new Date(subscription.currentPeriodEnd);
  const isExpiringSoon = subscription.daysRemaining <= 7;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900">{subscription.planName}</h3>
            {subscription.cancelAtPeriodEnd && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                Cancelling
              </span>
            )}
          </div>
          <p className="text-gray-600">
            ${subscription.price.toFixed(2)}/{subscription.currency === 'USD' ? 'month' : subscription.currency}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl mb-1">🚀</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Credits/Month</div>
          <div className="text-2xl font-bold text-gray-900">{subscription.creditsIncluded}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Current Balance</div>
          <div className="text-2xl font-bold text-yellow-600">{subscription.creditsRemaining}</div>
        </div>
      </div>

      {/* Billing Info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${
            subscription.status === 'active' ? 'text-green-600' : 'text-gray-600'
          }`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Renews in:</span>
          <span className={`font-medium ${
            isExpiringSoon ? 'text-orange-600' : 'text-gray-900'
          }`}>
            {subscription.daysRemaining} days
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Next billing:</span>
          <span className="font-medium text-gray-900">
            {periodEndDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Expiring Soon Warning */}
      {isExpiringSoon && !subscription.cancelAtPeriodEnd && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-orange-900 mb-1">Subscription expiring soon</p>
              <p className="text-orange-700">Your subscription will expire in {subscription.daysRemaining} days. Please renew to keep your benefits.</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {!subscription.cancelAtPeriodEnd ? (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
        </button>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">
            Your subscription will end on
          </p>
          <p className="font-medium text-gray-900">
            {periodEndDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            You&apos;ll keep access until then
          </p>
        </div>
      )}

      {/* Renewal Note for MVP */}
      {isExpiringSoon && !subscription.cancelAtPeriodEnd && (
        <p className="text-xs text-gray-500 text-center mt-4">
          Note: You&apos;ll need to manually renew your subscription when it expires.
        </p>
      )}
    </div>
  );
}
