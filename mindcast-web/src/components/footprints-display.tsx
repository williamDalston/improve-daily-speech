'use client';

import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Footprint {
  timestamp: string;
  action: string;
  detail: string;
}

interface FootprintsDisplayProps {
  footprints: Footprint[];
  className?: string;
}

export function FootprintsDisplay({ footprints, className }: FootprintsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new footprints arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [footprints]);

  if (!footprints || footprints.length === 0) {
    return null;
  }

  // Show last 5 footprints
  const recentFootprints = footprints.slice(-5);

  return (
    <div className={cn('rounded-xl border border-border bg-surface-secondary', className)}>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Activity className="h-4 w-4 text-brand animate-pulse" />
        <span className="text-xs font-medium text-text-primary">AI Activity</span>
        <span className="ml-auto text-xs text-text-muted">
          {footprints.length} actions
        </span>
      </div>
      <div
        ref={containerRef}
        className="max-h-[160px] overflow-y-auto p-2 space-y-1.5"
      >
        {recentFootprints.map((footprint, idx) => {
          const isLatest = idx === recentFootprints.length - 1;
          const time = new Date(footprint.timestamp);
          const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div
              key={`${footprint.timestamp}-${idx}`}
              className={cn(
                'flex items-start gap-2 rounded-lg px-2 py-1.5 transition-all',
                isLatest ? 'bg-brand/10 animate-fade-in' : 'opacity-70'
              )}
            >
              <div
                className={cn(
                  'mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0',
                  isLatest ? 'bg-brand animate-pulse' : 'bg-text-muted'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs font-medium truncate',
                    isLatest ? 'text-brand' : 'text-text-secondary'
                  )}>
                    {footprint.action}
                  </span>
                  <span className="text-xs text-text-muted ml-auto flex-shrink-0">
                    {timeStr}
                  </span>
                </div>
                <p className="text-xs text-text-muted truncate">
                  {footprint.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
