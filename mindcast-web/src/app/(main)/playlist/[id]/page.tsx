import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Play, Clock, Shuffle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDuration, formatDate } from '@/lib/utils';
import { PlaylistPlayer } from './playlist-player';
import { PlaylistEpisodeList } from './episode-list';

interface PlaylistPageProps {
  params: { id: string };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
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
    notFound();
  }

  const isOwner = playlist.userId === session.user.id;
  const totalDurationSecs = playlist.episodes.reduce(
    (sum, pe) => sum + (pe.episode.audioDurationSecs || 0),
    0
  );
  const readyEpisodes = playlist.episodes.filter(
    (pe) => pe.episode.status === 'READY'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/library">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand/10 text-4xl">
              {playlist.coverEmoji || '📚'}
            </div>
            <div>
              <h1 className="text-display-sm text-text-primary">{playlist.name}</h1>
              <div className="flex items-center gap-3 text-body-md text-text-muted mt-1">
                <span>{playlist.episodes.length} episodes</span>
                {totalDurationSecs > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(totalDurationSecs)}
                  </span>
                )}
              </div>
            </div>
          </div>
          {playlist.description && (
            <p className="text-body-md text-text-secondary mt-3">
              {playlist.description}
            </p>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      {readyEpisodes.length > 0 && (
        <PlaylistPlayer
          playlistId={playlist.id}
          episodes={readyEpisodes.map((pe) => ({
            id: pe.episode.id,
            title: pe.episode.title || pe.episode.topic,
            audioDurationSecs: pe.episode.audioDurationSecs || 0,
          }))}
          lastEpisodeId={playlist.lastEpisodeId}
          lastPositionSec={playlist.lastPositionSec}
        />
      )}

      {/* Episode List */}
      {playlist.episodes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-body-md text-text-secondary mb-4">
              This playlist is empty
            </p>
            <Link href="/library">
              <Button variant="outline">
                Browse Episodes
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <PlaylistEpisodeList
          playlistId={playlist.id}
          episodes={playlist.episodes.map((pe) => ({
            ...pe.episode,
            position: pe.position,
            playlistEpisodeId: pe.id,
          }))}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
