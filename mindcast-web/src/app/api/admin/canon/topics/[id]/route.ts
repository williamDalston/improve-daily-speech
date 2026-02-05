import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { db } from '@/lib/db';
import { evaluatePromotion, computeCanonScore } from '@/lib/canon';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/admin/canon/topics/[id]
 *
 * Full topic detail: signals, promotion evaluation, recent requests,
 * canon jobs, and support flags.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const topic = await db.topic.findUnique({
    where: { id: params.id },
    include: {
      canonEpisode: {
        select: {
          id: true,
          title: true,
          audioDurationSecs: true,
          audioUrl: true,
          status: true,
          createdAt: true,
        },
      },
      episodes: {
        select: {
          id: true,
          title: true,
          status: true,
          isCanon: true,
          createdAt: true,
          audioDurationSecs: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      supportFlags: {
        select: {
          id: true,
          claim: true,
          severity: true,
          issue: true,
          suggestion: true,
          resolved: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      canonJobs: {
        select: {
          id: true,
          status: true,
          error: true,
          episodeId: true,
          costCents: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  // Compute live promotion evaluation
  const signals = {
    requestCount: topic.requestCount,
    uniqueUsers: topic.uniqueUsers,
    completionRate: topic.completionRate,
    saveRate: topic.saveRate,
  };

  const promotion = evaluatePromotion(signals);
  const liveScore = computeCanonScore(signals);

  // Recent requests summary
  const recentRequests = await db.topicRequest.findMany({
    where: { topicId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      userId: true,
      type: true,
      cacheHit: true,
      completionPct: true,
      saved: true,
      replayed: true,
      costCents: true,
      createdAt: true,
    },
  });

  // Aggregate stats for this topic
  const requestStats = await db.topicRequest.aggregate({
    where: { topicId: params.id },
    _count: true,
    _sum: { costCents: true },
    _avg: { completionPct: true },
  });

  const cacheHitCount = await db.topicRequest.count({
    where: { topicId: params.id, cacheHit: true },
  });

  return NextResponse.json({
    topic: {
      ...topic,
      // Strip embedding (too large for JSON response)
      embedding: topic.embedding ? '[vector]' : null,
    },
    promotion: {
      ...promotion,
      liveScore,
    },
    stats: {
      totalRequests: requestStats._count,
      totalCostCents: requestStats._sum.costCents || 0,
      avgCompletionPct: requestStats._avg.completionPct,
      cacheHitCount,
      cacheHitRate: requestStats._count > 0
        ? cacheHitCount / requestStats._count
        : 0,
    },
    recentRequests,
  });
}
