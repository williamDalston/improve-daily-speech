'use client';

import Link from 'next/link';
import { Play, Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDuration, formatDate, truncate } from '@/lib/utils';

interface Episode {
  id: string;
  title: string | null;
  topic: string;
  transcript: string | null;
  audioDurationSecs: number | null;
  createdAt: Date | string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'ERROR';
}

interface EpisodeCardProps {
  episode: Episode;
  onPlay?: () => void;
}

export function EpisodeCard({ episode, onPlay }: EpisodeCardProps) {
  const displayTitle = episode.title || episode.topic;
  const preview = episode.transcript
    ? truncate(episode.transcript, 150)
    : 'Episode in progress...';

  const statusBadge = {
    DRAFT: { label: 'Draft', variant: 'secondary' as const },
    PROCESSING: { label: 'Processing', variant: 'warning' as const },
    READY: { label: 'Ready', variant: 'success' as const },
    ERROR: { label: 'Error', variant: 'error' as const },
  }[episode.status];

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-medium">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Status badge */}
            <Badge variant={statusBadge.variant} className="mb-2">
              {statusBadge.label}
            </Badge>

            {/* Title */}
            <Link href={`/episode/${episode.id}`}>
              <h3 className="mb-2 line-clamp-2 text-heading-sm text-text-primary transition-colors hover:text-brand">
                {displayTitle}
              </h3>
            </Link>

            {/* Preview */}
            <p className="mb-3 line-clamp-2 text-body-sm text-text-secondary">
              {preview}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-4 text-caption text-text-muted">
              {episode.audioDurationSecs && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(episode.audioDurationSecs)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(episode.createdAt)}
              </span>
            </div>
          </div>

          {/* Play button */}
          {episode.status === 'READY' && (
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-full opacity-80 transition-opacity group-hover:opacity-100"
              onClick={onPlay}
              aria-label={`Play ${displayTitle}`}
            >
              <Play className="h-5 w-5 ml-0.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
