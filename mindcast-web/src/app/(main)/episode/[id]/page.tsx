import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Download, BookOpen, FileText, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatDate } from '@/lib/utils';
import { EpisodeAudioPlayer } from './audio-player';
import { AddonSection } from './addon-section';
import { SourcesSection } from './sources-section';
import { ShareSection } from './share-section';
import { ContentFeedback } from '@/components/content-feedback';
import { AddToPlaylistButton } from '@/components/add-to-playlist';
import type { Source } from '@/lib/ai/sources';

interface EpisodePageProps {
  params: { id: string };
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const episode = await db.episode.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!episode) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/library">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                episode.status === 'READY'
                  ? 'success'
                  : episode.status === 'PROCESSING'
                  ? 'warning'
                  : 'secondary'
              }
            >
              {episode.status}
            </Badge>
            <span className="text-caption text-text-muted">
              {formatDate(episode.createdAt)}
            </span>
            {episode.audioDurationSecs && (
              <span className="text-caption text-text-muted">
                • {formatDuration(episode.audioDurationSecs)}
              </span>
            )}
          </div>
          <h1 className="text-display-sm text-text-primary">
            {episode.title || episode.topic}
          </h1>
        </div>
        {/* Action buttons */}
        {episode.status === 'READY' && (
          <div className="flex items-center gap-2">
            <AddToPlaylistButton
              episodeId={episode.id}
              episodeTitle={episode.title || episode.topic}
            />
            {episode.transcript && (
              <ShareSection
                episodeId={episode.id}
                episodeTitle={episode.title || episode.topic}
                transcript={episode.transcript}
              />
            )}
          </div>
        )}
      </div>

      {/* Audio Player with Learning Loop */}
      {episode.status === 'READY' && (
        <EpisodeAudioPlayer
          episodeId={episode.id}
          episodeTitle={episode.title || episode.topic}
        />
      )}

      {/* Transcript */}
      {episode.transcript && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcript
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-h-[500px] overflow-y-auto whitespace-pre-wrap text-text-secondary">
              {episode.transcript}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {episode.sources && Array.isArray(episode.sources) && episode.sources.length > 0 && (
        <SourcesSection sources={episode.sources as Source[]} />
      )}

      {/* Learning Add-ons */}
      {episode.status === 'READY' && episode.transcript && (
        <div className="space-y-4">
          <h2 className="text-heading-lg text-text-primary">Learning Tools</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <AddonSection
              episodeId={episode.id}
              addonType="takeaways"
              title="Key Takeaways"
              description="Main insights and memorable facts"
              icon={<ListChecks className="h-5 w-5" />}
            />
            <AddonSection
              episodeId={episode.id}
              addonType="quiz"
              title="Knowledge Quiz"
              description="Test your understanding"
              icon={<BookOpen className="h-5 w-5" />}
            />
            <AddonSection
              episodeId={episode.id}
              addonType="journal"
              title="Reflection Prompts"
              description="Deepen your learning"
              icon={<FileText className="h-5 w-5" />}
            />
          </div>
        </div>
      )}

      {/* Content Feedback - Trust Primitive */}
      {episode.status === 'READY' && (
        <div className="flex justify-center pt-4 border-t border-border">
          <ContentFeedback episodeId={episode.id} />
        </div>
      )}
    </div>
  );
}
