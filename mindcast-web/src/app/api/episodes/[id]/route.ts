import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateTopicSignals } from '@/lib/canon';

// PATCH /api/episodes/[id] - Update engagement signals
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const episodeId = params.id;

  // Verify the episode belongs to the user
  const episode = await db.episode.findFirst({
    where: { id: episodeId, userId: session.user.id },
    select: { id: true },
  });

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }

  const body = await request.json();
  const { completionPct, saved, replayed } = body;

  // Validate input types
  if (completionPct !== undefined && (typeof completionPct !== 'number' || completionPct < 0 || completionPct > 1)) {
    return NextResponse.json({ error: 'completionPct must be a number between 0 and 1' }, { status: 400 });
  }

  const updated = await updateTopicSignals({
    episodeId,
    userId: session.user.id,
    completionPct,
    saved: saved === true ? true : undefined,
    replayed: replayed === true ? true : undefined,
  });

  return NextResponse.json({ success: true, updated: !!updated });
}

// DELETE /api/episodes/[id] - Delete an episode
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const episodeId = params.id;

  // Verify the episode belongs to the user
  const episode = await db.episode.findFirst({
    where: {
      id: episodeId,
      userId: session.user.id,
    },
  });

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }

  // Delete the episode (cascade will handle related records)
  await db.episode.delete({
    where: { id: episodeId },
  });

  return NextResponse.json({ success: true });
}
