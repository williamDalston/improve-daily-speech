'use client';

import * as React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn, formatDuration } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
}

const SKIP_SECONDS = 15;
const SPEED_PRESETS = [0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({
  src,
  title,
  autoPlay = false,
  onEnded,
  className,
}: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(audio.duration);
      if (autoPlay) {
        audio.play().catch(() => setIsPlaying(false));
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
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
  }, [autoPlay, onEnded]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

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

  const cycleSpeed = () => {
    const currentIndex = SPEED_PRESETS.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % SPEED_PRESETS.length;
    setPlaybackRate(SPEED_PRESETS[nextIndex]);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-4 shadow-soft sm:p-6',
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Title - truncate on mobile */}
      {title && (
        <h3 className="mb-3 truncate text-center text-base font-semibold text-text-primary sm:mb-4 sm:text-lg">
          {title}
        </h3>
      )}

      {/* Progress bar - larger touch area */}
      <div className="mb-4 sm:mb-6">
        <div className="py-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={seek}
            disabled={isLoading}
            className="cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-text-muted sm:text-sm">
          <span>{formatDuration(currentTime)}</span>
          <span>-{formatDuration(Math.max(0, duration - currentTime))}</span>
        </div>
      </div>

      {/* Main Controls - larger touch targets */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {/* Skip back */}
        <button
          onClick={() => skip(-SKIP_SECONDS)}
          disabled={isLoading}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95',
            'touch-manipulation',
            'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
            'disabled:opacity-50'
          )}
          aria-label={`Skip back ${SKIP_SECONDS} seconds`}
        >
          <SkipBack className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Play/Pause - extra large for mobile */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-95 sm:h-18 sm:w-18',
            'touch-manipulation',
            'bg-brand text-white shadow-medium hover:bg-brand-dark',
            'disabled:opacity-50'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-7 sm:w-7" />
          ) : isPlaying ? (
            <Pause className="h-7 w-7 sm:h-8 sm:w-8" />
          ) : (
            <Play className="ml-1 h-7 w-7 sm:h-8 sm:w-8" />
          )}
        </button>

        {/* Skip forward */}
        <button
          onClick={() => skip(SKIP_SECONDS)}
          disabled={isLoading}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95',
            'touch-manipulation',
            'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
            'disabled:opacity-50'
          )}
          aria-label={`Skip forward ${SKIP_SECONDS} seconds`}
        >
          <SkipForward className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Secondary controls - mobile optimized */}
      <div className="mt-4 flex items-center justify-between sm:mt-6">
        {/* Speed - larger touch target */}
        <button
          onClick={cycleSpeed}
          className={cn(
            'flex h-10 min-w-[56px] items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-all active:scale-95',
            'touch-manipulation',
            'hover:bg-surface-tertiary',
            playbackRate !== 1 && 'border-brand bg-brand/5 text-brand'
          )}
        >
          {playbackRate}x
        </button>

        {/* Restart button - useful on mobile */}
        <button
          onClick={restart}
          disabled={isLoading || currentTime < 5}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-95',
            'touch-manipulation',
            'text-text-muted hover:bg-surface-tertiary hover:text-text-primary',
            'disabled:opacity-30'
          )}
          aria-label="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Volume - hide slider on mobile, just toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-95',
              'touch-manipulation',
              'text-text-muted hover:bg-surface-tertiary hover:text-text-primary'
            )}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          {/* Volume slider - desktop only */}
          <div className="hidden sm:block">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={(v) => {
                setVolume(v[0]);
                setIsMuted(v[0] === 0);
              }}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
