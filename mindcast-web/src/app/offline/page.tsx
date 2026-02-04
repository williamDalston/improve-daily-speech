import { WifiOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 rounded-full bg-surface-secondary p-6">
        <WifiOff className="h-12 w-12 text-text-muted" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-text-primary">
        You're Offline
      </h1>

      <p className="mb-6 max-w-sm text-text-secondary">
        It looks like you've lost your internet connection. Some features may be
        unavailable until you're back online.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Link>

        <Link
          href="/library"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 font-medium text-text-primary hover:bg-surface-secondary transition-colors"
        >
          View Cached Content
        </Link>
      </div>

      <p className="mt-8 text-sm text-text-muted">
        Tip: Episodes you've listened to recently may still be available
        offline.
      </p>
    </div>
  );
}
