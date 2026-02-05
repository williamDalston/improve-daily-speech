import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/canon/topics
 *
 * List all topics with filtering and sorting.
 * Query params:
 *   status: CANDIDATE | CANON | COLD (comma-separated for multiple)
 *   sort: score | requests | users | recent (default: score)
 *   limit: number (default: 50, max: 200)
 *   offset: number (default: 0)
 *   q: search string (matches slug or title)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  // Parse filters
  const statusFilter = searchParams.get('status');
  const sort = searchParams.get('sort') || 'score';
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
  const offset = Number(searchParams.get('offset')) || 0;
  const query = searchParams.get('q');

  // Build where clause
  const where: Record<string, unknown> = {};

  if (statusFilter) {
    const statuses = statusFilter.split(',').map((s) => s.trim().toUpperCase());
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else {
      where.status = { in: statuses };
    }
  }

  if (query) {
    where.OR = [
      { slug: { contains: query, mode: 'insensitive' } },
      { title: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Build orderBy
  const orderByMap: Record<string, object> = {
    score: { canonScore: 'desc' },
    requests: { requestCount: 'desc' },
    users: { uniqueUsers: 'desc' },
    recent: { createdAt: 'desc' },
  };
  const orderBy = orderByMap[sort] || orderByMap.score;

  const [topics, total] = await Promise.all([
    db.topic.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        requestCount: true,
        uniqueUsers: true,
        completionRate: true,
        saveRate: true,
        canonScore: true,
        canonEpisodeId: true,
        canonPromotedAt: true,
        isFastMoving: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            requests: true,
            canonJobs: true,
          },
        },
      },
    }),
    db.topic.count({ where }),
  ]);

  return NextResponse.json({
    topics,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
}
