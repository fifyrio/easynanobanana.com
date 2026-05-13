'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  credits: number | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to ensure user profile exists
  const ensureProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      // First try to get existing profile
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        return existingProfile;
      }

      // If no profile exists, create one via API
      // Check for referral code in localStorage
      const referralCode = typeof window !== 'undefined' ? localStorage.getItem('referralCode') : null;
      
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode })
      });

      if (response.ok) {
        const { profile } = await response.json();
        
        // Clear referral code from localStorage after successful profile creation
        if (referralCode && typeof window !== 'undefined') {
          localStorage.removeItem('referralCode');
        }
        
        return profile;
      } else {
        console.error('Failed to create profile via API');
        return null;
      }
    } catch (error) {
      console.error('Error ensuring profile:', error);
      return null;
    }
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      
      if (sessionUser) {
        const userProfile = await ensureProfile(sessionUser);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        
        if (sessionUser) {
          // Small delay to ensure database trigger has completed
          setTimeout(async () => {
            const userProfile = await ensureProfile(sessionUser);
            setProfile(userProfile);
          }, 1000);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const referralCode = typeof window !== 'undefined' ? localStorage.getItem('referralCode') : null;

    const redirectUrl = referralCode
      ? `${window.location.origin}/auth/callback?ref=${referralCode}`
      : `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error.message);
      return;
    }

    if (data.url) {
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        data.url,
        'google-auth',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );

      // Poll for popup close, then sync session from localStorage into this client
      if (popup) {
        const pollTimer = setInterval(async () => {
          if (popup.closed) {
            clearInterval(pollTimer);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              setUser(session.user);
              const userProfile = await ensureProfile(session.user);
              setProfile(userProfile);
              setLoading(false);
            }
          }
        }, 500);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}