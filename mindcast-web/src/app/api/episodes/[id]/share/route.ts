import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// POST /api/episodes/[id]/share - Generate a share link for an episode
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const episodeId = params.id;

  // Get episode and verify ownership
  const episode = await db.episode.findFirst({
    where: {
      id: episodeId,
      userId: session.user.id,
    },
    select: {
      id: true,
      shareId: true,
      isPublic: true,
    },
  });

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }

  // If already has a share ID, just return it
  if (episode.shareId) {
    return NextResponse.json({
      shareId: episode.shareId,
      isPublic: episode.isPublic,
      shareUrl: `${process.env.NEXTAUTH_URL || 'https://mindcast.app'}/share/${episode.shareId}`,
    });
  }

  // Generate a new share ID (short, URL-safe)
  const shareId = nanoid(10);

  // Update episode with share ID and make it public
  await db.episode.update({
    where: { id: episodeId },
    data: {
      shareId,
      isPublic: true,
    },
  });

  return NextResponse.json({
    shareId,
    isPublic: true,
    shareUrl: `${process.env.NEXTAUTH_URL || 'https://mindcast.app'}/share/${shareId}`,
  });
}

// DELETE /api/episodes/[id]/share - Remove share link (make private)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const episodeId = params.id;

  // Verify ownership
  const episode = await db.episode.findFirst({
    where: {
      id: episodeId,
      userId: session.user.id,
    },
  });

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }

  // Make episode private (keep shareId for potential future re-enable)
  await db.episode.update({
    where: { id: episodeId },
    data: {
      isPublic: false,
    },
  });

  return NextResponse.json({ success: true, isPublic: false });
}
