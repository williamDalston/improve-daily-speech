/**
 * Rate Limiting Utility
 *
 * In-memory rate limiter for API routes.
 * For production at scale, consider upgrading to Redis-based limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart - acceptable for serverless)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Identifier for the rate limit (e.g., 'api', 'generate', 'ask') */
  identifier: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetIn: number; // seconds until reset
}

/**
 * Check if a request is within rate limits
 * @param key - Unique identifier (usually IP or user ID)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const fullKey = `${config.identifier}:${key}`;
  const windowMs = config.windowSeconds * 1000;

  const existing = rateLimitStore.get(fullKey);

  if (!existing || existing.resetTime < now) {
    // Create new entry
    rateLimitStore.set(fullKey, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
    };
  }

  // Check if over limit
  if (existing.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetIn: Math.ceil((existing.resetTime - now) / 1000),
    };
  }

  // Increment count
  existing.count++;

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - existing.count,
    resetIn: Math.ceil((existing.resetTime - now) / 1000),
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetIn.toString(),
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimits = {
  // Episode generation - expensive, limit strictly
  generate: {
    limit: 10,
    windowSeconds: 60 * 60, // 10 per hour
    identifier: 'generate',
  },

  // Ask feature - moderate limit
  ask: {
    limit: 30,
    windowSeconds: 60, // 30 per minute
    identifier: 'ask',
  },

  // Add-on generation (quiz, journal, takeaways)
  addon: {
    limit: 20,
    windowSeconds: 60, // 20 per minute
    identifier: 'addon',
  },

  // Reflect (Sovereign Mind)
  reflect: {
    limit: 15,
    windowSeconds: 60, // 15 per minute
    identifier: 'reflect',
  },

  // Daily Drop
  dailyDrop: {
    limit: 5,
    windowSeconds: 60 * 60, // 5 per hour (should only be 1 per day anyway)
    identifier: 'daily-drop',
  },

  // Playlists - general CRUD
  playlists: {
    limit: 60,
    windowSeconds: 60, // 60 per minute
    identifier: 'playlists',
  },

  // Auth attempts
  auth: {
    limit: 10,
    windowSeconds: 60 * 15, // 10 per 15 minutes
    identifier: 'auth',
  },

  // General API (catch-all)
  general: {
    limit: 100,
    windowSeconds: 60, // 100 per minute
    identifier: 'general',
  },
} as const;

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback (may be undefined in some environments)
  return 'unknown';
}

/**
 * Create a rate-limited response
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please slow down.',
      retryAfter: result.resetIn,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.resetIn.toString(),
        ...getRateLimitHeaders(result),
      },
    }
  );
}
