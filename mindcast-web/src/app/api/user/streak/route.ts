import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStreakInfo } from '@/lib/streak';

// GET /api/user/streak - Get user's streak info
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const streakInfo = await getStreakInfo(session.user.id);

  if (!streakInfo) {
    return NextResponse.json({
      currentStreak: 0,
      longestStreak: 0,
      totalXp: 0,
      streakBroken: false,
      isNewDay: true,
    });
  }

  return NextResponse.json(streakInfo);
}
