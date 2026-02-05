'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Clock, Calendar, Trash2, Loader2, Mic, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration, formatDate, truncate } from '@/lib/utils';

interface Episode {
  id: string;
  title: string | null;
  topic: string;
  transcript: string | null;
  audioDurationSecs: number | null;
  createdAt: Date | string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'ERROR';
  voice?: string;
  isCanon?: boolean;
}

// Voice display labels
const VOICE_LABELS: Record<string, string> = {
  nova: 'Nova',
  alloy: 'Alloy',
  echo: 'Echo',
  fable: 'Fable',
  onyx: 'Onyx',
  shimmer: 'Shimmer',
};

interface EpisodeCardProps {
  episode: Episode;
  onDelete?: (id: string) => void;
}

export function EpisodeCard({ episode, onDelete }: EpisodeCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this episode? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/episodes/${episode.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.(episode.id);
        router.refresh();
      } else {
        console.error('Failed to delete episode');
      }
    } catch (error) {
      console.error('Error deleting episode:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to the episode page where the full audio player is
    router.push(`/episode/${episode.id}`);
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-medium">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Status badge and delete button */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Badge variant={statusBadge.variant}>
                  {statusBadge.label}
                </Badge>
                {episode.isCanon && (
                  <Badge variant="secondary" className="gap-1 text-brand">
                    <Zap className="h-3 w-3" />
                    Instant
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-text-muted/50 hover:text-error hover:bg-error/10 transition-colors"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete episode"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>

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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-muted">
              {episode.audioDurationSecs && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(episode.audioDurationSecs)}
                </span>
              )}
              {episode.voice && VOICE_LABELS[episode.voice] && (
                <span className="flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  {VOICE_LABELS[episode.voice]}
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
              onClick={handlePlay}
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

// Skeleton loading state for episode cards
export function EpisodeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Status badge placeholder */}
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            {/* Title placeholder */}
            <Skeleton className="h-6 w-3/4 mb-2" />

            {/* Preview text placeholder */}
            <div className="space-y-2 mb-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Meta placeholder */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Play button placeholder */}
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// Grid of skeleton cards for loading states
export function EpisodeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <EpisodeCardSkeleton key={i} />
      ))}
    </div>
  );
}
