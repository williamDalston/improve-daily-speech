import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Adjust sample rate for performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Capture 100% of errors
  sampleRate: 1.0,

  // Set environment
  environment: process.env.NODE_ENV,

  // Add user context when available
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Filter request body
    if (event.request?.data) {
      try {
        const data = typeof event.request.data === 'string'
          ? JSON.parse(event.request.data)
          : event.request.data;

        // Remove sensitive fields
        if (data.password) data.password = '[FILTERED]';
        if (data.token) data.token = '[FILTERED]';
        if (data.apiKey) data.apiKey = '[FILTERED]';

        event.request.data = JSON.stringify(data);
      } catch {
        // Ignore parse errors
      }
    }

    return event;
  },
});
