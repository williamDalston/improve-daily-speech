'use client';

import * as React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatDuration } from '@/lib/utils';

interface Episode {
  id: string;
  title: string;
  audioDurationSecs: number;
}

interface PlaylistPlayerProps {
  playlistId: string;
  episodes: Episode[];
  lastEpisodeId?: string | null;
  lastPositionSec?: number | null;
}

export function PlaylistPlayer({
  playlistId,
  episodes,
  lastEpisodeId,
  lastPositionSec,
}: PlaylistPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(() => {
    if (lastEpisodeId) {
      const idx = episodes.findIndex((e) => e.id === lastEpisodeId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeat] = React.useState<'none' | 'all' | 'one'>('none');

  const currentEpisode = episodes[currentIndex];

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Resume from last position if this was the last played episode
      if (lastEpisodeId === currentEpisode?.id && lastPositionSec) {
        audio.currentTime = lastPositionSec;
      }
    };
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, repeat, lastEpisodeId, lastPositionSec, currentEpisode?.id]);

  // Save playback position periodically
  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      saveProgress();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, currentTime]);

  const saveProgress = async () => {
    try {
      await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastEpisodeId: currentEpisode?.id,
          lastPositionSec: Math.floor(currentTime),
        }),
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      saveProgress();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (shuffle) {
      const nextIndex = Math.floor(Math.random() * episodes.length);
      setCurrentIndex(nextIndex);
    } else if (currentIndex < episodes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (repeat === 'all') {
      setCurrentIndex(0);
    } else {
      setIsPlaying(false);
    }
  };

  const playPrevious = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // If more than 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (repeat === 'all') {
      setCurrentIndex(episodes.length - 1);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const cycleRepeat = () => {
    setRepeat((prev) => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  if (!currentEpisode) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="border-brand/20 bg-gradient-to-r from-brand/5 to-transparent">
      <CardContent className="p-6">
        <audio
          ref={audioRef}
          src={`/api/episodes/${currentEpisode.id}/audio`}
          preload="metadata"
        />

        {/* Now Playing Info */}
        <div className="mb-4">
          <p className="text-caption text-text-muted">
            Now Playing ({currentIndex + 1} of {episodes.length})
          </p>
          <h3 className="text-heading-md text-text-primary truncate">
            {currentEpisode.title}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div
            className="h-2 bg-surface-secondary rounded-full cursor-pointer overflow-hidden"
            onClick={seek}
          >
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-caption text-text-muted mt-1">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {/* Shuffle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShuffle(!shuffle)}
            className={cn(shuffle && 'text-brand')}
          >
            <Shuffle className="h-4 w-4" />
          </Button>

          {/* Previous */}
          <Button variant="ghost" size="icon" onClick={playPrevious}>
            <SkipBack className="h-5 w-5" />
          </Button>

          {/* Play/Pause */}
          <Button
            size="lg"
            className="h-14 w-14 rounded-full"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          {/* Next */}
          <Button variant="ghost" size="icon" onClick={playNext}>
            <SkipForward className="h-5 w-5" />
          </Button>

          {/* Repeat */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleRepeat}
            className={cn(repeat !== 'none' && 'text-brand')}
          >
            <div className="relative">
              <Repeat className="h-4 w-4" />
              {repeat === 'one' && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold">
                  1
                </span>
              )}
            </div>
          </Button>
        </div>

        {/* Play All Button (when not playing) */}
        {!isPlaying && currentIndex === 0 && currentTime === 0 && (
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={togglePlay} className="w-full max-w-xs">
              <Play className="h-4 w-4" />
              Play All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
