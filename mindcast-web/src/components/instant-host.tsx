'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, Square, Waves, Send, ChevronDown, ChevronUp, Brain, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstantHostProps {
  topic: string;
  isGenerating: boolean;
  episodeReady: boolean;
  onReadyToPlay: () => void;
}

type HostPhase = 'idle' | 'intro' | 'deep_dive' | 'curiosity' | 'almost_ready' | 'asking' | 'listening' | 'responding';

// Ambient sounds for background during wait
const AMBIENT_SOUNDS = [
  { id: 'off', label: 'Off', emoji: '🔇' },
  { id: 'rain', label: 'Rain', emoji: '🌧️', url: '/audio/ambient/rain.mp3' },
  { id: 'cafe', label: 'Cafe', emoji: '☕', url: '/audio/ambient/cafe.mp3' },
  { id: 'fire', label: 'Fire', emoji: '🔥', url: '/audio/ambient/fire.wav' },
  { id: 'forest', label: 'Forest', emoji: '🌲', url: '/audio/ambient/forest.wav' },
];

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

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
  const [isStopped, setIsStopped] = useState(false); // Permanently stopped by user
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [ambientSound, setAmbientSound] = useState('off');
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [userSpeech, setUserSpeech] = useState('');
  const [micEnabled, setMicEnabled] = useState(false); // Start disabled until permission granted
  const [micPermissionAsked, setMicPermissionAsked] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false); // Alternative to voice
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'host' | 'user', text: string}>>([]);

  // Mini-quiz state (collapsible entertainment while waiting)
  interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }
  const [quizExpanded, setQuizExpanded] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizGenerated, setQuizGenerated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const handleUserInputRef = useRef<(transcript: string) => void>(() => {});
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

  const stopAmbient = useCallback(() => {
    if (ambientRef.current) {
      ambientRef.current.pause();
      ambientRef.current.src = '';
    }
  }, []);

  // Stop listening completely - defined early so stopAll can use it
  const stopListening = useCallback(() => {
    shouldAutoRestartRef.current = false; // Disable auto-restart
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Not started
    }
    setIsListening(false);
  }, []);

  // Full stop - stops everything including ambient, mic, and prevents restart
  const stopAll = useCallback(() => {
    setIsStopped(true);
    setIsMuted(true);
    stopAudioPlayback();
    stopAmbient();
    stopListening();
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }, [stopAudioPlayback, stopAmbient, stopListening]);

  // Ambient sound effect
  useEffect(() => {
    if (!ambientRef.current) {
      ambientRef.current = new Audio();
      ambientRef.current.loop = true;
      ambientRef.current.volume = 0.3;
    }

    const sound = AMBIENT_SOUNDS.find((s) => s.id === ambientSound);
    if (!sound?.url || isStopped) {
      ambientRef.current.pause();
      ambientRef.current.src = '';
      return;
    }

    ambientRef.current.src = sound.url;
    ambientRef.current.play().catch(() => {});

    return () => {
      ambientRef.current?.pause();
    };
  }, [ambientSound, isStopped]);

  // Track if we should auto-restart listening
  const shouldAutoRestartRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening continuously
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      setUserSpeech(transcript);

      if (event.results[last].isFinal && transcript.trim().length > 2) {
        // User finished speaking - use ref to get latest callback
        // Only process if there's meaningful input (more than 2 chars)
        handleUserInputRef.current(transcript);
      }
    };

    recognition.onerror = (event) => {
      // Don't treat "no-speech" as an error - just keep listening
      if ((event as any).error === 'no-speech') {
        return;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if we should keep listening
      if (shouldAutoRestartRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // Already started
          }
        }, 100);
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldAutoRestartRef.current = false;
      recognition.abort();
    };
  }, []);

  // Request microphone permission
  const requestMicPermission = useCallback(async () => {
    setMicPermissionAsked(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicEnabled(true);
      return true;
    } catch {
      setMicEnabled(false);
      setShowTextInput(true); // Fall back to text input
      return false;
    }
  }, []);

  // Start listening for user input (continuous mode)
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isStopped || isMuted || !micEnabled) return;

    shouldAutoRestartRef.current = true; // Enable auto-restart
    try {
      setUserSpeech('');
      recognitionRef.current.start();
    } catch {
      // Already started or not supported
    }
  }, [isStopped, isMuted, micEnabled]);

  // Pause listening temporarily (for when AI is speaking)
  const pauseListening = useCallback(() => {
    shouldAutoRestartRef.current = false;
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Not started
    }
    setIsListening(false);
  }, []);

  // Handle user input and generate response
  const handleUserInput = useCallback(async (transcript: string) => {
    if (!transcript.trim() || isStopped) return;

    pauseListening(); // Pause while AI responds (will auto-restart after)
    setUserSpeech(''); // Clear the speech display
    setPhase('responding');
    setIsLoadingAudio(true);

    // Add to conversation history
    setConversationHistory(prev => [...prev, { role: 'user', text: transcript }]);

    try {
      // Get AI response based on user input
      const response = await fetch('/api/instant-host/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          userMessage: transcript,
          conversationHistory: conversationHistory.slice(-4), // Last 4 exchanges for context
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const { text } = await response.json();
      setCurrentText(text);

      // Add host response to history
      setConversationHistory(prev => [...prev, { role: 'host', text }]);

      // Generate TTS for response
      if (!isMuted) {
        const ttsResponse = await fetch('/api/instant-host/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        setIsLoadingAudio(false);

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          audioUrlRef.current = audioUrl;

          const audio = audioRef.current ?? new Audio();
          audioRef.current = audio;
          audio.src = audioUrl;

          audio.onplay = () => setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            // After responding, start listening again if not stopped
            if (!isStopped && !episodeReady && micEnabled) {
              setTimeout(() => {
                setPhase('listening');
                startListening();
              }, 500);
            } else if (episodeReady) {
              setPhase('asking');
            }
          };
          audio.onerror = () => setIsPlaying(false);

          await audio.play();
        }
      } else {
        setIsLoadingAudio(false);
      }
    } catch (err) {
      console.error('Response error:', err);
      setIsLoadingAudio(false);
      // Fall back to regular phase flow
      setPhase('curiosity');
    }
  }, [topic, conversationHistory, isStopped, isMuted, micEnabled, episodeReady, pauseListening, startListening]);

  // Keep ref updated with latest handleUserInput (for speech recognition callback)
  useEffect(() => {
    handleUserInputRef.current = handleUserInput;
  }, [handleUserInput]);

  // Handle text input submission
  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    handleUserInput(textInput.trim());
    setTextInput('');
  }, [textInput, handleUserInput]);

  // Generate quiz questions for the topic
  const generateQuiz = useCallback(async () => {
    if (quizGenerated || quizLoading) return;
    setQuizLoading(true);

    try {
      const response = await fetch('/api/instant-host/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (response.ok) {
        const { questions } = await response.json();
        setQuizQuestions(questions);
        setQuizGenerated(true);
      }
    } catch (err) {
      console.error('Quiz generation error:', err);
    } finally {
      setQuizLoading(false);
    }
  }, [topic, quizGenerated, quizLoading]);

  // Handle quiz answer selection
  const handleQuizAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return; // Already answered
    setSelectedAnswer(answerIndex);

    const currentQuestion = quizQuestions[currentQuizIndex];
    if (answerIndex === currentQuestion.correctIndex) {
      setQuizScore(prev => prev + 1);
    }
  }, [selectedAnswer, quizQuestions, currentQuizIndex]);

  // Move to next quiz question
  const nextQuizQuestion = useCallback(() => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
    }
  }, [currentQuizIndex, quizQuestions.length]);

  // Generate and speak content for a phase
  const generateAndSpeak = useCallback(async (targetPhase: HostPhase, onComplete?: () => void) => {
    if (targetPhase === 'idle' || targetPhase === 'asking') return;
    if (isStopped) return; // Don't generate if user stopped

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

      // If muted, show text but don't play audio or auto-progress
      if (isMuted) {
        setIsLoadingAudio(false);
        // Don't auto-progress when muted - user controls the flow
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

        // After intro, ask for mic permission (only once)
        if (targetPhase === 'intro' && !micPermissionAsked) {
          setPhase('listening'); // Pause here for permission/input
          return; // Don't auto-continue - wait for user interaction
        }

        // After host speaks, pause and wait for user response if enabled
        if (!episodeReady && (micEnabled || showTextInput) && !isStopped) {
          setPhase('listening');

          if (micEnabled) {
            // Give user a moment, then start listening
            phaseTimerRef.current = setTimeout(() => {
              startListening();
            }, 1000);
          }

          // If user doesn't respond within 15 seconds, continue with next phase
          phaseTimerRef.current = setTimeout(() => {
            if (phase === 'listening') {
              const nextPhase = phaseCountRef.current < 2 ? 'deep_dive' : 'curiosity';
              generateAndSpeak(nextPhase);
            }
          }, 15000);
        } else if (!episodeReady && !micPermissionAsked) {
          // If no conversation mode, continue with regular flow
          const nextPhase = targetPhase === 'intro' ? 'deep_dive' : 'curiosity';
          phaseTimerRef.current = setTimeout(() => {
            generateAndSpeak(nextPhase);
          }, 3000);
        }
      };

      const ttsResponse = await fetch('/api/instant-host/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      setIsLoadingAudio(false);

      if (!ttsResponse.ok) {
        // If TTS fails, just skip to next phase silently (no robotic fallback)
        console.warn('TTS failed, skipping audio');
        handlePhaseEnd();
        return;
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
        // On audio error, skip to next phase (no robotic fallback)
        setIsPlaying(false);
        setIsLoadingAudio(false);
        console.warn('Audio playback error, skipping');
        handlePhaseEnd();
      };

      try {
        await audio.play();
      } catch {
        // If play fails, skip to next phase (no robotic fallback)
        console.warn('Audio play failed, skipping');
        handlePhaseEnd();
      }
    } catch (err) {
      console.error('Instant host error:', err);
      setIsLoadingAudio(false);
      setError('Could not start voice host');
    }
  }, [topic, isMuted, isStopped, micEnabled, micPermissionAsked, showTextInput, episodeReady, phase, isListening, stopAudioPlayback, startListening]);

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
      stopAudioPlayback();
      stopAmbient();
    };
  }, [stopAudioPlayback, stopAmbient]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (newMuted) {
      // Stop all audio and pending phases when muting
      stopAudioPlayback();
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
    }
  };

  if (!isGenerating || error) return null;

  return (
    <div className="rounded-xl border-2 border-brand/30 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-4">
      {/* Host Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-all',
              isListening
                ? 'bg-success animate-pulse'
                : isPlaying
                  ? 'bg-brand animate-pulse'
                  : phase === 'responding'
                    ? 'bg-brand/60'
                    : 'bg-brand/20'
            )}
          >
            {isListening ? (
              <Mic className="h-5 w-5 text-white" />
            ) : isPlaying ? (
              <Volume2 className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-brand" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {phase === 'asking'
                ? 'Your episode is ready!'
                : phase === 'listening' && micPermissionAsked
                  ? 'Your turn to chat!'
                  : phase === 'listening'
                    ? 'Want to have a conversation?'
                    : 'Your AI Host'}
            </p>
            <p className="text-xs text-text-muted">
              {isListening
                ? 'Speak now...'
                : isPlaying
                  ? 'Speaking...'
                  : isLoadingAudio
                    ? 'Thinking...'
                    : phase === 'asking'
                      ? 'Tap to listen'
                      : phase === 'listening' && micPermissionAsked
                        ? 'Ask anything or tap a suggestion'
                        : phase === 'responding'
                          ? 'Processing...'
                          : 'Preparing...'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 w-full sm:w-auto sm:justify-end">
          {/* Ambient sounds */}
          <div className="relative">
            <button
              onClick={() => setShowAmbientMenu(!showAmbientMenu)}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9',
                ambientSound !== 'off' ? 'text-brand' : 'text-text-muted hover:text-text-primary'
              )}
              aria-label="Background sounds"
            >
              <Waves className="h-5 w-5" />
            </button>
            {showAmbientMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-border bg-surface p-1 shadow-lg z-10">
                {AMBIENT_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => {
                      setAmbientSound(sound.id);
                      setShowAmbientMenu(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      ambientSound === sound.id ? 'bg-brand/10 text-brand' : 'hover:bg-surface-tertiary'
                    )}
                  >
                    <span>{sound.emoji}</span>
                    <span>{sound.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mic toggle - enable/disable conversation */}
          <button
            onClick={() => {
              if (micEnabled) stopListening();
              setMicEnabled(!micEnabled);
            }}
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9',
              micEnabled
                ? 'text-success hover:bg-success/10'
                : 'text-text-muted hover:bg-surface-secondary'
            )}
            aria-label={micEnabled ? 'Disable conversation' : 'Enable conversation'}
          >
            {micEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>

          {/* Mute/unmute */}
          <button
            onClick={toggleMute}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors sm:h-9 sm:w-9"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          {/* Stop button */}
          <button
            onClick={stopAll}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-error/10 hover:text-error transition-colors sm:h-9 sm:w-9"
            aria-label="Stop all audio"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>

      {/* User Speech (when listening) */}
      {(isListening || userSpeech) && phase === 'listening' && (
        <div className="rounded-lg bg-success/10 border border-success/30 p-3 mb-3">
          <p className="text-xs text-success mb-1">You said:</p>
          <p className="text-body-sm text-text-primary leading-relaxed">
            {userSpeech || '(listening...)'}
          </p>
        </div>
      )}

      {/* Current Host Text */}
      {currentText && phase !== 'listening' && (
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
      {(isLoadingAudio || (!currentText && phase !== 'idle' && phase !== 'asking' && phase !== 'listening')) && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          <span className="text-sm text-text-muted">
            {phase === 'intro'
              ? `Getting ready to talk about ${topic.slice(0, 25)}...`
              : phase === 'almost_ready'
                ? 'Almost there...'
                : phase === 'responding'
                  ? 'Thinking about what you said...'
                  : 'Gathering thoughts...'}
          </span>
        </div>
      )}

      {/* Mic Permission Prompt - shown after intro if not yet asked */}
      {phase === 'listening' && !micPermissionAsked && (
        <div className="space-y-3 mt-3 p-3 rounded-xl bg-surface-secondary">
          <p className="text-sm text-text-primary text-center">
            Want to chat while your episode generates?
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={async () => {
                const granted = await requestMicPermission();
                if (granted) {
                  startListening();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-3 text-base text-white font-medium transition-all hover:bg-brand/90 sm:py-2.5 sm:text-sm"
            >
              <Mic className="h-4 w-4" />
              Enable voice
            </button>
            <button
              onClick={() => {
                setMicPermissionAsked(true);
                setShowTextInput(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-base text-text-primary font-medium transition-all hover:bg-surface-tertiary sm:py-2.5 sm:text-sm"
            >
              Type instead
            </button>
          </div>
          <button
            onClick={() => {
              setMicPermissionAsked(true);
              setMicEnabled(false);
              setShowTextInput(false);
              // Continue to next phase
              generateAndSpeak('deep_dive');
            }}
            className="w-full text-sm text-text-muted hover:text-text-secondary text-center py-2 sm:text-xs sm:py-1"
          >
            Skip — just listen
          </button>
        </div>
      )}

      {/* Text Input for typing responses */}
      {showTextInput && phase === 'listening' && micPermissionAsked && (
        <div className="mt-3 space-y-3">
          {/* Conversation prompts for text input */}
          {conversationHistory.length === 0 && (
            <div className="rounded-xl bg-surface-secondary/50 p-3 space-y-2">
              <p className="text-sm text-text-secondary text-center">
                Ask me anything about <span className="font-medium text-text-primary">{topic.slice(0, 30)}{topic.length > 30 ? '...' : ''}</span>
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  `What fascinates you about this?`,
                  `Tell me something surprising`,
                  `Why does this matter?`,
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleUserInput(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-brand/30 text-brand hover:bg-brand/10 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversationHistory.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {[`Tell me more`, `Give an example`, `What else?`].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleUserInput(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-brand/30 text-brand hover:bg-brand/10 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Type your question or thought..."
              className="flex-1 rounded-xl border border-border bg-surface px-3 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 sm:py-2.5 sm:text-sm"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="w-full rounded-xl bg-brand px-4 py-3 text-base text-white font-medium transition-all hover:bg-brand/90 disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm"
            >
              <Send className="h-4 w-4 sm:hidden" />
              <span className="sm:inline hidden">Send</span>
              <span className="sm:hidden">Send</span>
            </button>
          </div>
          <button
            onClick={() => {
              const nextPhase = phaseCountRef.current < 2 ? 'deep_dive' : 'curiosity';
              generateAndSpeak(nextPhase);
            }}
            className="w-full text-sm text-text-muted hover:text-text-secondary text-center py-2 sm:text-xs"
          >
            Skip — continue listening
          </button>
        </div>
      )}

      {/* Voice listening state */}
      {micEnabled && phase === 'listening' && micPermissionAsked && !showTextInput && (
        <div className="mt-3 space-y-3">
          {/* Conversation prompts - help user know what to say */}
          {!isListening && conversationHistory.length === 0 && (
            <div className="rounded-xl bg-surface-secondary/50 p-3 space-y-2">
              <p className="text-sm text-text-secondary text-center">
                Ask me anything about <span className="font-medium text-text-primary">{topic.slice(0, 30)}{topic.length > 30 ? '...' : ''}</span>
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  `What fascinates you about this?`,
                  `Tell me something surprising`,
                  `Why does this matter?`,
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleUserInput(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-brand/30 text-brand hover:bg-brand/10 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Continue the conversation prompt */}
          {!isListening && conversationHistory.length > 0 && (
            <div className="rounded-xl bg-surface-secondary/50 p-3">
              <p className="text-sm text-text-secondary text-center mb-2">
                Continue the conversation or ask follow-up questions
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  `Tell me more`,
                  `Can you give an example?`,
                  `What else should I know?`,
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleUserInput(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-brand/30 text-brand hover:bg-brand/10 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Continuous listening indicator */}
          <div className="relative">
            <div className={cn(
              "flex items-center justify-center gap-2 py-4 rounded-xl border sm:py-3 transition-all",
              isListening
                ? "bg-success/10 border-success/30"
                : "bg-surface-secondary/50 border-border"
            )}>
              <div className={cn(
                "w-3 h-3 rounded-full transition-all",
                isListening ? "bg-success animate-pulse" : "bg-text-muted"
              )} />
              <span className={cn(
                "text-base font-medium sm:text-sm transition-colors",
                isListening ? "text-success" : "text-text-muted"
              )}>
                {userSpeech || (isListening ? 'Listening... speak anytime' : 'Mic paused')}
              </span>
            </div>
            {/* Mute/unmute mic button */}
            <button
              onClick={() => {
                if (isListening) {
                  pauseListening();
                } else {
                  startListening();
                }
              }}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                isListening
                  ? "text-success hover:bg-success/20"
                  : "text-text-muted hover:bg-surface-tertiary"
              )}
              title={isListening ? "Pause mic" : "Resume mic"}
            >
              {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex gap-2 text-sm sm:text-xs">
            <button
              onClick={() => setShowTextInput(true)}
              className="flex-1 text-text-muted hover:text-text-secondary text-center py-2 sm:py-1"
            >
              Type instead
            </button>
            <button
              onClick={() => {
                stopListening();
                const nextPhase = phaseCountRef.current < 2 ? 'deep_dive' : 'curiosity';
                generateAndSpeak(nextPhase);
              }}
              className="flex-1 text-text-muted hover:text-text-secondary text-center py-2 sm:py-1"
            >
              Skip — continue
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Mini-Quiz - entertainment while waiting */}
      {!episodeReady && phase !== 'asking' && phase !== 'idle' && (
        <div className="mt-4 border-t border-border pt-4">
          <button
            onClick={() => {
              setQuizExpanded(!quizExpanded);
              if (!quizGenerated && !quizLoading) {
                generateQuiz();
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium text-text-primary">Quick Quiz</span>
              {quizScore > 0 && (
                <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                  {quizScore}/{quizQuestions.length} correct
                </span>
              )}
            </div>
            {quizExpanded ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </button>

          {quizExpanded && (
            <div className="mt-3 space-y-3">
              {quizLoading ? (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  <span className="text-sm text-text-muted">Generating quiz...</span>
                </div>
              ) : quizQuestions.length > 0 ? (
                <div className="rounded-xl bg-surface-secondary/50 p-4 space-y-4">
                  {/* Question counter */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      Question {currentQuizIndex + 1} of {quizQuestions.length}
                    </span>
                    <span className="text-xs text-brand font-medium">
                      Score: {quizScore}
                    </span>
                  </div>

                  {/* Question */}
                  <p className="text-sm font-medium text-text-primary">
                    {quizQuestions[currentQuizIndex]?.question}
                  </p>

                  {/* Options */}
                  <div className="space-y-2">
                    {quizQuestions[currentQuizIndex]?.options.map((option, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === quizQuestions[currentQuizIndex].correctIndex;
                      const showResult = selectedAnswer !== null;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          disabled={selectedAnswer !== null}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                            showResult && isCorrect
                              ? "bg-success/20 border border-success/50 text-success"
                              : showResult && isSelected && !isCorrect
                                ? "bg-error/20 border border-error/50 text-error"
                                : isSelected
                                  ? "bg-brand/20 border border-brand/50 text-brand"
                                  : "bg-surface hover:bg-surface-tertiary border border-transparent"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {showResult && isCorrect && <Check className="h-4 w-4" />}
                            {showResult && isSelected && !isCorrect && <X className="h-4 w-4" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation + Next */}
                  {selectedAnswer !== null && (
                    <div className="space-y-2">
                      <p className="text-xs text-text-secondary italic">
                        {quizQuestions[currentQuizIndex]?.explanation}
                      </p>
                      {currentQuizIndex < quizQuestions.length - 1 ? (
                        <button
                          onClick={nextQuizQuestion}
                          className="w-full py-2 text-sm font-medium text-brand hover:bg-brand/10 rounded-lg transition-colors"
                        >
                          Next Question →
                        </button>
                      ) : (
                        <p className="text-center text-sm text-text-muted py-2">
                          Quiz complete! Final score: {quizScore}/{quizQuestions.length}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-4">
                  No quiz available
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
