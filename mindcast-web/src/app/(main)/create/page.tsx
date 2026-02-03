'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Lightbulb,
  Zap,
  Clock,
  Brain,
  Mic,
  BookOpen,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AudioPlayer } from '@/components/audio-player';
import { cn } from '@/lib/utils';

const LENGTHS = [
  { value: '5 min', label: '5 min', words: '~750', icon: Clock },
  { value: '10 min', label: '10 min', words: '~1.5k', icon: Clock },
  { value: '15 min', label: '15 min', words: '~2.2k', icon: Clock },
  { value: '20 min', label: '20 min', words: '~3k', icon: Clock },
];

// Rotating tips shown during generation
const LOADING_TIPS = [
  { icon: Brain, text: 'Our AI is researching your topic from multiple angles...' },
  { icon: BookOpen, text: 'Two AI models are drafting different approaches...' },
  { icon: Sparkles, text: 'A judge AI is selecting the best narrative...' },
  { icon: Mic, text: 'Enhancing for natural spoken delivery...' },
  { icon: Lightbulb, text: 'Adding depth and memorable insights...' },
];

// Quick topic suggestions for inspiration
const TOPIC_SUGGESTIONS = [
  'The psychology of habit formation',
  'How the universe will end',
  'The history of coffee',
  'Why we dream',
];

type PipelineStep = {
  name: string;
  status: 'pending' | 'running' | 'done';
};

const PIPELINE_STEPS: PipelineStep[] = [
  { name: 'Research', status: 'pending' },
  { name: 'Drafting', status: 'pending' },
  { name: 'Judging', status: 'pending' },
  { name: 'Enhancing', status: 'pending' },
  { name: 'Voice Polish', status: 'pending' },
  { name: 'Flow Optimization', status: 'pending' },
  { name: 'Final Polish', status: 'pending' },
  { name: 'Audio', status: 'pending' },
];

export default function CreatePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [length, setLength] = useState('10 min');
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(PIPELINE_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [quickHook, setQuickHook] = useState<{
    hook: string;
    preview: string;
    funFact: string;
  } | null>(null);
  const [result, setResult] = useState<{
    id: string;
    audio: string;
    transcript: string;
  } | null>(null);

  // Rotating tip index
  const [tipIndex, setTipIndex] = useState(0);

  // Mobile stability: refs for cleanup and connection status
  const abortControllerRef = useRef<AbortController | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);

  // Rotate tips every 4 seconds during generation
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Mobile stability: Request wake lock to prevent screen sleep during generation
  useEffect(() => {
    if (!isGenerating) {
      // Release wake lock when not generating
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
      return;
    }

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake lock not supported or denied - continue anyway
      }
    };

    requestWakeLock();

    // Re-acquire wake lock if page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isGenerating) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [isGenerating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      wakeLockRef.current?.release();
    };
  }, []);

  const completedSteps = steps.filter((s) => s.status === 'done').length;
  const progress = (completedSteps / steps.length) * 100;
  const currentStep = steps.find((s) => s.status === 'running');

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    // Cancel any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setPreviewAudio(null);
    setQuickHook(null);
    setTipIndex(0);
    setConnectionLost(false);
    setSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' })));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, length }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.needsUpgrade) {
          router.push('/pricing');
          return;
        }
        throw new Error(data.error || 'Generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let hasReceivedData = false;
      let lastDataTime = Date.now();

      // Connection health check - detect stalled connections on mobile
      const healthCheckInterval = setInterval(() => {
        if (Date.now() - lastDataTime > 60000) { // 60 seconds without data
          setConnectionLost(true);
        }
      }, 10000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          hasReceivedData = true;
          lastDataTime = Date.now();
          setConnectionLost(false);

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.quickHook) {
                  setQuickHook(data.quickHook);
                }

                if (data.step) {
                  updateStepFromEvent(data.step);
                }

                if (data.preview?.audio) {
                  setPreviewAudio(data.preview.audio);
                }

                if (data.complete && data.episode) {
                  setResult({
                    id: data.episode.id,
                    audio: data.episode.audio,
                    transcript: data.episode.transcript,
                  });
                }
              } catch (parseError) {
                // Skip malformed JSON but continue processing
                console.warn('Skipping malformed SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        clearInterval(healthCheckInterval);
      }

    } catch (err) {
      // Don't show error if request was intentionally aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      // Better error messages for common mobile issues
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Connection lost. Please check your internet and try again.');
        setConnectionLost(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [topic, length, session, router]);

  const updateStepFromEvent = (event: { type: string; status: string; stageName?: string }) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      const typeToIndex: Record<string, number> = {
        research: 0,
        drafts: 1,
        judge: 2,
        enhancement: -1,
        audio: 7,
      };

      let index = typeToIndex[event.type];

      if (event.type === 'enhancement' && event.stageName) {
        if (event.stageName.includes('Deep')) index = 3;
        else if (event.stageName.includes('Voice') || event.stageName.includes('De-AI')) index = 4;
        else if (event.stageName.includes('Oral')) index = 5;
        else if (event.stageName.includes('Polish')) index = 6;
      }

      if (event.type === 'critique') return newSteps;

      if (index >= 0 && index < newSteps.length) {
        newSteps[index] = {
          ...newSteps[index],
          status: event.status === 'running' ? 'running' : 'done',
        };
      }

      return newSteps;
    });
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const CurrentTip = LOADING_TIPS[tipIndex];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-1 sm:px-0">
      {/* Header - more compact on mobile */}
      <div className="text-center">
        <h1 className="mb-1 text-2xl font-bold text-text-primary sm:text-display-sm">
          Create Episode
        </h1>
        <p className="text-sm text-text-secondary sm:text-body-md">
          Enter any topic for a documentary-style audio episode
        </p>
      </div>

      {!result ? (
        <Card className="overflow-hidden">
          <CardContent className="space-y-5 p-4 sm:p-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                What do you want to learn about?
              </label>
              <Textarea
                placeholder="e.g., The history of jazz, How CRISPR works..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
                className="min-h-[80px] resize-none text-base sm:min-h-[100px]"
              />

              {/* Quick suggestions - mobile friendly chips */}
              {!topic && !isGenerating && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-text-muted">Try:</span>
                  {TOPIC_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setTopic(suggestion)}
                      className="rounded-full bg-surface-tertiary px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-border active:scale-95"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Length Selection - 2x2 grid on mobile, 4 columns on desktop */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Episode Length
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LENGTHS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLength(l.value)}
                    disabled={isGenerating}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition-all active:scale-95',
                      'min-h-[72px] touch-manipulation', // Better touch target
                      length === l.value
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border hover:border-brand/50'
                    )}
                  >
                    <span className="text-lg font-semibold">{l.label}</span>
                    <span className="text-xs text-text-muted">{l.words} words</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-error/10 p-4 text-error">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Loading State - Enhanced */}
            {isGenerating && (
              <div className="space-y-4">
                {/* Connection lost warning */}
                {connectionLost && (
                  <div className="flex items-center gap-3 rounded-xl bg-warning/10 p-4 text-warning">
                    <WifiOff className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Connection slow or lost</p>
                      <p className="text-xs opacity-80">Generation is still running on the server...</p>
                    </div>
                  </div>
                )}

                {/* Quick Hook - instant engagement */}
                {quickHook ? (
                  <div className="animate-fade-in space-y-3 rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 to-brand/10 p-4">
                    <div className="flex items-center gap-2 text-brand">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-semibold">Your episode is brewing...</span>
                    </div>
                    <p className="text-lg font-medium leading-snug text-text-primary">
                      "{quickHook.hook}"
                    </p>
                    <p className="text-sm text-text-secondary">{quickHook.preview}</p>
                    <div className="flex items-start gap-2 rounded-lg bg-white/80 p-3">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">Fun fact: </span>
                        {quickHook.funFact}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Initial loading state before hook arrives */
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-secondary p-6">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-brand/10" />
                      <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-brand" />
                    </div>
                    <p className="text-center text-sm text-text-secondary">
                      Preparing something special for you...
                    </p>
                  </div>
                )}

                {/* Progress section */}
                <div className="space-y-3">
                  {/* Animated tip */}
                  <div
                    key={tipIndex}
                    className="flex items-center gap-2 animate-fade-in rounded-lg bg-surface-secondary p-3"
                  >
                    <CurrentTip.icon className="h-4 w-4 shrink-0 text-brand" />
                    <p className="text-sm text-text-secondary">{CurrentTip.text}</p>
                  </div>

                  {/* Progress bar with percentage */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>{currentStep?.name || 'Starting'}...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Compact step indicators */}
                  <div className="flex flex-wrap gap-1.5">
                    {steps.map((step, i) => (
                      <div
                        key={step.name}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all',
                          step.status === 'done' && 'bg-success text-white',
                          step.status === 'running' && 'bg-brand text-white animate-pulse',
                          step.status === 'pending' && 'bg-surface-tertiary text-text-muted'
                        )}
                        title={step.name}
                      >
                        {step.status === 'done' ? (
                          <Check className="h-4 w-4" />
                        ) : step.status === 'running' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          i + 1
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Audio - when ready */}
                {previewAudio && (
                  <div className="animate-slide-up rounded-xl border-2 border-success/30 bg-success/5 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-success">
                        Preview ready - start listening!
                      </p>
                    </div>
                    <AudioPlayer src={previewAudio} autoPlay />
                    <p className="mt-2 text-center text-xs text-text-muted">
                      Full episode generating in background...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Generate Button - larger touch target */}
            {isGenerating ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    abortControllerRef.current?.abort();
                    setIsGenerating(false);
                    setError('Generation cancelled');
                  }}
                  className="h-14 flex-1"
                  size="lg"
                >
                  Cancel
                </Button>
                <div className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-xl bg-brand/10 text-brand">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-base font-medium">Creating...</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="h-14 w-full text-base"
                size="lg"
              >
                <Sparkles className="h-5 w-5" />
                {error ? 'Try Again' : 'Create Episode'}
              </Button>
            )}

            {/* Free tier notice */}
            {session?.user && !session.user.isPro && !isGenerating && (
              <p className="text-center text-xs text-text-muted">
                {3 - (session.user.freeEpisodesUsed || 0)} free episodes remaining •{' '}
                <button
                  onClick={() => router.push('/pricing')}
                  className="text-brand underline"
                >
                  Upgrade for unlimited
                </button>
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Result - mobile optimized */
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <Badge variant="success" className="mb-2 w-fit">
                Episode Ready
              </Badge>
              <CardTitle className="text-xl">{topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioPlayer src={result.audio} title={topic} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm text-text-secondary sm:max-h-[400px]">
                {result.transcript}
              </div>
            </CardContent>
          </Card>

          {/* Action buttons - stacked on mobile */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setTopic('');
              }}
              className="h-12 flex-1"
            >
              Create Another
            </Button>
            <Button
              onClick={() => router.push(`/episode/${result.id}`)}
              className="h-12 flex-1"
            >
              View Full Episode
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
