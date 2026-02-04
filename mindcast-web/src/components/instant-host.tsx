'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstantHostProps {
  topic: string;
  isGenerating: boolean;
  episodeReady: boolean;
  onReadyToPlay: () => void;
}

type HostPhase = 'idle' | 'intro' | 'deep_dive' | 'curiosity' | 'almost_ready' | 'asking';

export function InstantHost({
  topic,
  isGenerating,
  episodeReady,
  onReadyToPlay,
}: InstantHostProps) {
  const [phase, setPhase] = useState<HostPhase>('idle');
  const [currentText, setCurrentText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const hasStartedRef = useRef(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseCountRef = useRef(0); // Track how many phases we've done

  const stopAudioPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const fallbackToSpeechSynthesis = useCallback((text: string, onDone: () => void) => {
    if (isMuted || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.name.includes('Samantha') ||
        v.name.includes('Alex') ||
        v.name.includes('Google') ||
        v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      onDone();
    };
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Generate and speak content for a phase
  const generateAndSpeak = useCallback(async (targetPhase: HostPhase, onComplete?: () => void) => {
    if (targetPhase === 'idle' || targetPhase === 'asking') return;

    try {
      setPhase(targetPhase);
      setIsLoadingAudio(true);
      stopAudioPlayback();

      // Get topic-specific content from API
      const response = await fetch('/api/instant-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, phase: targetPhase }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const { text } = await response.json();
      setCurrentText(text);

      if (isMuted) {
        setIsLoadingAudio(false);
        onComplete?.();
        return;
      }

      // Determine next phase based on current phase
      const handlePhaseEnd = () => {
        phaseCountRef.current += 1;

        // Call completion callback if provided (for almost_ready -> asking)
        if (onComplete) {
          onComplete();
          return;
        }

        // Natural flow: intro -> deep_dive -> curiosity -> (loop curiosity if needed)
        if (!episodeReady) {
          const nextPhase = targetPhase === 'intro' ? 'deep_dive' : 'curiosity';
          // Small pause between segments (2 seconds feels natural)
          phaseTimerRef.current = setTimeout(() => {
            generateAndSpeak(nextPhase);
          }, 2000);
        }
      };

      const ttsResponse = await fetch('/api/instant-host/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      setIsLoadingAudio(false);

      if (!ttsResponse.ok) {
        throw new Error('Failed to generate voice audio');
      }

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = audioUrl;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        handlePhaseEnd();
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        fallbackToSpeechSynthesis(text, handlePhaseEnd);
      };

      try {
        await audio.play();
      } catch {
        fallbackToSpeechSynthesis(text, handlePhaseEnd);
      }
    } catch (err) {
      console.error('Instant host error:', err);
      setIsLoadingAudio(false);
      setError('Could not start voice host');
    }
  }, [topic, isMuted, episodeReady, stopAudioPlayback, fallbackToSpeechSynthesis]);

  // Start when generation begins
  useEffect(() => {
    if (isGenerating && !hasStartedRef.current && topic) {
      hasStartedRef.current = true;
      // Small delay to let UI settle
      setTimeout(() => generateAndSpeak('intro'), 500);
    }

    if (!isGenerating) {
      hasStartedRef.current = false;
      setPhase('idle');
      setCurrentText('');
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
      window.speechSynthesis?.cancel();
      stopAudioPlayback();
    }
  }, [isGenerating, topic, generateAndSpeak, stopAudioPlayback]);

  // When episode is ready, do the transition
  useEffect(() => {
    if (episodeReady && isGenerating && phase !== 'almost_ready' && phase !== 'asking') {
      // Clear any pending phase transitions
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }

      // Wait for current audio to finish naturally, or if nothing playing, start immediately
      const startTransition = () => {
        window.speechSynthesis?.cancel();
        stopAudioPlayback();

        // Generate "almost_ready" and ONLY set to 'asking' when audio finishes
        generateAndSpeak('almost_ready', () => {
          setPhase('asking');
        });
      };

      if (isPlaying) {
        // Let current segment finish, then transition
        const checkAudioEnd = setInterval(() => {
          if (!audioRef.current || audioRef.current.ended || audioRef.current.paused) {
            clearInterval(checkAudioEnd);
            startTransition();
          }
        }, 100);
        // Safety timeout - don't wait more than 10 seconds
        setTimeout(() => {
          clearInterval(checkAudioEnd);
          startTransition();
        }, 10000);
      } else {
        // Nothing playing, start immediately
        setTimeout(startTransition, 300);
      }
    }
  }, [episodeReady, isGenerating, phase, isPlaying, generateAndSpeak, stopAudioPlayback]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
      window.speechSynthesis?.cancel();
      stopAudioPlayback();
    };
  }, [stopAudioPlayback]);

  // Load voices (needed for some browsers)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const toggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis?.cancel();
      stopAudioPlayback();
    }
    setIsMuted(!isMuted);
  };

  if (!isGenerating || error) return null;

  return (
    <div className="rounded-xl border-2 border-brand/30 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-4">
      {/* Host Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isPlaying
                ? 'bg-brand animate-pulse'
                : 'bg-brand/20'
            )}
          >
            {isPlaying ? (
              <Volume2 className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-brand" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {phase === 'asking' ? 'Your episode is ready!' : 'Your AI Host'}
            </p>
            <p className="text-xs text-text-muted">
              {isPlaying
                ? 'Speaking...'
                : isLoadingAudio
                  ? 'Thinking...'
                  : phase === 'asking'
                    ? 'Tap to listen'
                    : 'Preparing...'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleMute}
          className="rounded-full p-2 text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Current Speech Text */}
      {currentText && (
        <div className="rounded-lg bg-surface/80 p-3 mb-3">
          <p className="text-body-sm text-text-secondary leading-relaxed">
            "{currentText}"
          </p>
        </div>
      )}

      {/* Play Episode Button - shows when ready */}
      {phase === 'asking' && episodeReady && (
        <button
          onClick={onReadyToPlay}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-white font-medium transition-all hover:bg-brand/90 active:scale-[0.98]"
        >
          <Sparkles className="h-5 w-5" />
          Yes, play my episode!
        </button>
      )}

      {/* Loading indicator for content generation */}
      {(isLoadingAudio || (!currentText && phase !== 'idle' && phase !== 'asking')) && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          <span className="text-sm text-text-muted">
            {phase === 'intro'
              ? `Getting ready to talk about ${topic.slice(0, 25)}...`
              : phase === 'almost_ready'
                ? 'Almost there...'
                : 'Gathering thoughts...'}
          </span>
        </div>
      )}
    </div>
  );
}
