import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, User, Sparkles, ExternalLink } from 'lucide-react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicAudioPlayer } from './public-audio-player';
import { formatDuration } from '@/lib/utils';

interface SharePageProps {
  params: { shareId: string };
}

export async function generateMetadata({ params }: SharePageProps) {
  const episode = await db.episode.findUnique({
    where: { shareId: params.shareId },
    select: { title: true, topic: true, transcript: true },
  });

  if (!episode) {
    return { title: 'Episode Not Found' };
  }

  const title = episode.title || episode.topic;
  const description = episode.transcript?.slice(0, 160) || `Listen to "${title}" on MindCast`;

  return {
    title: `${title} | MindCast`,
    description,
    openGraph: {
      title: `${title} | MindCast`,
      description,
      type: 'music.song',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | MindCast`,
      description,
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const episode = await db.episode.findUnique({
    where: { shareId: params.shareId },
    include: {
      user: {
        select: { name: true, image: true },
      },
      job: {
        select: { fullAudio: true },
      },
    },
  });

  // Check if episode exists and is public
  if (!episode || !episode.isPublic) {
    notFound();
  }

  const title = episode.title || episode.topic;
  // Prefer streaming URL (CDN), fall back to base64 for older episodes
  const audioUrl = episode.audioUrl
    ? `/api/episodes/${episode.id}/audio`
    : null;
  const audioBase64 = episode.job?.fullAudio;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-brand font-bold text-lg">
            <Sparkles className="h-5 w-5" />
            MindCast
          </Link>
          <Link href="/create">
            <Button size="sm" variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Create Your Own
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Episode Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">
                  Shared Episode
                </Badge>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-muted">
                  {episode.user?.name && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {episode.user.name}
                    </span>
                  )}
                  {episode.audioDurationSecs && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatDuration(episode.audioDurationSecs)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(audioUrl || audioBase64) ? (
              <PublicAudioPlayer audioUrl={audioUrl ?? undefined} audioBase64={audioBase64 ?? undefined} title={title} />
            ) : (
              <div className="rounded-xl bg-surface-secondary p-6 text-center">
                <p className="text-text-muted">Audio not available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcript */}
        {episode.transcript && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
                {episode.transcript}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="border-brand/30 bg-gradient-to-br from-brand/5 to-brand/10">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Want to create your own audio lessons?
            </h3>
            <p className="text-text-secondary mb-4">
              MindCast transforms any topic into an engaging documentary-style audio experience.
            </p>
            <Link href="/create">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Try MindCast Free
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-text-muted">
          <p>
            Powered by{' '}
            <Link href="/" className="text-brand hover:underline">
              MindCast
            </Link>
            {' '}&mdash; AI-powered audio learning
          </p>
        </div>
      </footer>
    </div>
  );
}
