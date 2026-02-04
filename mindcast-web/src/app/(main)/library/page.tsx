import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EpisodeCard } from '@/components/episode-card';
import { RssFeedSection } from '@/components/rss-feed-section';
import { StreakBadge } from '@/components/streak-badge';
import { PlaylistsSection } from '@/components/playlists-section';
import { DailyDrop } from '@/components/daily-drop';
import { getStreakInfo } from '@/lib/streak';

export default async function LibraryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const [episodes, streakInfo, playlists] = await Promise.all([
    db.episode.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        topic: true,
        transcript: true,
        audioDurationSecs: true,
        createdAt: true,
        status: true,
      },
    }),
    getStreakInfo(session.user.id),
    db.playlist.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        episodes: {
          include: {
            episode: {
              select: {
                audioDurationSecs: true,
              },
            },
          },
        },
        _count: {
          select: { episodes: true },
        },
      },
    }),
  ]);

  // Transform playlists for the component
  const playlistsData = playlists.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    coverEmoji: p.coverEmoji,
    episodeCount: p._count.episodes,
    totalDurationSecs: p.episodes.reduce(
      (sum, pe) => sum + (pe.episode.audioDurationSecs || 0),
      0
    ),
    updatedAt: p.updatedAt.toISOString(),
  }));

  // Build RSS feed URL
  const baseUrl = process.env.NEXTAUTH_URL || 'https://mindcast.app';
  const feedUrl = `${baseUrl}/api/feed/${session.user.id}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display-sm text-text-primary">Your Library</h1>
          <p className="text-body-md text-text-secondary">
            {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {streakInfo && (
            <StreakBadge
              currentStreak={streakInfo.currentStreak}
              longestStreak={streakInfo.longestStreak}
              totalXp={streakInfo.totalXp}
            />
          )}
          <Link href="/create">
            <Button>
              <Plus className="h-4 w-4" />
              New Episode
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Drop */}
      <DailyDrop />

      {/* RSS Feed Section - only show if user has episodes */}
      {episodes.length > 0 && <RssFeedSection feedUrl={feedUrl} />}

      {/* Playlists Section */}
      <PlaylistsSection initialPlaylists={playlistsData} />

      {/* Episodes Section */}
      <div>
        <h2 className="text-heading-lg text-text-primary mb-4">All Episodes</h2>
      </div>

      {episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 rounded-full bg-brand/10 p-4">
            <Headphones className="h-8 w-8 text-brand" />
          </div>
          <h2 className="mb-2 text-heading-md text-text-primary">
            No episodes yet
          </h2>
          <p className="mb-6 max-w-sm text-body-md text-text-secondary">
            Create your first documentary-style audio episode on any topic
          </p>
          <Link href="/create">
            <Button>
              <Plus className="h-4 w-4" />
              Create First Episode
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {episodes.map((episode) => (
            <Link key={episode.id} href={`/episode/${episode.id}`}>
              <EpisodeCard episode={episode} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
