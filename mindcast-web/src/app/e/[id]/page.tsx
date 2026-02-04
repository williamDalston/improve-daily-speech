import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Clock, Play, BookMarked, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/utils';
import { PublicAudioPlayer } from './player';
import { EpisodeJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import type { Source } from '@/lib/ai/sources';
import type { Metadata } from 'next';

interface PublicEpisodePageProps {
  params: { id: string };
  searchParams: { t?: string };
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: PublicEpisodePageProps): Promise<Metadata> {
  const episode = await db.episode.findFirst({
    where: {
      id: params.id,
      status: 'READY',
    },
    select: {
      title: true,
      topic: true,
      transcript: true,
    },
  });

  if (!episode) {
    return {
      title: 'Episode Not Found | MindCast',
    };
  }

  const title = episode.title || episode.topic;
  const description = episode.transcript
    ? episode.transcript.slice(0, 155) + '...'
    : `Listen to "${title}" - a documentary-style audio episode on MindCast`;

  return {
    title: `${title} | MindCast`,
    description,
    openGraph: {
      title: `${title} | MindCast`,
      description,
      type: 'music.song',
      siteName: 'MindCast',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | MindCast`,
      description,
    },
  };
}

export default async function PublicEpisodePage({ params, searchParams }: PublicEpisodePageProps) {
  const episode = await db.episode.findFirst({
    where: {
      id: params.id,
      status: 'READY',
    },
    select: {
      id: true,
      title: true,
      topic: true,
      transcript: true,
      audioDurationSecs: true,
      sources: true,
      createdAt: true,
    },
  });

  if (!episode) {
    notFound();
  }

  const title = episode.title || episode.topic;
  const startTime = searchParams.t ? parseInt(searchParams.t, 10) : 0;
  const sources = (episode.sources as unknown as Source[]) || [];

  // Get a preview of the transcript (first ~500 chars)
  const transcriptPreview = episode.transcript
    ? episode.transcript.slice(0, 500) + (episode.transcript.length > 500 ? '...' : '')
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-secondary">
      {/* SEO Structured Data */}
      <EpisodeJsonLd
        title={title}
        description={transcriptPreview || `Documentary-style episode about ${title}`}
        episodeId={episode.id}
        datePublished={episode.createdAt.toISOString()}
        duration={episode.audioDurationSecs || undefined}
        transcript={episode.transcript || undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Episodes', url: '/library' },
          { name: title, url: `/e/${episode.id}` },
        ]}
      />

      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary">MindCast</span>
          </Link>
          <Link href="/create">
            <Button size="sm">
              Create Your Own
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Episode Header */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="mb-2">
            AI-Generated Documentary
          </Badge>
          <h1 className="text-display-sm text-text-primary">
            {title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-text-muted">
            {episode.audioDurationSecs && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(episode.audioDurationSecs)}
              </span>
            )}
            {sources.length > 0 && (
              <span className="flex items-center gap-1">
                <BookMarked className="h-4 w-4" />
                {sources.length} sources
              </span>
            )}
          </div>
        </div>

        {/* Audio Player */}
        <Card className="border-2 border-brand/20">
          <CardContent className="p-6">
            <PublicAudioPlayer
              episodeId={episode.id}
              title={title}
              startTime={startTime}
            />
          </CardContent>
        </Card>

        {/* Transcript Preview */}
        {transcriptPreview && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-md text-text-primary mb-4 flex items-center gap-2">
                <Play className="h-5 w-5 text-brand" />
                Preview
              </h2>
              <p className="text-body-md text-text-secondary leading-relaxed">
                "{transcriptPreview}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-heading-md text-text-primary mb-4 flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-brand" />
                Sources ({sources.length})
              </h2>
              <ul className="space-y-2">
                {sources.slice(0, 5).map((source, idx) => (
                  <li
                    key={source.id || idx}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3"
                  >
                    <span className="flex-shrink-0 rounded bg-brand/10 px-2 py-0.5 text-caption font-medium text-brand">
                      [{idx + 1}]
                    </span>
                    <div>
                      <p className="text-body-sm font-medium text-text-primary">
                        {source.title}
                      </p>
                      <p className="text-caption text-text-muted">
                        {source.author !== 'Unknown' && `${source.author} • `}
                        {source.year}
                      </p>
                    </div>
                  </li>
                ))}
                {sources.length > 5 && (
                  <p className="text-caption text-text-muted text-center pt-2">
                    +{sources.length - 5} more sources
                  </p>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-gradient-to-r from-brand/10 to-brand/5 border-brand/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-heading-lg text-text-primary mb-2">
              Create Your Own Episodes
            </h2>
            <p className="text-body-md text-text-secondary mb-6">
              Turn any topic into a documentary-style audio episode with AI.
            </p>
            <Link href="/create">
              <Button size="lg">
                <Sparkles className="h-5 w-5" />
                Start Creating - Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-caption text-text-muted">
            Powered by <Link href="/" className="text-brand hover:underline">MindCast</Link> - AI Documentary Learning
          </p>
        </div>
      </footer>
    </div>
  );
}
