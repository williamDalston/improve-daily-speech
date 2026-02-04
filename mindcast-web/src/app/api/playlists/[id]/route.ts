import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: { id: string };
}

// GET /api/playlists/[id] - Get playlist details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const playlist = await db.playlist.findFirst({
    where: {
      id: params.id,
      OR: [
        { userId: session.user.id },
        { isPublic: true },
      ],
    },
    include: {
      episodes: {
        include: {
          episode: {
            select: {
              id: true,
              title: true,
              topic: true,
              audioDurationSecs: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  const totalDurationSecs = playlist.episodes.reduce(
    (sum, pe) => sum + (pe.episode.audioDurationSecs || 0),
    0
  );

  return NextResponse.json({
    playlist: {
      ...playlist,
      totalDurationSecs,
      episodeCount: playlist.episodes.length,
    },
  });
}

// PUT /api/playlists/[id] - Update playlist
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const playlist = await db.playlist.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  const { name, description, coverEmoji, isPublic } = await request.json();

  const updated = await db.playlist.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(coverEmoji !== undefined && { coverEmoji }),
      ...(isPublic !== undefined && { isPublic }),
    },
  });

  return NextResponse.json({ playlist: updated });
}

// DELETE /api/playlists/[id] - Delete playlist
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const playlist = await db.playlist.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  await db.playlist.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
