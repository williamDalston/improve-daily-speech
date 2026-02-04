'use client';

import { AlertCircle, RefreshCw, Home, MessageSquare, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'network' | 'quota';
  onRetry?: () => void;
  onGoHome?: () => void;
  showSupport?: boolean;
  className?: string;
}

// Map error messages to user-friendly versions
const ERROR_MESSAGES: Record<string, { title: string; message: string; type: 'error' | 'warning' | 'network' | 'quota' }> = {
  'Failed to fetch': {
    title: 'Connection Lost',
    message: 'Please check your internet connection and try again.',
    type: 'network',
  },
  'NetworkError': {
    title: 'Network Error',
    message: 'Unable to connect to our servers. Please check your connection.',
    type: 'network',
  },
  'rate limit': {
    title: 'Slow Down',
    message: 'You\'re making requests too quickly. Please wait a moment and try again.',
    type: 'warning',
  },
  'quota': {
    title: 'Usage Limit Reached',
    message: 'You\'ve reached your free episode limit. Upgrade to Pro for unlimited episodes.',
    type: 'quota',
  },
  'timeout': {
    title: 'Request Timed Out',
    message: 'The request took too long. This might be due to high demand. Please try again.',
    type: 'network',
  },
  'cancelled': {
    title: 'Generation Cancelled',
    message: 'The episode generation was cancelled.',
    type: 'warning',
  },
};

function getErrorInfo(message: string): { title: string; message: string; type: 'error' | 'warning' | 'network' | 'quota' } {
  const lowerMessage = message.toLowerCase();

  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  return {
    title: 'Something Went Wrong',
    message: message || 'An unexpected error occurred. Please try again.',
    type: 'error',
  };
}

export function ErrorState({
  title,
  message,
  type,
  onRetry,
  onGoHome,
  showSupport = true,
  className,
}: ErrorStateProps) {
  const errorInfo = getErrorInfo(message);
  const displayTitle = title || errorInfo.title;
  const displayMessage = message === errorInfo.message ? message : errorInfo.message;
  const errorType = type || errorInfo.type;

  const iconColors = {
    error: 'text-error bg-error/10',
    warning: 'text-warning bg-warning/10',
    network: 'text-blue-500 bg-blue-500/10',
    quota: 'text-brand bg-brand/10',
  };

  const Icon = errorType === 'network' ? WifiOff : AlertCircle;

  return (
    <div className={cn('flex flex-col items-center text-center py-8 px-4', className)}>
      {/* Icon */}
      <div className={cn('mb-4 rounded-full p-4', iconColors[errorType])}>
        <Icon className="h-8 w-8" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-text-primary">
        {displayTitle}
      </h3>

      {/* Message */}
      <p className="mb-6 max-w-md text-sm text-text-secondary">
        {displayMessage}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}

        {onGoHome && (
          <Button variant="outline" onClick={onGoHome} className="gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        )}

        {errorType === 'quota' && (
          <Button variant="default" asChild>
            <a href="/pricing">Upgrade to Pro</a>
          </Button>
        )}
      </div>

      {/* Support Link */}
      {showSupport && errorType === 'error' && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-text-muted">
            Still having issues?{' '}
            <a
              href="https://github.com/anthropics/claude-code/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline inline-flex items-center gap-1"
            >
              <MessageSquare className="h-3 w-3" />
              Contact Support
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

// Inline error alert for forms
export function ErrorAlert({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl bg-error/10 p-4 text-error',
        className
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Error</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-error/70 hover:text-error"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
