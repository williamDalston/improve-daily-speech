'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PublicAudioPlayerProps {
  audioBase64: string;
  title: string;
}

export function PublicAudioPlayer({ audioBase64, title }: PublicAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl bg-surface-secondary p-4 sm:p-6">
      <audio
        ref={audioRef}
        src={`data:audio/mp3;base64,${audioBase64}`}
        preload="metadata"
      />

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="relative h-2 bg-border rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-brand transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-text-muted">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full hover:bg-surface-tertiary transition-colors text-text-muted hover:text-text-primary"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <button
          onClick={() => skip(-15)}
          className="p-2 rounded-full hover:bg-surface-tertiary transition-colors text-text-muted hover:text-text-primary"
          aria-label="Skip back 15 seconds"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <Button
          onClick={togglePlay}
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full',
            isPlaying ? 'bg-brand hover:bg-brand/90' : 'bg-brand hover:bg-brand/90'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </Button>

        <button
          onClick={() => skip(15)}
          className="p-2 rounded-full hover:bg-surface-tertiary transition-colors text-text-muted hover:text-text-primary"
          aria-label="Skip forward 15 seconds"
        >
          <RotateCw className="h-5 w-5" />
        </button>

        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      {/* Title */}
      <p className="text-center text-sm text-text-muted mt-4 truncate">
        {title}
      </p>
    </div>
  );
}
