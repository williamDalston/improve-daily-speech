import { db } from './db';

// SM-2 algorithm intervals (in days)
// Based on recall quality: 1=failed, 2=hard, 3=ok, 4=good, 5=easy
const BASE_INTERVALS = [1, 1, 3, 7, 14, 30, 60, 120];

/**
 * Calculate next review interval based on SM-2 algorithm
 * @param currentInterval - Current interval in days
 * @param quality - Recall quality (1-5)
 * @param reviewCount - Number of reviews completed
 */
function calculateNextInterval(
  currentInterval: number,
  quality: number,
  reviewCount: number
): number {
  // If quality is poor (1-2), reset to shorter interval
  if (quality <= 2) {
    return quality === 1 ? 1 : 2;
  }

  // For first few reviews, use base intervals
  if (reviewCount < BASE_INTERVALS.length) {
    return BASE_INTERVALS[reviewCount];
  }

  // SM-2 easiness factor calculation
  const easinessFactor = Math.max(1.3, 2.5 - 0.8 * (5 - quality));
  const newInterval = Math.round(currentInterval * easinessFactor);

  // Cap at 180 days
  return Math.min(newInterval, 180);
}

/**
 * Calculate next review date
 */
function calculateNextReviewDate(intervalDays: number): Date {
  const next = new Date();
  next.setDate(next.getDate() + intervalDays);
  next.setHours(9, 0, 0, 0); // Set to 9 AM for notifications
  return next;
}

/**
 * Record a review for an episode and update spaced repetition schedule
 */
export async function recordReview(
  episodeId: string,
  quality: number,
  quizScore?: number,
  timeTaken?: number
): Promise<{
  nextReviewAt: Date;
  newInterval: number;
  reviewCount: number;
}> {
  // Validate quality (1-5)
  const validQuality = Math.max(1, Math.min(5, Math.round(quality)));

  // Get current episode state
  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    select: {
      reviewCount: true,
      reviewInterval: true,
    },
  });

  if (!episode) {
    throw new Error('Episode not found');
  }

  const newReviewCount = episode.reviewCount + 1;
  const newInterval = calculateNextInterval(
    episode.reviewInterval,
    validQuality,
    newReviewCount
  );
  const nextReviewAt = calculateNextReviewDate(newInterval);

  // Create review record and update episode
  await db.$transaction([
    db.episodeReview.create({
      data: {
        episodeId,
        quality: validQuality,
        quizScore,
        timeTaken,
      },
    }),
    db.episode.update({
      where: { id: episodeId },
      data: {
        lastReviewedAt: new Date(),
        nextReviewAt,
        reviewCount: newReviewCount,
        reviewInterval: newInterval,
      },
    }),
  ]);

  return {
    nextReviewAt,
    newInterval,
    reviewCount: newReviewCount,
  };
}

/**
 * Mark an episode as listened (first listen or re-listen)
 */
export async function markListened(episodeId: string): Promise<void> {
  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    select: { lastListenedAt: true, reviewCount: true },
  });

  if (!episode) return;

  const isFirstListen = !episode.lastListenedAt;
  const nextReviewAt = isFirstListen
    ? calculateNextReviewDate(1) // Review tomorrow
    : undefined;

  await db.episode.update({
    where: { id: episodeId },
    data: {
      lastListenedAt: new Date(),
      ...(nextReviewAt ? { nextReviewAt } : {}),
    },
  });
}

/**
 * Get episodes due for review
 */
export async function getEpisodesDueForReview(
  userId: string,
  limit = 5
): Promise<
  Array<{
    id: string;
    title: string;
    topic: string;
    nextReviewAt: Date;
    reviewCount: number;
    daysPastDue: number;
  }>
> {
  const now = new Date();

  const episodes = await db.episode.findMany({
    where: {
      userId,
      status: 'READY',
      nextReviewAt: {
        lte: now,
      },
    },
    orderBy: {
      nextReviewAt: 'asc',
    },
    take: limit,
    select: {
      id: true,
      title: true,
      topic: true,
      nextReviewAt: true,
      reviewCount: true,
    },
  });

  return episodes
    .filter((ep) => ep.nextReviewAt !== null)
    .map((ep) => ({
      id: ep.id,
      title: ep.title || ep.topic,
      topic: ep.topic,
      nextReviewAt: ep.nextReviewAt!,
      reviewCount: ep.reviewCount,
      daysPastDue: Math.floor(
        (now.getTime() - ep.nextReviewAt!.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
}

/**
 * Get upcoming reviews (not yet due)
 */
export async function getUpcomingReviews(
  userId: string,
  limit = 5
): Promise<
  Array<{
    id: string;
    title: string;
    topic: string;
    nextReviewAt: Date;
    daysUntilDue: number;
  }>
> {
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const episodes = await db.episode.findMany({
    where: {
      userId,
      status: 'READY',
      nextReviewAt: {
        gt: now,
        lte: weekFromNow,
      },
    },
    orderBy: {
      nextReviewAt: 'asc',
    },
    take: limit,
    select: {
      id: true,
      title: true,
      topic: true,
      nextReviewAt: true,
    },
  });

  return episodes
    .filter((ep) => ep.nextReviewAt !== null)
    .map((ep) => ({
      id: ep.id,
      title: ep.title || ep.topic,
      topic: ep.topic,
      nextReviewAt: ep.nextReviewAt!,
      daysUntilDue: Math.ceil(
        (ep.nextReviewAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
}

/**
 * Get review statistics for a user
 */
export async function getReviewStats(userId: string): Promise<{
  dueNow: number;
  dueThisWeek: number;
  totalReviews: number;
  averageQuality: number;
}> {
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [dueNow, dueThisWeek, reviewAggregates] = await Promise.all([
    db.episode.count({
      where: {
        userId,
        status: 'READY',
        nextReviewAt: { lte: now },
      },
    }),
    db.episode.count({
      where: {
        userId,
        status: 'READY',
        nextReviewAt: { gt: now, lte: weekFromNow },
      },
    }),
    db.episodeReview.aggregate({
      where: {
        episode: { userId },
      },
      _count: true,
      _avg: { quality: true },
    }),
  ]);

  return {
    dueNow,
    dueThisWeek,
    totalReviews: reviewAggregates._count,
    averageQuality: reviewAggregates._avg.quality || 0,
  };
}
