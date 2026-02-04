'use client';

import { Flame, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  className?: string;
  showDetails?: boolean;
}

export function StreakBadge({
  currentStreak,
  longestStreak,
  totalXp,
  className,
  showDetails = false,
}: StreakBadgeProps) {
  // Determine streak status for visual feedback
  const isOnFire = currentStreak >= 7;
  const isHot = currentStreak >= 3;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Streak Counter */}
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-all',
          isOnFire
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            : isHot
            ? 'bg-orange-100 text-orange-700'
            : currentStreak > 0
            ? 'bg-surface-secondary text-text-primary'
            : 'bg-surface-tertiary text-text-muted'
        )}
      >
        <Flame
          className={cn(
            'h-4 w-4',
            isOnFire && 'animate-pulse',
            currentStreak === 0 && 'opacity-50'
          )}
        />
        <span className="text-sm">
          {currentStreak} day{currentStreak !== 1 ? 's' : ''}
        </span>
      </div>

      {/* XP Badge */}
      <div className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-brand">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-medium">{totalXp.toLocaleString()} XP</span>
      </div>

      {/* Details section (optional) */}
      {showDetails && longestStreak > 0 && (
        <div className="flex items-center gap-1.5 text-text-muted">
          <Trophy className="h-4 w-4" />
          <span className="text-xs">Best: {longestStreak} days</span>
        </div>
      )}
    </div>
  );
}

// Compact version for navbar
export function StreakBadgeCompact({
  currentStreak,
  totalXp,
}: {
  currentStreak: number;
  totalXp: number;
}) {
  const isOnFire = currentStreak >= 7;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          isOnFire
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            : currentStreak > 0
            ? 'bg-orange-100 text-orange-700'
            : 'bg-surface-tertiary text-text-muted'
        )}
      >
        <Flame className={cn('h-3 w-3', isOnFire && 'animate-pulse')} />
        {currentStreak}
      </div>
      <div className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
        <Zap className="h-3 w-3" />
        {totalXp >= 1000 ? `${(totalXp / 1000).toFixed(1)}k` : totalXp}
      </div>
    </div>
  );
}
