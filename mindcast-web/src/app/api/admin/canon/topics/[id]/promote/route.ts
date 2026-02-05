import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { db } from '@/lib/db';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/admin/canon/topics/[id]/promote
 *
 * Force-promote a topic to CANON status.
 * Body (optional):
 *   skipRemaster: boolean — promote without queuing a remaster job (default: false)
 *
 * If the topic already has READY episodes, the most recent one becomes
 * the interim canon episode. A CanonJob is queued unless skipRemaster=true.
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
      requestCount: true,
      uniqueUsers: true,
      completionRate: true,
      saveRate: true,
    },
  });

  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  if (topic.status === 'CANON') {
    return NextResponse.json(
      { error: 'Topic is already CANON', topic },
      { status: 409 }
    );
  }

  let body: { skipRemaster?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine — defaults apply
  }

  const skipRemaster = body.skipRemaster === true;

  // Find the best existing episode for this topic
  const bestEpisode = await db.episode.findFirst({
    where: { topicId: params.id, status: 'READY' },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  // Queue a remaster job (unless skipped)
  let canonJobId: string | undefined;
  if (!skipRemaster) {
    const canonJob = await db.canonJob.create({
      data: {
        topicId: params.id,
        status: 'QUEUED',
        ...(bestEpisode ? { episodeId: bestEpisode.id } : {}),
      },
    });
    canonJobId = canonJob.id;
  }

  // Update topic to CANON
  await db.topic.update({
    where: { id: params.id },
    data: {
      status: 'CANON',
      canonPromotedAt: new Date(),
      ...(bestEpisode ? { canonEpisodeId: bestEpisode.id } : {}),
    },
  });

  // Mark the interim canon episode
  if (bestEpisode) {
    await db.episode.update({
      where: { id: bestEpisode.id },
      data: { isCanon: true },
    });
  }

  return NextResponse.json({
    success: true,
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      status: 'CANON',
    },
    canonEpisodeId: bestEpisode?.id || null,
    canonJobId: canonJobId || null,
    note: skipRemaster
      ? 'Promoted without remaster job'
      : canonJobId
        ? 'Promoted with remaster job queued'
        : 'Promoted — no existing episodes for remaster',
  });
}
