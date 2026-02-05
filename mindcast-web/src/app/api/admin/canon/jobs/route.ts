import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/canon/jobs
 *
 * List canon remaster jobs with filtering.
 * Query params:
 *   status: QUEUED | RUNNING | SUCCEEDED | FAILED (comma-separated)
 *   limit: number (default: 50, max: 200)
 *   offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const statusFilter = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
  const offset = Number(searchParams.get('offset')) || 0;

  const where: Record<string, unknown> = {};

  if (statusFilter) {
    const statuses = statusFilter.split(',').map((s) => s.trim().toUpperCase());
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else {
      where.status = { in: statuses };
    }
  }

  const [jobs, total] = await Promise.all([
    db.canonJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        status: true,
        error: true,
        episodeId: true,
        costCents: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        topic: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
          },
        },
      },
    }),
    db.canonJob.count({ where }),
  ]);

  // Compute duration for completed jobs
  const jobsWithDuration = jobs.map((job) => ({
    ...job,
    durationSecs:
      job.startedAt && job.completedAt
        ? Math.round(
            (new Date(job.completedAt).getTime() -
              new Date(job.startedAt).getTime()) /
              1000
          )
        : null,
  }));

  return NextResponse.json({
    jobs: jobsWithDuration,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
}
