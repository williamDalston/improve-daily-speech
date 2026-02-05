import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { db } from '@/lib/db';
import { PROMOTION_THRESHOLDS } from '@/lib/canon';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/canon/stats
 *
 * System-wide Canon Protocol statistics.
 * Returns topic counts by status, cache hit rates, cost savings,
 * job success rates, and top-performing topics.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Topic counts by status
  const topicCounts = await db.topic.groupBy({
    by: ['status'],
    _count: true,
  });

  const statusCounts: Record<string, number> = {};
  for (const row of topicCounts) {
    statusCounts[row.status] = row._count;
  }

  // Total requests + cache hit stats
  const requestStats = await db.topicRequest.aggregate({
    _count: true,
    _sum: { costCents: true },
  });

  const cacheHitCount = await db.topicRequest.count({
    where: { cacheHit: true },
  });

  // Canon job stats
  const jobCounts = await db.canonJob.groupBy({
    by: ['status'],
    _count: true,
  });

  const jobStatusCounts: Record<string, number> = {};
  for (const row of jobCounts) {
    jobStatusCounts[row.status] = row._count;
  }

  // Total remaster cost
  const remasterCost = await db.canonJob.aggregate({
    where: { status: 'SUCCEEDED' },
    _sum: { costCents: true },
  });

  // Estimated savings: cache hits * average episode cost
  // Average cost per non-cache-hit request
  const nonCacheRequests = await db.topicRequest.aggregate({
    where: { cacheHit: false, costCents: { not: null } },
    _avg: { costCents: true },
    _count: true,
  });

  const avgCostPerRequest = nonCacheRequests._avg.costCents || 125; // default ~$1.25
  const estimatedSavingsCents = cacheHitCount * avgCostPerRequest;

  // Top canon topics by request count
  const topCanonTopics = await db.topic.findMany({
    where: { status: 'CANON' },
    orderBy: { requestCount: 'desc' },
    take: 10,
    select: {
      id: true,
      slug: true,
      title: true,
      requestCount: true,
      uniqueUsers: true,
      completionRate: true,
      saveRate: true,
      canonScore: true,
      canonPromotedAt: true,
    },
  });

  // Near-promotion candidates (above min requests but not yet CANON)
  const nearPromotionTopics = await db.topic.findMany({
    where: {
      status: 'CANDIDATE',
      requestCount: { gte: PROMOTION_THRESHOLDS.minRequests },
    },
    orderBy: { canonScore: 'desc' },
    take: 10,
    select: {
      id: true,
      slug: true,
      title: true,
      requestCount: true,
      uniqueUsers: true,
      completionRate: true,
      saveRate: true,
      canonScore: true,
    },
  });

  return NextResponse.json({
    topics: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      byStatus: statusCounts,
    },
    requests: {
      total: requestStats._count,
      cacheHits: cacheHitCount,
      cacheHitRate:
        requestStats._count > 0
          ? cacheHitCount / requestStats._count
          : 0,
      totalCostCents: requestStats._sum.costCents || 0,
    },
    savings: {
      estimatedSavingsCents: Math.round(estimatedSavingsCents),
      estimatedSavingsDollars: (estimatedSavingsCents / 100).toFixed(2),
      avgCostPerRequestCents: Math.round(avgCostPerRequest),
    },
    jobs: {
      total: Object.values(jobStatusCounts).reduce((a, b) => a + b, 0),
      byStatus: jobStatusCounts,
      totalRemasterCostCents: remasterCost._sum.costCents || 0,
    },
    promotionThresholds: PROMOTION_THRESHOLDS,
    topCanonTopics,
    nearPromotionTopics,
  });
}
