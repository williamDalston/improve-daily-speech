import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * POST /api/jobs/reset - Reset stuck jobs for current user
 * Marks any pending/processing jobs as failed so user can try again
 */
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find and mark stuck jobs as failed
  const stuckJobs = await db.job.updateMany({
    where: {
      userId: session.user.id,
      status: { in: ['PENDING', 'RESEARCH', 'DRAFTING', 'JUDGING', 'ENHANCING', 'AUDIO'] },
    },
    data: {
      status: 'FAILED',
      error: 'Job timed out or was reset by user',
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    reset: stuckJobs.count,
    message: `Reset ${stuckJobs.count} stuck job(s)`,
  });
}
