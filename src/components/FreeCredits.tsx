'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from './ui/Button';
import SocialShareModal from './ui/SocialShareModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface CreditData {
  credits: number;
  referralCode: string;
  referralLink: string;
  canCheckIn: boolean;
  consecutiveCheckIns: number;
  referralStats: {
    total: number;
    completed: number;
    pending: number;
    totalEarned: number;
    referrals: Array<{
      id: string;
      email: string;
      name: string;
      status: string;
      reward: number;
      createdAt: string;
      completedAt?: string;
    }>;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    transaction_type: string;
    description: string;
    created_at: string;
  }>;
}

export default function FreeCredits() {
  const router = useRouter();
  const { user, signInWithGoogle, profile, refreshProfile } = useAuth();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch user credit data
  const fetchCreditData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log('ww', response);
        throw new Error('Failed to fetch credit data');
      }

      const data = await response.json();
      setCreditData(data);
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
      toast.error('Failed to load credit information');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCreditData();
  }, [user, fetchCreditData]);

  const openShareModal = () => {
    if (!creditData?.referralLink) return;
    setShowShareModal(true);
  };

  const handleCheckIn = async () => {
    if (!user || !creditData?.canCheckIn) return;
    
    setActionLoading('check-in');
    
    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      
      const response = await fetch('/api/credits/check-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Check-in failed');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Refresh data
      await Promise.all([fetchCreditData(), refreshProfile()]);
      
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };


  // Generate earn more options based on user state
  const getEarnMoreOptions = () => {
    if (!user) {
      return [
        {
          icon: '📅',
          title: 'Daily Check-in',
          description: 'Check in daily to earn 1 credit.',
          reward: '+1 Credit',
          action: 'Sign In',
          onClick: signInWithGoogle
        },
        {
          icon: '👥',
          title: 'Invite Friends',
          description: 'Invite friends to sign up and earn 10 credits per signup, 30 more when they purchase.',
          reward: '+40 Credits',
          action: 'Sign In',
          onClick: signInWithGoogle
        }
      ];
    }

    return [
      {
        icon: '📅',
        title: 'Daily Check-in',
        description: creditData?.canCheckIn 
          ? 'Check in daily to earn 1 credit.'
          : `Already checked in today! Come back tomorrow. Streak: ${creditData?.consecutiveCheckIns || 0} days.`,
        reward: '+1 Credit',
        action: actionLoading === 'check-in' ? 'Checking in...' : creditData?.canCheckIn ? 'Check In' : 'Completed',
        disabled: !creditData?.canCheckIn || actionLoading === 'check-in',
        onClick: handleCheckIn
      },
      {
        icon: '👥',
        title: 'Invite Friends',
        description: `Invite friends to earn 10 credits per signup and 30 more when they purchase. You've earned ${creditData?.referralStats?.totalEarned || 0} credits so far.`,
        reward: '+40 Credits',
        action: 'Share Link',
        onClick: openShareModal
      }
    ];
  };

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free Credits
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Sign in to view your credits and start earning more through daily check-ins,
            tutorials, and friend referrals.
          </p>
          <Button
            onClick={signInWithGoogle}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-medium"
          >
            Sign In to Continue
          </Button>
        </div>
        
        {/* Preview of earning options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ways to Earn Credits</h2>
          <div className="space-y-4">
            {getEarnMoreOptions().map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{option.title}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">{option.reward}</div>
                  <Button
                    size="sm"
                    onClick={option.onClick}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 mt-1"
                  >
                    {option.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your credit information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Free Credits
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Credits are used to generate and edit images. Earn more credits by 
          completing tasks or inviting friends.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Credits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Credits</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Current Balance</div>
            <div className="text-4xl font-bold text-gray-900">{creditData?.credits || profile?.credits || 0}</div>
            {creditData?.consecutiveCheckIns && creditData?.consecutiveCheckIns > 0 && (
              <div className="mt-2 text-sm text-green-600">
                🔥 {creditData?.consecutiveCheckIns} day streak!
              </div>
            )}
          </div>
          
          {/* Recent Activity */}
          {creditData?.recentTransactions && creditData?.recentTransactions?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {creditData?.recentTransactions?.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 truncate mr-2">{transaction.description}</span>
                    <span className={`font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Earn More */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Earn More</h2>
          <div className="space-y-4">
            {getEarnMoreOptions().map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{option.title}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600 mb-1">{option.reward}</div>
                  <Button 
                    size="sm" 
                    onClick={option.onClick}
                    disabled={option.disabled}
                    className={`text-xs px-3 py-1 ${
                      option.disabled 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                  >
                    {option.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Friends Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invite Friends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Friends</h2>
          
          {/* Referral Stats */}
          {creditData?.referralStats && (
            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{creditData?.referralStats?.total || 0}</div>
                <div className="text-xs text-gray-600">Total Invites</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{creditData?.referralStats?.completed || 0}</div>
                <div className="text-xs text-gray-600">Signed Up</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{creditData?.referralStats?.totalEarned || 0}</div>
                <div className="text-xs text-gray-600">Credits Earned</div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Referral Link
            </label>
            <div className="flex">
              <input
                type="text"
                value={creditData?.referralLink || 'Sign in to get your referral link'}
                readOnly
                className="flex-1 p-3 border border-gray-200 rounded-l-lg bg-gray-50 text-gray-700"
              />
              <Button 
                onClick={openShareModal}
                className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-l-none px-4"
                disabled={!creditData?.referralLink}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="text-center py-8">
            <div className="text-gray-500 text-sm mb-4">Share your referral link to earn 30 credits per signup!</div>
            <div className="text-xs text-gray-500">
              Your friends will also get 20 credits when they sign up.
            </div>
          </div>
        </div>

        {/* Invited Friends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invited Friends</h2>
          
          {!creditData?.referralStats?.referrals || creditData?.referralStats?.referrals?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p>No friends invited yet.</p>
              <p className="text-sm">Share your referral link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 pb-2 border-b border-gray-100">
                <div>Friend</div>
                <div>Status</div>
                <div>Earned</div>
              </div>
              {creditData?.referralStats?.referrals?.map((referral) => {
                const statusConfig = {
                  completed: { label: 'Purchased', color: 'text-green-600 bg-green-50' },
                  pending: { label: 'Signed Up', color: 'text-yellow-600 bg-yellow-50' },
                  invalid: { label: 'Invalid', color: 'text-red-600 bg-red-50' }
                };
                const config = statusConfig[referral.status as keyof typeof statusConfig] || 
                             { label: referral.status, color: 'text-gray-600 bg-gray-50' };
                
                return (
                  <div key={referral.id} className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-gray-900 truncate" title={referral.email}>{referral.name}</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="text-gray-900 font-medium">
                      +{referral.reward}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rules and Abuse Policy */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Rules and Abuse Policy</h2>
        <div className="text-gray-600 text-sm leading-relaxed">
          <p>
            Credits are non-transferable and have no monetary value. Any abuse of the referral program 
            or other credit-earning methods may result in account suspension or termination. Please refer to our{' '}
            <a href="/terms" className="text-yellow-600 hover:underline">Terms of Service</a> for more details.
          </p>
        </div>
      </div>

      {/* Social Share Modal */}
      <SocialShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        referralLink={creditData?.referralLink || ''}
      />
    </div>
  );
}