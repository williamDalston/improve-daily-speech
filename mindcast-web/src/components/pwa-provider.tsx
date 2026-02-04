'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/hooks/use-service-worker';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isUpdateAvailable, update } = useServiceWorker();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [isUpdateAvailable]);

  return (
    <>
      {children}

      {/* Update prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-brand/10 p-2">
                <RefreshCw className="h-4 w-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-text-primary">
                  Update Available
                </h4>
                <p className="text-xs text-text-secondary mt-1">
                  A new version of MindCast is ready.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      update();
                      setShowUpdatePrompt(false);
                    }}
                    className="h-8 text-xs"
                  >
                    Update Now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowUpdatePrompt(false)}
                    className="h-8 text-xs"
                  >
                    Later
                  </Button>
                </div>
              </div>
              <button
                onClick={() => setShowUpdatePrompt(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-tertiary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
