import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { db } from '@/lib/db';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/admin/canon/topics/[id]/demote
 *
 * Demote a topic from CANON status.
 * Body:
 *   to: 'CANDIDATE' | 'COLD' (default: 'CANDIDATE')
 *
 * This:
 * 1. Changes the topic status
 * 2. Unmarks the canon episode (if any)
 * 3. Clears canonEpisodeId and canonPromotedAt
 * 4. Cancels any QUEUED canon jobs for this topic
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const topic = await db.topic.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      canonEpisodeId: true,
    },
  });

  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  let body: { to?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine
  }

  const targetStatus = body.to === 'COLD' ? 'COLD' : 'CANDIDATE';

  // Unmark the current canon episode
  if (topic.canonEpisodeId) {
    await db.episode.update({
      where: { id: topic.canonEpisodeId },
      data: { isCanon: false },
    }).catch(() => {
      // Episode might have been deleted
    });
  }

  // Cancel any queued remaster jobs
  const cancelledJobs = await db.canonJob.updateMany({
    where: {
      topicId: params.id,
      status: 'QUEUED',
    },
    data: {
      status: 'FAILED',
      error: 'Demoted by admin',
      completedAt: new Date(),
    },
  });

  // Update topic
  await db.topic.update({
    where: { id: params.id },
    data: {
      status: targetStatus,
      canonEpisodeId: null,
      canonPromotedAt: null,
    },
  });

  return NextResponse.json({
    success: true,
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      previousStatus: topic.status,
      newStatus: targetStatus,
    },
    cancelledJobs: cancelledJobs.count,
  });
}
