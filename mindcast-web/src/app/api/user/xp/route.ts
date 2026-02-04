import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateStreak, XP_REWARDS } from '@/lib/streak';

// Valid activity types and their XP rewards
const ACTIVITY_XP: Record<string, number> = {
  quiz_completed: XP_REWARDS.QUIZ_COMPLETED,
  reflection_completed: XP_REWARDS.REFLECTION_COMPLETED,
  takeaway_saved: 5, // Small XP for saving takeaways
};

// POST /api/user/xp - Award XP for learning activities
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { activity, amount } = await request.json();

  // Validate activity type or custom amount
  let xpToAward: number;

  if (activity && activity in ACTIVITY_XP) {
    xpToAward = ACTIVITY_XP[activity];
  } else if (typeof amount === 'number' && amount > 0 && amount <= 100) {
    // Allow custom amounts up to 100 XP
    xpToAward = amount;
  } else {
    return NextResponse.json(
      { error: 'Invalid activity or amount' },
      { status: 400 }
    );
  }

  try {
    const streakInfo = await updateStreak(session.user.id, xpToAward);

    return NextResponse.json({
      xpAwarded: xpToAward,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      totalXp: streakInfo.totalXp,
      isNewDay: streakInfo.isNewDay,
      streakBroken: streakInfo.streakBroken,
    });
  } catch (error) {
    console.error('XP award error:', error);
    return NextResponse.json(
      { error: 'Failed to award XP' },
      { status: 500 }
    );
  }
}
