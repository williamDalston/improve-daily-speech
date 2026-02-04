import { db } from './db';

// XP rewards for various activities
export const XP_REWARDS = {
  EPISODE_CREATED: 100,
  STREAK_BONUS_7_DAYS: 50,
  STREAK_BONUS_30_DAYS: 200,
  QUIZ_COMPLETED: 25,
  REFLECTION_COMPLETED: 25,
} as const;

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  streakBroken: boolean;
  isNewDay: boolean;
}

/**
 * Check if two dates are on the same calendar day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date1 is exactly one day before date2
 */
function isYesterday(date1: Date, date2: Date): boolean {
  const yesterday = new Date(date2);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date1, yesterday);
}

/**
 * Update user's streak and XP when they complete an activity
 */
export async function updateStreak(
  userId: string,
  xpReward: number = XP_REWARDS.EPISODE_CREATED
): Promise<StreakInfo> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActivityDate: true,
      totalXp: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;

  let newStreak = user.currentStreak;
  let streakBroken = false;
  let isNewDay = false;
  let bonusXp = 0;

  if (!lastActivity) {
    // First activity ever
    newStreak = 1;
    isNewDay = true;
  } else if (isSameDay(lastActivity, now)) {
    // Same day activity - no streak change
    isNewDay = false;
  } else if (isYesterday(lastActivity, now)) {
    // Consecutive day - increment streak
    newStreak = user.currentStreak + 1;
    isNewDay = true;

    // Streak bonuses
    if (newStreak === 7) {
      bonusXp = XP_REWARDS.STREAK_BONUS_7_DAYS;
    } else if (newStreak === 30) {
      bonusXp = XP_REWARDS.STREAK_BONUS_30_DAYS;
    }
  } else {
    // Streak broken - reset to 1
    streakBroken = user.currentStreak > 0;
    newStreak = 1;
    isNewDay = true;
  }

  const newLongestStreak = Math.max(user.longestStreak, newStreak);
  const newTotalXp = user.totalXp + xpReward + bonusXp;

  await db.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: now,
      totalXp: newTotalXp,
    },
  });

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    totalXp: newTotalXp,
    streakBroken,
    isNewDay,
  };
}

/**
 * Get user's current streak info without updating
 */
export async function getStreakInfo(userId: string): Promise<StreakInfo | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActivityDate: true,
      totalXp: true,
    },
  });

  if (!user) {
    return null;
  }

  const now = new Date();
  const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;

  // Check if streak is still valid (activity yesterday or today)
  let currentStreak = user.currentStreak;
  let streakBroken = false;

  if (lastActivity) {
    const isToday = isSameDay(lastActivity, now);
    const wasYesterday = isYesterday(lastActivity, now);

    if (!isToday && !wasYesterday) {
      // Streak would be broken if they don't act today
      streakBroken = true;
      currentStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak: user.longestStreak,
    totalXp: user.totalXp,
    streakBroken,
    isNewDay: !lastActivity || !isSameDay(lastActivity, now),
  };
}
