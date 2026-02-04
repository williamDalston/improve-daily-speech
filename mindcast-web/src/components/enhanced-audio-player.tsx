'use client';

import * as React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  List,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn, formatDuration } from '@/lib/utils';

export interface Chapter {
  id: string;
  title: string;
  startTime: number; // seconds
  endTime: number;
  summary?: string;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface EnhancedAudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  artwork?: string;
  chapters?: Chapter[];
  transcript?: TranscriptSegment[];
  rawTranscript?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
}

const SKIP_SECONDS = 15;
const SPEED_PRESETS = [0.75, 1, 1.25, 1.5, 2];

// Haptic feedback helper
function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[style]);
  }
}

// Auto-generate chapters from transcript if not provided
function generateChaptersFromTranscript(transcript: string, duration: number): Chapter[] {
  const paragraphs = transcript.split('\n\n').filter((p) => p.trim().length > 50);
  if (paragraphs.length < 3) return [];

  // Create roughly 4-6 chapters
  const chapterCount = Math.min(Math.max(3, Math.floor(paragraphs.length / 3)), 6);
  const timePerChapter = duration / chapterCount;

  return Array.from({ length: chapterCount }, (_, i) => {
    const startTime = i * timePerChapter;
    const endTime = (i + 1) * timePerChapter;

    // Try to extract a title from the first sentence of the section
    const sectionStart = Math.floor((i / chapterCount) * paragraphs.length);
    const sectionText = paragraphs[sectionStart] || '';
    const firstSentence = sectionText.split(/[.!?]/)[0]?.trim() || '';
    const title = firstSentence.length > 50
      ? firstSentence.slice(0, 47) + '...'
      : firstSentence || `Part ${i + 1}`;

    return {
      id: `chapter-${i}`,
      title,
      startTime,
      endTime,
      summary: sectionText.slice(0, 100) + '...',
    };
  });
}

// Generate transcript segments from raw text
function generateTranscriptSegments(text: string, duration: number): TranscriptSegment[] {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
  if (sentences.length === 0) return [];

  const timePerSentence = duration / sentences.length;

  return sentences.map((sentence, i) => ({
    id: `seg-${i}`,
    text: sentence.trim(),
    startTime: i * timePerSentence,
    endTime: (i + 1) * timePerSentence,
  }));
}

export function EnhancedAudioPlayer({
  src,
  title,
  artist = 'MindCast',
  artwork,
  chapters: providedChapters,
  transcript: providedTranscript,
  rawTranscript,
  autoPlay = false,
  onEnded,
  className,
}: EnhancedAudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const transcriptRef = React.useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  // UI state
  const [showChapters, setShowChapters] = React.useState(false);
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [chapters, setChapters] = React.useState<Chapter[]>(providedChapters || []);
  const [transcriptSegments, setTranscriptSegments] = React.useState<TranscriptSegment[]>(
    providedTranscript || []
  );

  // Current chapter and transcript segment
  const currentChapter = React.useMemo(
    () => chapters.find((c) => currentTime >= c.startTime && currentTime < c.endTime),
    [chapters, currentTime]
  );

  const currentSegment = React.useMemo(
    () => transcriptSegments.find((s) => currentTime >= s.startTime && currentTime < s.endTime),
    [transcriptSegments, currentTime]
  );

  // Generate chapters and transcript segments when duration is known
  React.useEffect(() => {
    if (duration > 0 && rawTranscript) {
      if (!providedChapters || providedChapters.length === 0) {
        setChapters(generateChaptersFromTranscript(rawTranscript, duration));
      }
      if (!providedTranscript || providedTranscript.length === 0) {
        setTranscriptSegments(generateTranscriptSegments(rawTranscript, duration));
      }
    }
  }, [duration, rawTranscript, providedChapters, providedTranscript]);

  // Auto-scroll transcript to current segment
  React.useEffect(() => {
    if (showTranscript && currentSegment && transcriptRef.current) {
      const segmentEl = transcriptRef.current.querySelector(`[data-segment="${currentSegment.id}"]`);
      if (segmentEl) {
        segmentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentSegment, showTranscript]);

  // Media Session API
  React.useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'MindCast Episode',
      artist,
      album: 'MindCast',
      artwork: artwork
        ? [{ src: artwork, sizes: '512x512', type: 'image/png' }]
        : [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => audioRef.current?.play()],
      ['pause', () => audioRef.current?.pause()],
      ['seekbackward', () => {
        if (audioRef.current) audioRef.current.currentTime -= SKIP_SECONDS;
      }],
      ['seekforward', () => {
        if (audioRef.current) audioRef.current.currentTime += SKIP_SECONDS;
      }],
      ['seekto', (d) => {
        if (audioRef.current && d.seekTime !== undefined) audioRef.current.currentTime = d.seekTime;
      }],
    ];

    handlers.forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    });

    return () => {
      handlers.forEach(([action]) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
      });
    };
  }, [title, artist, artwork]);

  // Audio events
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(audio.duration);
      if (autoPlay) audio.play().catch(() => setIsPlaying(false));
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => {
      setIsPlaying(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    };
    const handlePause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    };
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
    triggerHaptic('medium');
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
  };

  const skip = (seconds: number) => {
    triggerHaptic('light');
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  };

  const seekTo = (time: number) => {
    triggerHaptic('light');
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
  };

  const cycleSpeed = () => {
    triggerHaptic('light');
    const idx = SPEED_PRESETS.indexOf(playbackRate);
    setPlaybackRate(SPEED_PRESETS[(idx + 1) % SPEED_PRESETS.length]);
  };

  return (
    <div className={cn('rounded-2xl border border-border bg-surface/80 backdrop-blur-md shadow-soft', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Main Player */}
      <div className="p-4 sm:p-6">
        {/* Title & Chapter */}
        {title && (
          <div className="mb-4 text-center">
            <h3 className="text-base font-semibold text-text-primary sm:text-lg truncate">
              {title}
            </h3>
            {currentChapter && (
              <p className="text-sm text-brand mt-1 flex items-center justify-center gap-1">
                <List className="h-3 w-3" />
                {currentChapter.title}
              </p>
            )}
          </div>
        )}

        {/* Progress with chapter markers */}
        <div className="mb-4 sm:mb-6">
          <div className="relative py-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={(v) => seekTo(v[0])}
              disabled={isLoading}
              className="cursor-pointer"
            />
            {/* Chapter markers on the progress bar */}
            {chapters.length > 0 && (
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none">
                {chapters.slice(1).map((chapter) => (
                  <div
                    key={chapter.id}
                    className="absolute w-0.5 h-3 bg-text-muted/50 rounded-full"
                    style={{ left: `${(chapter.startTime / duration) * 100}%` }}
                    title={chapter.title}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between text-xs text-text-muted sm:text-sm">
            <span>{formatDuration(currentTime)}</span>
            <span>-{formatDuration(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <button
            onClick={() => skip(-SKIP_SECONDS)}
            disabled={isLoading}
            className="flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 touch-manipulation text-text-secondary hover:bg-surface-tertiary disabled:opacity-50"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-95 touch-manipulation bg-brand text-white shadow-medium hover:bg-brand-dark disabled:opacity-50"
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
            className="flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 touch-manipulation text-text-secondary hover:bg-surface-tertiary disabled:opacity-50"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={cycleSpeed}
            className={cn(
              'flex h-10 min-w-[56px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all touch-manipulation',
              playbackRate !== 1 ? 'border-brand bg-brand/5 text-brand' : 'border-border'
            )}
          >
            {playbackRate}x
          </button>

          {/* Toggle buttons for chapters/transcript */}
          <div className="flex gap-2">
            {chapters.length > 0 && (
              <Button
                variant={showChapters ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowChapters(!showChapters);
                  setShowTranscript(false);
                }}
              >
                <List className="h-4 w-4 mr-1" />
                Chapters
              </Button>
            )}
            {transcriptSegments.length > 0 && (
              <Button
                variant={showTranscript ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowTranscript(!showTranscript);
                  setShowChapters(false);
                }}
              >
                <FileText className="h-4 w-4 mr-1" />
                Transcript
              </Button>
            )}
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setIsMuted(!isMuted);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-all touch-manipulation text-text-muted hover:bg-surface-tertiary"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Chapters Panel */}
      {showChapters && chapters.length > 0 && (
        <div className="border-t border-border px-4 py-3 max-h-[300px] overflow-y-auto">
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <List className="h-4 w-4" />
            Chapters
          </h4>
          <div className="space-y-2">
            {chapters.map((chapter, idx) => {
              const isCurrent = currentChapter?.id === chapter.id;
              const isPast = currentTime >= chapter.endTime;
              return (
                <button
                  key={chapter.id}
                  onClick={() => seekTo(chapter.startTime)}
                  className={cn(
                    'w-full text-left rounded-lg p-3 transition-all',
                    isCurrent
                      ? 'bg-brand/10 border border-brand/30'
                      : 'hover:bg-surface-secondary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                        isCurrent
                          ? 'bg-brand text-white'
                          : isPast
                          ? 'bg-success/20 text-success'
                          : 'bg-surface-tertiary text-text-muted'
                      )}
                    >
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isCurrent ? 'text-brand' : 'text-text-primary'
                      )}>
                        {chapter.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatDuration(chapter.startTime)}
                      </p>
                    </div>
                    {isCurrent && (
                      <Sparkles className="h-4 w-4 text-brand animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Transcript Panel */}
      {showTranscript && transcriptSegments.length > 0 && (
        <div
          ref={transcriptRef}
          className="border-t border-border px-4 py-3 max-h-[300px] overflow-y-auto"
        >
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2 sticky top-0 bg-surface/90 backdrop-blur-sm py-2 -mt-2">
            <FileText className="h-4 w-4" />
            Transcript
            <span className="text-xs text-text-muted font-normal">
              (tap to jump)
            </span>
          </h4>
          <div className="space-y-2">
            {transcriptSegments.map((segment) => {
              const isCurrent = currentSegment?.id === segment.id;
              return (
                <button
                  key={segment.id}
                  data-segment={segment.id}
                  onClick={() => seekTo(segment.startTime)}
                  className={cn(
                    'w-full text-left rounded-lg p-2 transition-all text-sm',
                    isCurrent
                      ? 'bg-brand/10 text-text-primary border-l-2 border-brand'
                      : 'text-text-secondary hover:bg-surface-secondary'
                  )}
                >
                  {segment.text}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
