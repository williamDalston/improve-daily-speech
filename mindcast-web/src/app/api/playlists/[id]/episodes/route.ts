import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateTopicSignals } from '@/lib/canon';

interface RouteParams {
  params: { id: string };
}

// POST /api/playlists/[id]/episodes - Add episode to playlist
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify playlist ownership
  const playlist = await db.playlist.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      _count: {
        select: { episodes: true },
      },
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  const { episodeId } = await request.json();

  if (!episodeId) {
    return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
  }

  // Verify episode exists and user owns it
  const episode = await db.episode.findFirst({
    where: {
      id: episodeId,
      userId: session.user.id,
      status: 'READY',
    },
  });

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found or not ready' }, { status: 404 });
  }

  // Check if already in playlist
  const existing = await db.playlistEpisode.findUnique({
    where: {
      playlistId_episodeId: {
        playlistId: params.id,
        episodeId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'Episode already in playlist' }, { status: 409 });
  }

  // Add to playlist at the end
  const playlistEpisode = await db.playlistEpisode.create({
    data: {
      playlistId: params.id,
      episodeId,
      position: playlist._count.episodes,
    },
    include: {
      episode: {
        select: {
          id: true,
          title: true,
          topic: true,
          audioDurationSecs: true,
        },
      },
    },
  });

  // Update playlist timestamp
  await db.playlist.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  // Track save signal for Canon scoring (non-blocking)
  updateTopicSignals({
    episodeId,
    userId: session.user.id,
    saved: true,
  }).catch(() => {});

  return NextResponse.json({ playlistEpisode }, { status: 201 });
}

// DELETE /api/playlists/[id]/episodes - Remove episode from playlist
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify playlist ownership
  const playlist = await db.playlist.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  const { episodeId } = await request.json();

  if (!episodeId) {
    return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
  }

  // Remove from playlist
  const deleted = await db.playlistEpisode.deleteMany({
    where: {
      playlistId: params.id,
      episodeId,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Episode not in playlist' }, { status: 404 });
  }

  // Reorder remaining episodes
  const remaining = await db.playlistEpisode.findMany({
    where: { playlistId: params.id },
    orderBy: { position: 'asc' },
  });

  // Update positions
  await Promise.all(
    remaining.map((pe, index) =>
      db.playlistEpisode.update({
        where: { id: pe.id },
        data: { position: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}

// PUT /api/playlists/[id]/episodes - Reorder episodes
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify playlist ownership
  const playlist = await db.playlist.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  const { episodeIds } = await request.json();

  if (!Array.isArray(episodeIds)) {
    return NextResponse.json({ error: 'Episode IDs array is required' }, { status: 400 });
  }

  // Update positions for all episodes
  await Promise.all(
    episodeIds.map((episodeId, index) =>
      db.playlistEpisode.updateMany({
        where: {
          playlistId: params.id,
          episodeId,
        },
        data: { position: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
