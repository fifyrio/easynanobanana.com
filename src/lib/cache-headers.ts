/**
 * Cache Header Utilities
 *
 * Provides standardized cache-control headers for different types of responses.
 * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 */

export interface CacheConfig {
  /**
   * Cache duration in seconds for the browser
   */
  maxAge?: number;

  /**
   * Cache duration in seconds for CDN/shared caches
   */
  sMaxAge?: number;

  /**
   * Stale-while-revalidate duration in seconds
   * Allows serving stale content while revalidating in background
   */
  staleWhileRevalidate?: number;

  /**
   * Whether this response can be cached by CDN/shared caches
   */
  isPublic?: boolean;

  /**
   * Whether response must be revalidated with server before using cached version
   */
  mustRevalidate?: boolean;
}

/**
 * Build Cache-Control header string from configuration
 */
export function buildCacheHeader(config: CacheConfig): string {
  const parts: string[] = [];

  // Public vs Private caching
  if (config.isPublic) {
    parts.push('public');
  } else {
    parts.push('private');
  }

  // Browser cache duration
  if (config.maxAge !== undefined) {
    parts.push(`max-age=${config.maxAge}`);
  }

  // CDN/shared cache duration
  if (config.sMaxAge !== undefined) {
    parts.push(`s-maxage=${config.sMaxAge}`);
  }

  // Stale-while-revalidate
  if (config.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  // Must revalidate
  if (config.mustRevalidate) {
    parts.push('must-revalidate');
  }

  return parts.join(', ');
}

/**
 * Predefined cache configurations for common scenarios
 */
export const CachePresets = {
  /**
   * No caching - always fetch fresh data
   * Use for: Authenticated user data, real-time information
   */
  NO_CACHE: {
    maxAge: 0,
    isPublic: false,
    mustRevalidate: true,
  } as CacheConfig,

  /**
   * Short cache - 1 minute browser, revalidate in background
   * Use for: User-specific data that changes occasionally (credits, profile)
   */
  SHORT_PRIVATE: {
    maxAge: 60,
    isPublic: false,
    staleWhileRevalidate: 300, // 5 minutes
  } as CacheConfig,

  /**
   * Medium cache - 5 minutes CDN, revalidate in background for 1 hour
   * Use for: Public data that updates regularly (prompt gallery)
   */
  MEDIUM_PUBLIC: {
    maxAge: 60,
    sMaxAge: 300, // 5 minutes
    isPublic: true,
    staleWhileRevalidate: 3600, // 1 hour
  } as CacheConfig,

  /**
   * Long cache - 1 hour CDN, revalidate in background for 24 hours
   * Use for: Static content, rarely changing data (categories, plans)
   */
  LONG_PUBLIC: {
    maxAge: 300, // 5 minutes
    sMaxAge: 3600, // 1 hour
    isPublic: true,
    staleWhileRevalidate: 86400, // 24 hours
  } as CacheConfig,

  /**
   * Very long cache - 24 hours CDN, revalidate in background for 7 days
   * Use for: Immutable content, images, static assets
   */
  IMMUTABLE_PUBLIC: {
    maxAge: 3600, // 1 hour
    sMaxAge: 86400, // 24 hours
    isPublic: true,
    staleWhileRevalidate: 604800, // 7 days
  } as CacheConfig,
};

/**
 * Helper to create response with cache headers
 */
export function createCachedResponse<T>(
  data: T,
  cacheConfig: CacheConfig,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': buildCacheHeader(cacheConfig),
    },
  });
}

/**
 * Helper to add cache headers to NextResponse
 */
export function addCacheHeaders(
  response: Response,
  cacheConfig: CacheConfig
): Response {
  response.headers.set('Cache-Control', buildCacheHeader(cacheConfig));
  return response;
}

/**
 * Cache duration constants (in seconds)
 */
export const CacheDuration = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  ONE_HOUR: 3600,
  SIX_HOURS: 21600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
} as const;
