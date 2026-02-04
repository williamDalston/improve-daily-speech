import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getEpisodesDueForReview,
  getUpcomingReviews,
  getReviewStats,
  recordReview,
} from '@/lib/spaced-repetition';
import { updateStreak, XP_REWARDS } from '@/lib/streak';

// GET /api/reviews - Get review schedule and stats
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [dueEpisodes, upcomingEpisodes, stats] = await Promise.all([
    getEpisodesDueForReview(session.user.id),
    getUpcomingReviews(session.user.id),
    getReviewStats(session.user.id),
  ]);

  return NextResponse.json({
    dueEpisodes,
    upcomingEpisodes,
    stats,
  });
}

// POST /api/reviews - Record a review completion
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { episodeId, quality, quizScore, timeTaken } = await request.json();

  if (!episodeId || typeof quality !== 'number') {
    return NextResponse.json(
      { error: 'episodeId and quality are required' },
      { status: 400 }
    );
  }

  try {
    const result = await recordReview(
      episodeId,
      quality,
      quizScore,
      timeTaken
    );

    // Award XP for completing a review
    await updateStreak(session.user.id, XP_REWARDS.QUIZ_COMPLETED);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json(
      { error: 'Failed to record review' },
      { status: 500 }
    );
  }
}
