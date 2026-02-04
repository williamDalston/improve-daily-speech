/**
 * Rate Limiting Utility
 *
 * Uses Upstash Redis for production (survives serverless restarts)
 * Falls back to in-memory for local development.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// REDIS SETUP (production)
// ─────────────────────────────────────────────────────────────────────────────

let redis: Redis | null = null;
const rateLimiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

function getOrCreateRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  const key = `${config.identifier}:${config.limit}:${config.windowSeconds}`;

  if (!rateLimiters.has(key)) {
    rateLimiters.set(
      key,
      new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds}s`),
        prefix: `ratelimit:${config.identifier}`,
        analytics: true,
      })
    );
  }

  return rateLimiters.get(key)!;
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY FALLBACK (development)
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  memoryStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      memoryStore.delete(key);
    }
  });
}

function checkMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const fullKey = `${config.identifier}:${key}`;
  const windowMs = config.windowSeconds * 1000;

  const existing = memoryStore.get(fullKey);

  if (!existing || existing.resetTime < now) {
    memoryStore.set(fullKey, {
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

  if (existing.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetIn: Math.ceil((existing.resetTime - now) / 1000),
    };
  }

  existing.count++;

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - existing.count,
    resetIn: Math.ceil((existing.resetTime - now) / 1000),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a request is within rate limits
 * Uses Redis when UPSTASH_REDIS_* env vars are set, otherwise falls back to in-memory
 *
 * @param key - Unique identifier (usually IP or user ID)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const rateLimiter = getOrCreateRateLimiter(config);

  // Use in-memory fallback if Redis is not configured
  if (!rateLimiter) {
    return checkMemoryRateLimit(key, config);
  }

  try {
    const result = await rateLimiter.limit(key);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetIn: Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    // If Redis fails, fall back to in-memory (fail open with logging)
    console.error('[Rate Limit] Redis error, falling back to in-memory:', error);
    return checkMemoryRateLimit(key, config);
  }
}

/**
 * Synchronous rate limit check - only uses in-memory (for backwards compatibility)
 * @deprecated Use async checkRateLimit instead
 */
export function checkRateLimitSync(key: string, config: RateLimitConfig): RateLimitResult {
  // Only in-memory for sync calls
  return checkMemoryRateLimit(key, config);
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

  // Instant Host - conversational AI
  instantHost: {
    limit: 60,
    windowSeconds: 60, // 60 per minute
    identifier: 'instant-host',
  },

  // TTS - audio generation
  tts: {
    limit: 30,
    windowSeconds: 60, // 30 per minute
    identifier: 'tts',
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

/**
 * Check if Redis is available for rate limiting
 */
export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
