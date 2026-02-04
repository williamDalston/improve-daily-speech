'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="mb-4 text-6xl font-bold text-gray-900">Oops!</h1>
            <h2 className="mb-4 text-2xl font-semibold text-gray-700">
              Something went wrong
            </h2>
            <p className="mb-8 max-w-md text-gray-600">
              We've been notified and are working to fix the issue. Please try
              again.
            </p>
            <button
              onClick={() => reset()}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
