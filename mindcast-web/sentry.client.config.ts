import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Adjust sample rate in production (1.0 = 100% of errors)
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

  // Capture 100% of errors
  sampleRate: 1.0,

  // Set environment
  environment: process.env.NODE_ENV,

  // Ignore certain errors
  ignoreErrors: [
    // Network errors
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // User aborted
    'AbortError',
    // Browser extensions
    /^chrome-extension:/,
    /^moz-extension:/,
  ],

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Capture 10% of all sessions
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Session Replay sample rates
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
});
