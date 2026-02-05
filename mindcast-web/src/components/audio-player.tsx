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
  Moon,
  Bookmark,
  X,
  Waves,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn, formatDuration } from '@/lib/utils';

interface Bookmark {
  time: number;
  label?: string;
}

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  artwork?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onBookmarkAdd?: (bookmark: Bookmark) => void;
  onReplay?: () => void;
  bookmarks?: Bookmark[];
  className?: string;
}

const SKIP_SECONDS = 15;
const SPEED_PRESETS = [0.75, 1, 1.25, 1.5, 2];
const SLEEP_TIMER_OPTIONS = [
  { label: 'Off', minutes: 0 },
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
];

// Ambient soundbed options
const AMBIENT_SOUNDS = [
  { id: 'off', label: 'Off', emoji: '🔇', url: '' },
  { id: 'rain', label: 'Rain', emoji: '🌧️', url: '/audio/ambient/rain.mp3' },
  { id: 'cafe', label: 'Cafe', emoji: '☕', url: '/audio/ambient/cafe.mp3' },
  { id: 'fire', label: 'Fireplace', emoji: '🔥', url: '/audio/ambient/fire.wav' },
  { id: 'forest', label: 'Forest', emoji: '🌲', url: '/audio/ambient/forest.wav' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊', url: '/audio/ambient/ocean.wav' },
  { id: 'white', label: 'White Noise', emoji: '📻', url: '/audio/ambient/white-noise.wav' },
];

// Haptic feedback helper - subtle vibrations for key interactions
function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[style]);
  }
}

export function AudioPlayer({
  src,
  title,
  artist = 'MindCast',
  artwork,
  autoPlay = false,
  onEnded,
  onTimeUpdate,
  onBookmarkAdd,
  onReplay,
  bookmarks = [],
  className,
}: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const compressorRef = React.useRef<DynamicsCompressorNode | null>(null);
  const sourceNodeRef = React.useRef<MediaElementAudioSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const ensureAudioProcessing = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    try {
      const context = new AudioContext();
      const source = context.createMediaElementSource(audio);
      const compressor = context.createDynamicsCompressor();

      // Gentle compression for more consistent perceived loudness
      compressor.threshold.value = -18;
      compressor.knee.value = 24;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      source.connect(compressor);
      compressor.connect(context.destination);

      audioContextRef.current = context;
      compressorRef.current = compressor;
      sourceNodeRef.current = source;
    } catch {
      // Cross-origin audio (e.g. CDN) may block createMediaElementSource.
      // Audio still plays fine without the compressor — skip gracefully.
    }
  }, []);

  // Sleep timer state
  const [sleepTimerMinutes, setSleepTimerMinutes] = React.useState(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = React.useState(0);
  const [showSleepMenu, setShowSleepMenu] = React.useState(false);

  // Ambient soundbed state
  const ambientRef = React.useRef<HTMLAudioElement>(null);
  const [ambientSound, setAmbientSound] = React.useState('off');
  const [ambientVolume, setAmbientVolume] = React.useState(0.3);
  const [showAmbientMenu, setShowAmbientMenu] = React.useState(false);

  // Local bookmarks (combined with props)
  const [localBookmarks, setLocalBookmarks] = React.useState<Bookmark[]>([]);
  const allBookmarks = React.useMemo(
    () => [...bookmarks, ...localBookmarks].sort((a, b) => a.time - b.time),
    [bookmarks, localBookmarks]
  );

  // Media Session API - Lock screen and notification controls
  React.useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Set metadata for lock screen display
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'MindCast Episode',
      artist: artist,
      album: 'MindCast',
      artwork: artwork
        ? [
            { src: artwork, sizes: '96x96', type: 'image/png' },
            { src: artwork, sizes: '128x128', type: 'image/png' },
            { src: artwork, sizes: '192x192', type: 'image/png' },
            { src: artwork, sizes: '256x256', type: 'image/png' },
            { src: artwork, sizes: '512x512', type: 'image/png' },
          ]
        : [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
    });

    // Set up action handlers for lock screen controls
    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => audioRef.current?.play()],
      ['pause', () => audioRef.current?.pause()],
      ['seekbackward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - SKIP_SECONDS);
        }
      }],
      ['seekforward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + SKIP_SECONDS);
        }
      }],
      ['seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
        }
      }],
      ['stop', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Action not supported on this device
      }
    }

    return () => {
      // Clean up action handlers
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [title, artist, artwork, duration]);

  // Update position state for lock screen scrubber
  React.useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;

    navigator.mediaSession.setPositionState({
      duration: duration,
      playbackRate: playbackRate,
      position: currentTime,
    });
  }, [currentTime, duration, playbackRate]);

  // Audio element event listeners
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

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };
    const handlePlay = () => {
      ensureAudioProcessing();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
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
  }, [autoPlay, onEnded, ensureAudioProcessing]);

  React.useEffect(() => {
    return () => {
      sourceNodeRef.current?.disconnect();
      compressorRef.current?.disconnect();
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

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

  const seek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
  };

  const cycleSpeed = () => {
    triggerHaptic('light');
    const currentIndex = SPEED_PRESETS.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % SPEED_PRESETS.length;
    setPlaybackRate(SPEED_PRESETS[nextIndex]);
  };

  const restart = () => {
    triggerHaptic('light');
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
    onReplay?.();
  };

  // Sleep timer effect
  React.useEffect(() => {
    if (sleepTimerMinutes === 0 || !isPlaying) {
      setSleepTimerRemaining(0);
      return;
    }

    setSleepTimerRemaining(sleepTimerMinutes * 60);
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev <= 1) {
          audioRef.current?.pause();
          setSleepTimerMinutes(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes, isPlaying]);

  const setSleepTimer = (minutes: number) => {
    triggerHaptic('light');
    setSleepTimerMinutes(minutes);
    setShowSleepMenu(false);
  };

  // Ambient sound effect - sync with main playback
  React.useEffect(() => {
    const ambient = ambientRef.current;
    if (!ambient) return;

    const sound = AMBIENT_SOUNDS.find((s) => s.id === ambientSound);
    if (!sound?.url) {
      ambient.pause();
      ambient.src = '';
      return;
    }

    ambient.src = sound.url;
    ambient.loop = true;
    ambient.volume = ambientVolume;

    // Sync with main audio playback
    if (isPlaying) {
      ambient.play().catch(() => {});
    } else {
      ambient.pause();
    }
  }, [ambientSound, isPlaying, ambientVolume]);

  // Update ambient volume
  React.useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  const selectAmbientSound = (soundId: string) => {
    triggerHaptic('light');
    setAmbientSound(soundId);
    setShowAmbientMenu(false);
  };

  const addBookmark = () => {
    triggerHaptic('medium');
    const newBookmark: Bookmark = {
      time: currentTime,
      label: `Bookmark at ${formatDuration(currentTime)}`,
    };
    setLocalBookmarks((prev) => [...prev, newBookmark]);
    onBookmarkAdd?.(newBookmark);
  };

  const jumpToBookmark = (time: number) => {
    triggerHaptic('light');
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface/80 backdrop-blur-md p-4 shadow-soft sm:p-6',
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <audio ref={ambientRef} loop preload="none" />

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

        {/* Bookmark button */}
        <button
          onClick={addBookmark}
          disabled={isLoading}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-95',
            'touch-manipulation',
            'text-text-muted hover:bg-surface-tertiary hover:text-text-primary',
            'disabled:opacity-30'
          )}
          aria-label="Add bookmark"
        >
          <Bookmark className="h-4 w-4" />
        </button>

        {/* Sleep timer */}
        <div className="relative">
          <button
            onClick={() => setShowSleepMenu(!showSleepMenu)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-95',
              'touch-manipulation',
              'text-text-muted hover:bg-surface-tertiary hover:text-text-primary',
              sleepTimerMinutes > 0 && 'text-brand'
            )}
            aria-label="Sleep timer"
          >
            <Moon className="h-4 w-4" />
          </button>

          {/* Sleep timer menu */}
          {showSleepMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-32 rounded-xl border border-border bg-surface p-1 shadow-lg">
              {SLEEP_TIMER_OPTIONS.map((option) => (
                <button
                  key={option.minutes}
                  onClick={() => setSleepTimer(option.minutes)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                    sleepTimerMinutes === option.minutes
                      ? 'bg-brand/10 text-brand'
                      : 'hover:bg-surface-tertiary'
                  )}
                >
                  {option.label}
                  {sleepTimerMinutes === option.minutes && (
                    <span className="text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Timer countdown display */}
          {sleepTimerRemaining > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-white">
              {Math.ceil(sleepTimerRemaining / 60)}
            </span>
          )}
        </div>

        {/* Ambient soundbed */}
        <div className="relative">
          <button
            onClick={() => setShowAmbientMenu(!showAmbientMenu)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-all active:scale-95',
              'touch-manipulation',
              'text-text-muted hover:bg-surface-tertiary hover:text-text-primary',
              ambientSound !== 'off' && 'text-brand'
            )}
            aria-label="Ambient sounds"
          >
            <Waves className="h-4 w-4" />
          </button>

          {/* Ambient sound menu */}
          {showAmbientMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-44 rounded-xl border border-border bg-surface p-1 shadow-lg">
              <div className="px-3 py-2 text-xs font-medium text-text-muted border-b border-border mb-1">
                Background Sound
              </div>
              {AMBIENT_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => selectAmbientSound(sound.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    ambientSound === sound.id
                      ? 'bg-brand/10 text-brand'
                      : 'hover:bg-surface-tertiary'
                  )}
                >
                  <span>{sound.emoji}</span>
                  <span className="flex-1 text-left">{sound.label}</span>
                  {ambientSound === sound.id && (
                    <span className="text-xs">✓</span>
                  )}
                </button>
              ))}
              {/* Volume slider when ambient is active */}
              {ambientSound !== 'off' && (
                <div className="px-3 py-2 border-t border-border mt-1">
                  <label className="text-xs text-text-muted mb-1 block">Volume</label>
                  <Slider
                    value={[ambientVolume * 100]}
                    max={100}
                    step={5}
                    onValueChange={(v) => setAmbientVolume(v[0] / 100)}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Active indicator */}
          {ambientSound !== 'off' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px]">
              {AMBIENT_SOUNDS.find((s) => s.id === ambientSound)?.emoji}
            </span>
          )}
        </div>

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
            onClick={() => {
              triggerHaptic('light');
              setIsMuted(!isMuted);
            }}
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

      {/* Bookmarks display */}
      {allBookmarks.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-text-muted">Bookmarks</p>
          <div className="flex flex-wrap gap-2">
            {allBookmarks.map((bookmark, index) => (
              <button
                key={index}
                onClick={() => jumpToBookmark(bookmark.time)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1.5 text-xs transition-all active:scale-95',
                  'hover:bg-brand/10 hover:text-brand'
                )}
              >
                <Bookmark className="h-3 w-3" />
                {formatDuration(bookmark.time)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
