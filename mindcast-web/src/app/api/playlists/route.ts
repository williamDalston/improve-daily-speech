import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/playlists - List user's playlists
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const playlists = await db.playlist.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
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
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      _count: {
        select: { episodes: true },
      },
    },
  });

  // Calculate total duration for each playlist
  const playlistsWithDuration = playlists.map((playlist) => ({
    ...playlist,
    totalDurationSecs: playlist.episodes.reduce(
      (sum, pe) => sum + (pe.episode.audioDurationSecs || 0),
      0
    ),
    episodeCount: playlist._count.episodes,
  }));

  return NextResponse.json({ playlists: playlistsWithDuration });
}

// POST /api/playlists - Create a new playlist
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, coverEmoji, isPublic = false } = await request.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
  }

  const playlist = await db.playlist.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      coverEmoji: coverEmoji || '📚',
      isPublic,
    },
  });

  return NextResponse.json({ playlist }, { status: 201 });
}
