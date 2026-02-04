import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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
