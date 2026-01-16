'use client';

import { useState, useEffect, useCallback } from 'react';

// Cache data structure for extensibility
export interface DailyClaimCacheData {
  credits: number;
  updated_time: number; // Unix timestamp in seconds
  user_id: string;
  has_claimed: boolean;
  email: string;
  user_name: string;
  avatar_url: string;
}

interface UserInfo {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

interface UseDailyClaimStatusOptions {
  cacheKey?: string;
}

interface UseDailyClaimStatusReturn {
  hasClaimedToday: boolean;
  setClaimedToday: (user: UserInfo, credits?: number) => void;
  getCachedData: () => DailyClaimCacheData | null;
  clearCache: () => void;
}

const DEFAULT_CACHE_KEY = 'daily_credits_claim_status';

/**
 * Hook for managing daily claim status with localStorage caching
 * Cache automatically resets when the date changes
 */
export function useDailyClaimStatus(
  options: UseDailyClaimStatusOptions = {}
): UseDailyClaimStatusReturn {
  const { cacheKey = DEFAULT_CACHE_KEY } = options;
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  // Get today's date string for comparison (YYYY-MM-DD)
  const getTodayDateString = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Load claimed status from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data: DailyClaimCacheData = JSON.parse(cached);
        // Check if the cached date matches today
        const cachedDate = new Date(data.updated_time * 1000).toISOString().split('T')[0];
        const today = getTodayDateString();
        if (cachedDate === today && data.has_claimed) {
          setHasClaimedToday(true);
        }
      }
    } catch {
      // Invalid cache, ignore
    }
  }, [cacheKey, getTodayDateString]);

  // Set claimed status and save to cache
  const setClaimedToday = useCallback(
    (user: UserInfo, credits: number = 0) => {
      setHasClaimedToday(true);

      const cacheData: DailyClaimCacheData = {
        credits,
        updated_time: Math.floor(Date.now() / 1000),
        user_id: user.id,
        has_claimed: true,
        email: user.email || '',
        user_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch {
        // localStorage might be full or disabled, ignore
      }
    },
    [cacheKey]
  );

  // Get cached data
  const getCachedData = useCallback((): DailyClaimCacheData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Invalid cache
    }
    return null;
  }, [cacheKey]);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
      setHasClaimedToday(false);
    } catch {
      // Ignore errors
    }
  }, [cacheKey]);

  return {
    hasClaimedToday,
    setClaimedToday,
    getCachedData,
    clearCache,
  };
}
