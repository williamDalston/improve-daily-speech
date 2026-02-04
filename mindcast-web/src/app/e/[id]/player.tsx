'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn, formatDuration } from '@/lib/utils';

interface PublicAudioPlayerProps {
  episodeId: string;
  title: string;
  startTime?: number;
}

const SKIP_SECONDS = 15;

export function PublicAudioPlayer({ episodeId, title, startTime = 0 }: PublicAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const audioUrl = `/api/audio/${episodeId}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(audio.duration);
      // Seek to start time if provided
      if (startTime > 0 && startTime < audio.duration) {
        audio.currentTime = startTime;
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [startTime]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  };

  const seek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
  };

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title */}
      <h3 className="text-center text-lg font-semibold text-text-primary truncate">
        {title}
      </h3>

      {/* Progress bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={seek}
          disabled={isLoading}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-text-muted">
          <span>{formatDuration(currentTime)}</span>
          <span>-{formatDuration(Math.max(0, duration - currentTime))}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => skip(-SKIP_SECONDS)}
          disabled={isLoading}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95',
            'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
            'disabled:opacity-50'
          )}
          aria-label={`Skip back ${SKIP_SECONDS} seconds`}
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-95',
            'bg-brand text-white shadow-medium hover:bg-brand-dark',
            'disabled:opacity-50'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isPlaying ? (
            <Pause className="h-7 w-7" />
          ) : (
            <Play className="ml-1 h-7 w-7" />
          )}
        </button>

        <button
          onClick={() => skip(SKIP_SECONDS)}
          disabled={isLoading}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95',
            'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
            'disabled:opacity-50'
          )}
          aria-label={`Skip forward ${SKIP_SECONDS} seconds`}
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
