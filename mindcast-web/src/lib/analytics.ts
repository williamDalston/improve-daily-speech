/**
 * Analytics Utility
 *
 * Lightweight analytics wrapper that can be connected to any provider.
 * Uses fetch-based approach for PostHog to avoid package dependency.
 */

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
};

type UserProperties = {
  id: string;
  email?: string;
  name?: string;
  isPro?: boolean;
  createdAt?: string;
};

// Store current user ID for event tracking
let currentUserId: string | null = null;

/**
 * Get PostHog configuration
 */
function getPostHogConfig() {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  return { apiKey, host };
}

/**
 * Send event to PostHog via API
 */
async function sendToPostHog(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const { apiKey, host } = getPostHogConfig();
  if (!apiKey) return;

  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event: eventName,
        properties: {
          ...properties,
          distinct_id: currentUserId || 'anonymous',
          $lib: 'mindcast-web',
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.debug('[Analytics] Failed to send event:', error);
  }
}

/**
 * Initialize analytics (call once on app load)
 */
export function initAnalytics(): void {
  // No-op for now - PostHog doesn't require initialization for API-based approach
}

/**
 * Identify a user for analytics
 */
export function identifyUser(user: UserProperties): void {
  if (typeof window === 'undefined') return;

  currentUserId = user.id;

  // Console logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Identify:', user);
    return;
  }

  // PostHog identify
  sendToPostHog('$identify', {
    $set: {
      email: user.email,
      name: user.name,
      is_pro: user.isPro,
      created_at: user.createdAt,
    },
  });
}

/**
 * Track an analytics event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  // Console logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Event:', event.name, event.properties);
    return;
  }

  sendToPostHog(event.name, event.properties);
}

/**
 * Track a page view
 */
export function trackPageView(url: string): void {
  if (typeof window === 'undefined') return;

  // Console logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Page View:', url);
    return;
  }

  sendToPostHog('$pageview', {
    $current_url: url,
    $pathname: new URL(url, window.location.origin).pathname,
  });
}

/**
 * Reset analytics (on logout)
 */
export function resetAnalytics(): void {
  currentUserId = null;
}

// Pre-defined events for type safety
export const Events = {
  // Authentication
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',

  // Episode creation
  EPISODE_STARTED: 'episode_started',
  EPISODE_COMPLETED: 'episode_completed',
  EPISODE_FAILED: 'episode_failed',
  EPISODE_CANCELLED: 'episode_cancelled',

  // Playback
  EPISODE_PLAYED: 'episode_played',
  EPISODE_PAUSED: 'episode_paused',
  EPISODE_COMPLETED_LISTENING: 'episode_completed_listening',
  AMBIENT_SOUND_SELECTED: 'ambient_sound_selected',

  // Learning features
  ASK_QUESTION_SUBMITTED: 'ask_question_submitted',
  QUIZ_STARTED: 'quiz_started',
  QUIZ_COMPLETED: 'quiz_completed',
  JOURNAL_OPENED: 'journal_opened',
  REFLECT_SUBMITTED: 'reflect_submitted',

  // Playlists
  PLAYLIST_CREATED: 'playlist_created',
  PLAYLIST_EPISODE_ADDED: 'playlist_episode_added',

  // Daily Drop
  DAILY_DROP_GENERATED: 'daily_drop_generated',

  // Subscription
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Sharing
  EPISODE_SHARED: 'episode_shared',
  RSS_FEED_COPIED: 'rss_feed_copied',
} as const;
