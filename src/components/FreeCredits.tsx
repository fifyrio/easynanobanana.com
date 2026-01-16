'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from './ui/Button';
import SocialShareModal from './ui/SocialShareModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useDailyClaimStatus } from '@/hooks/useDailyClaimStatus';

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
  const t = useTranslations('freeCredits');
  const router = useRouter();
  const { user, signInWithGoogle, profile, refreshProfile } = useAuth();
  const { setClaimedToday } = useDailyClaimStatus();
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
      toast.error(t('error.fetch'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

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
      toast.success(result.message); // Keep server message or translate? Usually server messages are hard to translate client side unless we send codes.
      
      // Refresh data
      await Promise.all([fetchCreditData(), refreshProfile()]);
      setClaimedToday(user, profile?.credits || 0);
      
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error instanceof Error ? error.message : t('error.checkIn'));
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
          title: t('sections.earn.options.checkIn.title'),
          description: t('sections.earn.options.checkIn.desc'),
          reward: '+5 Credits', // Keep static for now or translate 'Credits'
          action: t('sections.earn.options.invite.signIn'),
          onClick: signInWithGoogle
        },
        {
          icon: '👥',
          title: t('sections.earn.options.invite.title'),
          description: t('sections.earn.options.invite.desc'),
          reward: '+40 Credits',
          action: t('sections.earn.options.invite.signIn'),
          onClick: signInWithGoogle
        }
      ];
    }

    return [
      {
        icon: '📅',
        title: t('sections.earn.options.checkIn.title'),
        description: creditData?.canCheckIn
          ? t('sections.earn.options.checkIn.desc')
          : t('sections.earn.options.checkIn.descDone', { days: creditData?.consecutiveCheckIns || 0 }),
        reward: '+5 Credits',
        action: actionLoading === 'check-in' 
          ? t('sections.earn.options.checkIn.checking') 
          : creditData?.canCheckIn 
            ? t('sections.earn.options.checkIn.button') 
            : t('sections.earn.options.checkIn.completed'),
        disabled: !creditData?.canCheckIn || actionLoading === 'check-in',
        onClick: handleCheckIn
      },
      {
        icon: '👥',
        title: t('sections.earn.options.invite.title'),
        description: t('sections.earn.options.invite.descLogged', { amount: creditData?.referralStats?.totalEarned || 0 }),
        reward: '+40 Credits',
        action: t('sections.earn.options.invite.button'),
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
            {t('login.title')}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            {t('login.description')}
          </p>
          <Button
            onClick={signInWithGoogle}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-medium"
          >
            {t('login.button')}
          </Button>
        </div>
        
        {/* Preview of earning options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('login.waysToEarn')}</h2>
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
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Credits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.credits.title')}</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="text-sm text-gray-600 mb-2">{t('sections.credits.balance')}</div>
            <div className="text-4xl font-bold text-gray-900">{creditData?.credits || profile?.credits || 0}</div>
            {creditData?.consecutiveCheckIns && creditData?.consecutiveCheckIns > 0 && (
              <div className="mt-2 text-sm text-green-600">
                {t('sections.credits.streak', { days: creditData.consecutiveCheckIns })}
              </div>
            )}
          </div>
          
          {/* Recent Activity */}
          {creditData?.recentTransactions && creditData?.recentTransactions?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('sections.credits.activity')}</h3>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('sections.earn.title')}</h2>
          <div className="space-y-5">
            {getEarnMoreOptions().map((option, index) => (
              <div key={index} className="group p-5 bg-gradient-to-r from-gray-50 to-gray-50/50 hover:from-yellow-50 hover:to-yellow-50/30 rounded-xl border border-gray-100 hover:border-yellow-200 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-200">
                      {option.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{option.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-3 ml-4">
                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 text-center">
                        {option.reward}
                      </span>
                    </div>
                    <Button 
                      onClick={option.onClick}
                      disabled={option.disabled}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                        option.disabled 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : option.title === 'Invite Friends'
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      {option.action}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Friends Section */}
      <div className="mt-8 grid grid-cols-1 gap-8">
        {/* Invite Friends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.invite.title')}</h2>
          
          {/* Referral Stats */}
          {creditData?.referralStats && (
            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{creditData?.referralStats?.total || 0}</div>
                <div className="text-xs text-gray-600">{t('sections.invite.stats.total')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{creditData?.referralStats?.completed || 0}</div>
                <div className="text-xs text-gray-600">{t('sections.invite.stats.signed')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{creditData?.referralStats?.totalEarned || 0}</div>
                <div className="text-xs text-gray-600">{t('sections.invite.stats.earned')}</div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sections.invite.link.label')}
            </label>
            <div className="flex">
              <input
                type="text"
                value={creditData?.referralLink || t('sections.invite.link.placeholder')}
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
            <div className="text-gray-500 text-sm mb-4">{t('sections.invite.share.text')}</div>
            <div className="text-xs text-gray-500">
              {t('sections.invite.share.subtext')}
            </div>
          </div>
        </div>

        {/* Invited Friends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.friends.title')}</h2>
          
          {!creditData?.referralStats?.referrals || creditData?.referralStats?.referrals?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p>{t('sections.friends.empty.title')}</p>
              <p className="text-sm">{t('sections.friends.empty.text')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 pb-2 border-b border-gray-100">
                <div>{t('sections.friends.table.friend')}</div>
                <div>{t('sections.friends.table.status')}</div>
                <div>{t('sections.friends.table.earned')}</div>
              </div>
              {creditData?.referralStats?.referrals?.map((referral) => {
                const statusConfig = {
                  completed: { label: t('sections.friends.status.completed'), color: 'text-green-600 bg-green-50' },
                  pending: { label: t('sections.friends.status.pending'), color: 'text-yellow-600 bg-yellow-50' },
                  invalid: { label: t('sections.friends.status.invalid'), color: 'text-red-600 bg-red-50' }
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.rules.title')}</h2>
        <div className="text-gray-600 text-sm leading-relaxed">
          <p>
            {t.rich('sections.rules.text', {
              link: (chunks) => <Link href="/terms" className="text-yellow-600 hover:underline">{chunks}</Link>
            })}
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
