'use client';

import { useState } from 'react';
import Button from './ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function FreeCredits() {
  const [referralLink, setReferralLink] = useState('https://nanobanana.ai/ref/user123');
  const [friends, setFriends] = useState([
    { email: 'alice@example.com', status: 'Signed Up', statusColor: 'text-orange-600 bg-orange-50' },
    { email: 'bob@example.com', status: 'Pending', statusColor: 'text-yellow-600 bg-yellow-50' },
    { email: 'charlie@example.com', status: 'Signed Up', statusColor: 'text-orange-600 bg-orange-50' }
  ]);
  const { user, signInWithGoogle } = useAuth();

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    // You could add a toast notification here
  };

  const earnMoreOptions = [
    {
      icon: '🎓',
      title: 'Intro Tutorial',
      description: 'Complete the intro tutorial to earn 3 credits.',
      reward: '+3 Credits',
      action: 'Start Tutorial'
    },
    {
      icon: '📅',
      title: 'Daily Check-in',
      description: 'Check in daily to earn 1 credit.',
      reward: '+1 Credit',
      action: 'Check In'
    },
    {
      icon: '👥',
      title: 'Invite Friends',
      description: 'Invite friends to sign up and earn 30 credits per signup.',
      reward: '+30 Credits',
      action: 'Invite Now'
    }
  ];

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
            <div className="text-4xl font-bold text-gray-900">15</div>
          </div>
        </div>

        {/* Earn More */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Earn More</h2>
          <div className="space-y-4">
            {earnMoreOptions.map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{option.title}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={user ? undefined : signInWithGoogle}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1"
                >
                  {user ? option.reward : 'Sign in'}
                </Button>
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Referral Link
            </label>
            <div className="flex">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 p-3 border border-gray-200 rounded-l-lg bg-gray-50 text-gray-700"
              />
              <Button 
                onClick={copyReferralLink}
                className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-l-none px-4"
              >
                <i className="ri-file-copy-line"></i>
              </Button>
            </div>
          </div>

          <div className="text-center py-8">
            <div className="text-gray-500 text-sm mb-4">Or share your QR code</div>
            <div className="inline-block bg-yellow-400 p-8 rounded-lg">
              <div className="w-24 h-24 bg-white rounded flex items-center justify-center">
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 64 }, (_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 h-1 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invited Friends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invited Friends</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-700 pb-2 border-b border-gray-100">
              <div>Friend</div>
              <div>Status</div>
            </div>
            {friends.map((friend, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-900">{friend.email}</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${friend.statusColor}`}>
                    {friend.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
}