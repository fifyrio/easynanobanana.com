import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  id: string;
  planId: string;
  planName: string;
  creditsIncluded: number;
  creditsRemaining: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  daysRemaining: number;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  price: number;
  currency: string;
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  hasSubscription: boolean;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<boolean>;
}

/**
 * Custom hook to fetch and manage user subscription
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get access token from Supabase session
      const { supabase } = await import('@/lib/supabase');
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setHasSubscription(data.hasSubscription);
      setSubscription(data.subscription);

    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHasSubscription(false);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!user) {
      throw new Error('Must be logged in to cancel subscription');
    }

    try {
      // Get access token from Supabase session
      const { supabase } = await import('@/lib/supabase');
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
      return true;

    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      throw err;
    }
  }, [user, fetchSubscription]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    hasSubscription,
    loading,
    error,
    refreshSubscription: fetchSubscription,
    cancelSubscription
  };
}
