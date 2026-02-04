'use client';

import { useEffect, useState } from 'react';
import { Flame, Zap, Trophy, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCelebrationProps {
  currentStreak: number;
  xpEarned: number;
  isNewDay: boolean;
  streakBroken?: boolean;
  milestone?: 7 | 30 | null;
  onClose: () => void;
}

export function StreakCelebration({
  currentStreak,
  xpEarned,
  isNewDay,
  streakBroken,
  milestone,
  onClose,
}: StreakCelebrationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  // Auto-close after 5 seconds for non-milestones
  useEffect(() => {
    if (!milestone) {
      const timer = setTimeout(handleClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  const isMilestone = milestone === 7 || milestone === 30;
  const isOnFire = currentStreak >= 7;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 transition-all duration-300 ease-out',
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div
        className={cn(
          'relative rounded-2xl border shadow-lg p-4 max-w-sm',
          isMilestone
            ? 'bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white'
            : streakBroken
            ? 'bg-surface border-border'
            : 'bg-surface border-brand/30'
        )}
      >
        <button
          onClick={handleClose}
          className={cn(
            'absolute top-2 right-2 p-1 rounded-full transition-colors',
            isMilestone
              ? 'hover:bg-white/20 text-white/80'
              : 'hover:bg-surface-tertiary text-text-muted'
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Milestone Celebration */}
        {isMilestone && (
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="relative">
                <Trophy className="h-12 w-12 text-yellow-300 animate-bounce" />
                <Star className="absolute -top-1 -right-1 h-5 w-5 text-yellow-200 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-bold">
              🎉 {milestone} Day Streak!
            </h3>
            <p className="text-sm opacity-90">
              {milestone === 7
                ? "You're on fire! Keep the momentum going."
                : "Incredible dedication! You're a learning machine."}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm">
                <Zap className="h-4 w-4" />
                +{xpEarned} XP
              </div>
            </div>
          </div>
        )}

        {/* Regular XP Earned */}
        {!isMilestone && !streakBroken && (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                isOnFire
                  ? 'bg-gradient-to-br from-orange-500 to-red-500'
                  : 'bg-brand/10'
              )}
            >
              <Flame
                className={cn(
                  'h-6 w-6',
                  isOnFire ? 'text-white animate-pulse' : 'text-brand'
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">
                  {currentStreak} day streak
                  {isNewDay && currentStreak > 1 && ' 🔥'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-brand">
                <Zap className="h-4 w-4" />
                <span>+{xpEarned} XP earned</span>
              </div>
            </div>
          </div>
        )}

        {/* Streak Broken */}
        {streakBroken && (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary">
              <Flame className="h-6 w-6 text-text-muted" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-text-primary">
                Streak reset
              </span>
              <p className="text-sm text-text-muted">
                No worries! Start fresh today.
              </p>
              <div className="flex items-center gap-1 text-sm text-brand mt-1">
                <Zap className="h-4 w-4" />
                <span>+{xpEarned} XP earned</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to manage streak celebrations
export function useStreakCelebration() {
  const [celebration, setCelebration] = useState<{
    currentStreak: number;
    xpEarned: number;
    isNewDay: boolean;
    streakBroken: boolean;
    milestone: 7 | 30 | null;
  } | null>(null);

  const showCelebration = (data: {
    currentStreak: number;
    xpEarned: number;
    isNewDay: boolean;
    streakBroken: boolean;
  }) => {
    let milestone: 7 | 30 | null = null;
    if (data.currentStreak === 7) milestone = 7;
    if (data.currentStreak === 30) milestone = 30;

    setCelebration({ ...data, milestone });
  };

  const hideCelebration = () => {
    setCelebration(null);
  };

  return {
    celebration,
    showCelebration,
    hideCelebration,
  };
}
