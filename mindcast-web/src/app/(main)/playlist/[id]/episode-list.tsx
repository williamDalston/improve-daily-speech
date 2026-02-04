'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  GripVertical,
  Play,
  Clock,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDuration, formatDate } from '@/lib/utils';

interface Episode {
  id: string;
  title: string | null;
  topic: string;
  audioDurationSecs: number | null;
  status: string;
  createdAt: Date;
  position: number;
  playlistEpisodeId: string;
}

interface PlaylistEpisodeListProps {
  playlistId: string;
  episodes: Episode[];
  isOwner: boolean;
}

export function PlaylistEpisodeList({
  playlistId,
  episodes: initialEpisodes,
  isOwner,
}: PlaylistEpisodeListProps) {
  const [episodes, setEpisodes] = React.useState(initialEpisodes);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [showMenu, setShowMenu] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, episodeId: string) => {
    setDraggingId(episodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const dragIndex = episodes.findIndex((ep) => ep.id === draggingId);
    const hoverIndex = episodes.findIndex((ep) => ep.id === targetId);

    if (dragIndex === hoverIndex) return;

    const newEpisodes = [...episodes];
    const [removed] = newEpisodes.splice(dragIndex, 1);
    newEpisodes.splice(hoverIndex, 0, removed);

    setEpisodes(newEpisodes);
  };

  const handleDragEnd = async () => {
    setDraggingId(null);

    // Save new order to API
    try {
      await fetch(`/api/playlists/${playlistId}/episodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeIds: episodes.map((ep) => ep.id),
        }),
      });
    } catch (err) {
      console.error('Failed to save order:', err);
      // Revert on error
      setEpisodes(initialEpisodes);
    }
  };

  const handleRemove = async (episodeId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/episodes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });

      if (!res.ok) throw new Error('Failed to remove episode');

      setEpisodes(episodes.filter((ep) => ep.id !== episodeId));
    } catch (err) {
      console.error('Failed to remove episode:', err);
    }
    setShowMenu(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Episodes ({episodes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {episodes.map((episode, index) => (
            <div
              key={episode.id}
              draggable={isOwner}
              onDragStart={(e) => handleDragStart(e, episode.id)}
              onDragOver={(e) => handleDragOver(e, episode.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group flex items-center gap-3 p-4 transition-colors',
                draggingId === episode.id && 'bg-brand/10 opacity-50',
                isOwner && 'cursor-move'
              )}
            >
              {/* Drag Handle */}
              {isOwner && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5 text-text-muted" />
                </div>
              )}

              {/* Index */}
              <span className="w-6 text-center text-body-md text-text-muted">
                {index + 1}
              </span>

              {/* Episode Info */}
              <Link
                href={`/episode/${episode.id}`}
                className="flex-1 min-w-0 hover:text-brand transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-text-primary truncate">
                    {episode.title || episode.topic}
                  </h4>
                  {episode.status !== 'READY' && (
                    <Badge variant="secondary" className="text-xs">
                      {episode.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-caption text-text-muted mt-0.5">
                  {episode.audioDurationSecs && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(episode.audioDurationSecs)}
                    </span>
                  )}
                  <span>{formatDate(new Date(episode.createdAt))}</span>
                </div>
              </Link>

              {/* Play Button */}
              {episode.status === 'READY' && (
                <Link href={`/episode/${episode.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Play className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {/* Menu */}
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowMenu(showMenu === episode.id ? null : episode.id)
                    }
                    className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 hover:bg-surface-secondary transition-all"
                  >
                    <MoreVertical className="h-4 w-4 text-text-muted" />
                  </button>

                  {showMenu === episode.id && (
                    <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-border bg-surface shadow-lg py-1">
                      <button
                        onClick={() => handleRemove(episode.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-surface-secondary"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
