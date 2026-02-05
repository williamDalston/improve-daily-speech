'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDevice } from '@/hooks/use-device';
import {
  Sparkles,
  Loader2,
  Check,
  Zap,
  Clock,
  Brain,
  Mic,
  WifiOff,
  GraduationCap,
  History,
  Scale,
  Swords,
  HelpCircle,
  FlaskConical,
  User,
  ChevronDown,
  ChevronUp,
  Volume2,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AudioPlayer } from '@/components/audio-player';
import { FootprintsDisplay } from '@/components/footprints-display';
import { ErrorAlert } from '@/components/error-state';
import { InstantHost } from '@/components/instant-host';
import { cn } from '@/lib/utils';

interface Footprint {
  timestamp: string;
  action: string;
  detail: string;
}

const LENGTHS = [
  { value: '5 min', label: '5 min' },
  { value: '10 min', label: '10 min' },
  { value: '15 min', label: '15 min' },
  { value: '20 min', label: '20 min' },
];

// Brief tips shown during generation
const LOADING_TIPS = [
  { icon: Brain, text: 'Researching your topic...' },
  { icon: Sparkles, text: 'Crafting the narrative...' },
  { icon: Mic, text: 'Generating audio...' },
];

// Topic templates - structured prompts that reduce friction
const TOPIC_TEMPLATES = [
  {
    id: 'explain',
    icon: GraduationCap,
    label: 'Explain like I\'m new',
    prompt: 'Explain [TOPIC] from first principles',
    placeholder: 'quantum computing, blockchain, CRISPR...',
  },
  {
    id: 'history',
    icon: History,
    label: 'History of...',
    prompt: 'The history of [TOPIC] in 10 minutes',
    placeholder: 'the internet, democracy, money...',
  },
  {
    id: 'controversy',
    icon: Scale,
    label: 'The debate around...',
    prompt: '[TOPIC] through the lens of its biggest controversies',
    placeholder: 'AI ethics, nuclear energy...',
  },
  {
    id: 'versus',
    icon: Swords,
    label: 'X vs Y',
    prompt: '[TOPIC]: what\'s the real difference and which is better?',
    placeholder: 'capitalism vs socialism, iOS vs Android...',
  },
  {
    id: 'misconceptions',
    icon: HelpCircle,
    label: '5 myths about...',
    prompt: '5 common misconceptions about [TOPIC] debunked',
    placeholder: 'evolution, vaccines, the brain...',
  },
  {
    id: 'science',
    icon: FlaskConical,
    label: 'The science of...',
    prompt: 'The science behind [TOPIC] - what research really shows',
    placeholder: 'sleep, happiness, productivity...',
  },
];

// Quick topic suggestions (shown when no template selected)
const QUICK_SUGGESTIONS = [
  'The psychology of habit formation',
  'How the universe will end',
  'The history of coffee',
  'Why we dream',
];

// Learning Intent - what the user wants to achieve (from UX Research)
const LEARNING_INTENTS = [
  {
    id: 'understand',
    label: 'Understand quickly',
    emoji: '⚡',
    prompt: 'Prioritize clarity and quick comprehension. Get to the key insights fast.',
  },
  {
    id: 'story',
    label: 'Hear the story',
    emoji: '📖',
    prompt: 'Focus on narrative and storytelling. Make it engaging and memorable.',
  },
  {
    id: 'exam',
    label: 'Study & retain',
    emoji: '📝',
    prompt: 'Structure for retention and recall. Include key facts, definitions, and testable concepts.',
  },
  {
    id: 'debates',
    label: 'Explore debates',
    emoji: '⚖️',
    prompt: 'Present multiple perspectives and controversies. Show different viewpoints fairly.',
  },
  {
    id: 'apply',
    label: 'Apply to life',
    emoji: '🎯',
    prompt: 'Focus on practical applications and actionable takeaways I can use immediately.',
  },
];

// Knowledge Level - adjusts complexity (from UX Research)
const KNOWLEDGE_LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    prompt: 'Explain from first principles. Avoid jargon and assume no prior knowledge.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    prompt: 'Assume basic understanding. Build on fundamentals with deeper insights.',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    prompt: 'Skip basics. Focus on nuances, edge cases, and advanced concepts.',
  },
];

// Content Constraints - optional enhancements (from UX Research)
const CONTENT_CONSTRAINTS = [
  {
    id: 'timelines',
    label: 'Timelines',
    emoji: '📅',
    prompt: 'Include specific dates, chronological progression, and historical timeline where relevant.',
  },
  {
    id: 'numbers',
    label: 'Numbers & Stats',
    emoji: '📊',
    prompt: 'Emphasize data, statistics, and quantitative facts. Include specific numbers and percentages.',
  },
  {
    id: 'opposing',
    label: 'Opposing Views',
    emoji: '⚔️',
    prompt: 'Present counterarguments and different perspectives. Acknowledge opposing viewpoints fairly.',
  },
  {
    id: 'examples',
    label: 'Examples',
    emoji: '💡',
    prompt: 'Include concrete, real-world examples and case studies to illustrate key points.',
  },
  {
    id: 'quotes',
    label: 'Expert Quotes',
    emoji: '💬',
    prompt: 'Include quotes from experts, researchers, or notable figures in the field.',
  },
];

// Voice Options - OpenAI TTS voices for episode narration
const VOICE_OPTIONS = [
  { id: 'nova', label: 'Nova', emoji: '🎙️' },
  { id: 'alloy', label: 'Alloy', emoji: '🔊' },
  { id: 'echo', label: 'Echo', emoji: '📢' },
  { id: 'fable', label: 'Fable', emoji: '📖' },
  { id: 'onyx', label: 'Onyx', emoji: '🎭' },
  { id: 'shimmer', label: 'Shimmer', emoji: '✨' },
];

// Style Lenses - change the AI's perspective/tone (from UX Blueprint)
const STYLE_LENSES = [
  { id: 'balanced', label: 'Balanced', emoji: '⚖️', prompt: '' },
  { id: 'academic', label: 'Academic', emoji: '🎓', prompt: 'Take an academic, scholarly approach. Use precise language, cite specific research, and maintain intellectual rigor.' },
  { id: 'conversational', label: 'Casual', emoji: '💬', prompt: 'Use a warm, conversational tone like you\'re explaining to a friend. Include relatable analogies and avoid jargon.' },
  { id: 'skeptical', label: 'Skeptical', emoji: '🔍', prompt: 'Take a critical, skeptical approach. Question assumptions, examine the evidence, and present counterarguments.' },
  { id: 'enthusiastic', label: 'Enthusiastic', emoji: '✨', prompt: 'Bring infectious enthusiasm! Highlight what makes this topic fascinating and convey genuine excitement for the subject.' },
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
  const { type: deviceType } = useDevice();

  const [topic, setTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('balanced');
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('intermediate');
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [length, setLength] = useState('10 min');
  const [personalContext, setPersonalContext] = useState('');
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false); // Hide customization until user wants it
  const [generationMode, setGenerationMode] = useState<'quick' | 'deep'>('deep'); // Quick = faster but less polished
  const [pendingAutoGenerate, setPendingAutoGenerate] = useState(false); // Track if we should auto-start
  const [isGenerating, setIsGenerating] = useState(false);
  const [episodeReady, setEpisodeReady] = useState(false);
  const introTextPromiseRef = useRef<Promise<{ text: string; audioBlob: Blob | null } | null> | null>(null);
  const [autoPlayEpisode, setAutoPlayEpisode] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(PIPELINE_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [previewAudioReady, setPreviewAudioReady] = useState(false);
  const [quickHook, setQuickHook] = useState<{
    hook: string;
    preview: string;
    funFact: string;
  } | null>(null);
  const [result, setResult] = useState<{
    id: string;
    audioUrl: string;
    transcript: string;
  } | null>(null);
  const [takeaways, setTakeaways] = useState<string | null>(null);
  const [takeawaysLoading, setTakeawaysLoading] = useState(false);
  const [takeawaysError, setTakeawaysError] = useState<string | null>(null);

  const instantHostContext = {
    intent: LEARNING_INTENTS.find(i => i.id === selectedIntent)?.label,
    level: KNOWLEDGE_LEVELS.find(l => l.id === selectedLevel)?.label,
    personalContext: personalContext.trim() || undefined,
  };

  // Rotating tip index
  const [tipIndex, setTipIndex] = useState(0);

  // Footprints for AI transparency (Reasoning Traces from UX Blueprint)
  const [footprints, setFootprints] = useState<Footprint[]>([]);

  // Canon Protocol — cache hit and popular topic suggestions
  const [cacheHitNotice, setCacheHitNotice] = useState(false);
  const [showCanonSuggestions, setShowCanonSuggestions] = useState(false);
  const [canonTopics, setCanonTopics] = useState<{ id: string; title: string }[]>([]);

  // Mobile stability: refs for cleanup and connection status
  const abortControllerRef = useRef<AbortController | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const pollingRef = useRef<boolean>(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Actual job progress from API (0-100)
  const [jobProgress, setJobProgress] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);

  // Fetch popular canon topics when user hits free limit
  useEffect(() => {
    if (!showCanonSuggestions) return;
    fetch('/api/topics/popular')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.topics) setCanonTopics(data.topics);
      })
      .catch(() => {});
  }, [showCanonSuggestions]);

  // Restore topic from localStorage on mount (preserves across login redirect)
  useEffect(() => {
    const savedTopic = localStorage.getItem('mindcast_pending_topic');
    const shouldAutoGenerate = localStorage.getItem('mindcast_auto_generate');
    if (savedTopic) {
      setTopic(savedTopic);
      localStorage.removeItem('mindcast_pending_topic');
      // If user was redirected to login, auto-start generation
      if (shouldAutoGenerate === 'true') {
        localStorage.removeItem('mindcast_auto_generate');
        setPendingAutoGenerate(true);
      }
    }
  }, []);

  // Rotate tips every 4 seconds and facts every 6 seconds during generation
  useEffect(() => {
    if (!isGenerating) return;
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 4000);
    return () => {
      clearInterval(tipInterval);
    };
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

  // Auto-generate after returning from login (smooth flow)
  const handleGenerateRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    // Only auto-generate once when: topic restored, user logged in, pending flag set
    if (pendingAutoGenerate && session?.user && topic && !isGenerating) {
      setPendingAutoGenerate(false);
      // Small delay for smooth transition after login
      const timer = setTimeout(() => {
        handleGenerateRef.current?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingAutoGenerate, session?.user, topic, isGenerating]);

  const completedSteps = steps.filter((s) => s.status === 'done').length;
  const stepsProgress = (completedSteps / steps.length) * 100;
  // Use actual job progress from API, fallback to steps-based calculation
  const progress = jobProgress > 0 ? jobProgress : stepsProgress;
  const currentStep = steps.find((s) => s.status === 'running');

  // Calculate estimated time remaining
  const getTimeEstimate = (): string => {
    if (!generationStartTime || progress === 0 || progress >= 100) return '';

    const elapsedMs = Date.now() - generationStartTime;
    const elapsedSecs = elapsedMs / 1000;

    // Estimate total time based on current progress
    const estimatedTotalSecs = (elapsedSecs / progress) * 100;
    const remainingSecs = Math.max(0, estimatedTotalSecs - elapsedSecs);

    if (remainingSecs < 60) {
      return 'Less than a minute left';
    } else if (remainingSecs < 120) {
      return 'About 1 minute left';
    } else {
      const mins = Math.ceil(remainingSecs / 60);
      return `About ${mins} minutes left`;
    }
  };

  const timeEstimate = getTimeEstimate();

  // Poll job status and update UI
  const pollJobStatus = useCallback(async (jobId: string) => {
    if (!pollingRef.current) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}?wait=true&lastStatus=${steps.find((s: PipelineStep) => s.status === 'running')?.name || 'PENDING'}`, {
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get job status');
      }

      const data = await response.json();
      setConnectionLost(false);

      // Update quick hook if available
      if (data.quickHook && !quickHook) {
        setQuickHook(data.quickHook);
      }

      // Track when preview audio becomes available
      if (data.previewAudio && !previewAudioReady) {
        setPreviewAudioReady(true);
      }

      // Update footprints for AI transparency
      if (data.footprints && Array.isArray(data.footprints)) {
        setFootprints(data.footprints);
      }

      // Update actual job progress from API
      if (typeof data.progress === 'number') {
        setJobProgress(data.progress);
      }

      // Update progress based on job status
      updateStepsFromJobStatus(data.status, data.progress, data.currentStep);

      // Check if complete
      if (data.status === 'COMPLETE') {
        pollingRef.current = false;

        // Fetch episode details
        if (data.episodeId) {
          setResult({
            id: data.episodeId,
            audioUrl: data.audioUrl || `/api/episodes/${data.episodeId}/audio`,
            transcript: '', // Will be loaded on episode page
          });
        }
        setEpisodeReady(true);
        return;
      }

      // Check if failed
      if (data.status === 'FAILED') {
        pollingRef.current = false;
        setIsGenerating(false);
        setEpisodeReady(false);
        setError(data.error || 'Generation failed');
        return;
      }

      // Continue polling if still processing
      if (pollingRef.current) {
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      // On network error, show warning but keep polling
      setConnectionLost(true);
      if (pollingRef.current) {
        setTimeout(() => pollJobStatus(jobId), 5000); // Longer delay on error
      }
    }
  }, [quickHook, previewAudioReady, steps]);

  const fetchTakeaways = useCallback(async (episodeId: string) => {
    setTakeawaysLoading(true);
    setTakeawaysError(null);
    try {
      const response = await fetch('/api/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, addonType: 'takeaways' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to generate takeaways');
      }
      const data = await response.json();
      setTakeaways(typeof data?.content === 'string' ? data.content : null);
    } catch (err) {
      setTakeawaysError(err instanceof Error ? err.message : 'Failed to generate takeaways');
      setTakeaways(null);
    } finally {
      setTakeawaysLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!result?.id || isGenerating) return;
    fetchTakeaways(result.id);
  }, [result?.id, isGenerating, fetchTakeaways]);

  // Update steps based on job status
  const updateStepsFromJobStatus = (status: string, progress: number, _currentStep?: string) => {
    const statusToStepIndex: Record<string, number> = {
      PENDING: -1,
      RESEARCH: 0,
      DRAFTING: 1,
      JUDGING: 2,
      ENHANCING: 3, // Will mark 3-6 based on progress
      AUDIO: 7,
      COMPLETE: 8,
    };

    setSteps((prev) => {
      const newSteps = [...prev];
      const currentIndex = statusToStepIndex[status] ?? -1;

      // Mark completed steps
      for (let i = 0; i < newSteps.length; i++) {
        if (i < currentIndex) {
          newSteps[i] = { ...newSteps[i], status: 'done' };
        } else if (i === currentIndex) {
          newSteps[i] = { ...newSteps[i], status: 'running' };
        } else {
          newSteps[i] = { ...newSteps[i], status: 'pending' };
        }
      }

      // Handle enhancement sub-stages based on progress
      if (status === 'ENHANCING') {
        if (progress >= 50) newSteps[3] = { ...newSteps[3], status: 'done' };
        if (progress >= 60) newSteps[4] = { ...newSteps[4], status: 'done' };
        if (progress >= 70) newSteps[5] = { ...newSteps[5], status: 'done' };
        if (progress >= 80) newSteps[6] = { ...newSteps[6], status: 'done' };

        // Mark current enhancement step as running
        if (progress < 50) newSteps[3] = { ...newSteps[3], status: 'running' };
        else if (progress < 60) newSteps[4] = { ...newSteps[4], status: 'running' };
        else if (progress < 70) newSteps[5] = { ...newSteps[5], status: 'running' };
        else if (progress < 80) newSteps[6] = { ...newSteps[6], status: 'running' };
      }

      if (status === 'COMPLETE') {
        newSteps.forEach((_, i) => {
          newSteps[i] = { ...newSteps[i], status: 'done' };
        });
      }

      return newSteps;
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    // Unlock mobile audio playback — must happen synchronously within user gesture.
    // Mobile browsers block audio.play() unless triggered by a direct user interaction.
    // This silent play "warms" the page-level audio policy so InstantHost TTS works later.
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
      }
      const silence = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silence.volume = 0.01;
      silence.play().then(() => { try { silence.remove(); } catch {} }).catch(() => {});
    } catch {}

    if (!session?.user) {
      // Save topic to localStorage so it persists across login
      localStorage.setItem('mindcast_pending_topic', topic);
      localStorage.setItem('mindcast_auto_generate', 'true'); // Auto-start after login
      router.push('/login');
      return;
    }

    // Build the full topic - apply template if selected
    let fullTopic = topic;
    if (selectedTemplate) {
      const template = TOPIC_TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        fullTopic = template.prompt.replace('[TOPIC]', topic);
      }
    }

    // Build combined style prompt from style lens + intent + level + personal context
    const styleParts: string[] = [];

    const stylePromptBase = STYLE_LENSES.find(s => s.id === selectedStyle)?.prompt;
    if (stylePromptBase) styleParts.push(stylePromptBase);

    const intentPrompt = LEARNING_INTENTS.find(i => i.id === selectedIntent)?.prompt;
    if (intentPrompt) styleParts.push(intentPrompt);

    const levelPrompt = KNOWLEDGE_LEVELS.find(l => l.id === selectedLevel)?.prompt;
    if (levelPrompt) styleParts.push(levelPrompt);

    // Add content constraints
    if (selectedConstraints.length > 0) {
      const constraintPrompts = selectedConstraints
        .map(id => CONTENT_CONSTRAINTS.find(c => c.id === id)?.prompt)
        .filter(Boolean);
      if (constraintPrompts.length > 0) {
        styleParts.push(`CONTENT REQUIREMENTS: ${constraintPrompts.join(' ')}`);
      }
    }

    // Add personal context for tailored content
    if (personalContext.trim()) {
      styleParts.push(`PERSONAL CONTEXT: ${personalContext.trim()}. Tailor examples, analogies, and perspectives to be relevant to this person's background and interests.`);
    }

    const stylePrompt = styleParts.join(' ');

    // Cancel any existing polling
    pollingRef.current = false;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Pre-fetch intro text AND audio in parallel with job creation.
    // By the time InstantHost starts, the audio blob is already ready to play.
    introTextPromiseRef.current = fetch('/api/instant-host', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: fullTopic, phase: 'intro', context: instantHostContext }),
    }).then(async r => {
      if (!r.ok) return null;
      const d = await r.json();
      const text = d?.text;
      if (!text) return null;
      try {
        const ttsRes = await fetch('/api/instant-host/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!ttsRes.ok) return { text, audioBlob: null };
        const audioBlob = await ttsRes.blob();
        return { text, audioBlob };
      } catch {
        return { text, audioBlob: null };
      }
    }).catch(() => null);

    setIsGenerating(true);
    setEpisodeReady(false);
    setAutoPlayEpisode(false);
    setError(null);
    setResult(null);
    setTakeaways(null);
    setTakeawaysError(null);
    setTakeawaysLoading(false);
    setPreviewAudioReady(false);
    setQuickHook(null);
    setFootprints([]);
    setTipIndex(0);
    setConnectionLost(false);
    setCurrentJobId(null);
    setJobProgress(0);
    setGenerationStartTime(Date.now());
    setCacheHitNotice(false);
    setShowCanonSuggestions(false);
    setSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' })));

    try {
      // Create job via API - pass device type for TTS optimization
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: fullTopic, length, style: stylePrompt, mode: generationMode, voice: selectedVoice, deviceType }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.needsUpgrade) {
          // Show canon suggestions if available, otherwise go to pricing
          if (data.canonAvailable && data.canonAvailable > 0) {
            setError(data.hint || 'Free episode limit reached. Try a popular topic for instant access!');
            setIsGenerating(false);
            setShowCanonSuggestions(true);
            return;
          }
          router.push('/pricing');
          return;
        }
        throw new Error(data.error || 'Failed to create job');
      }

      const data = await response.json();
      const { jobId } = data;
      setCurrentJobId(jobId);

      // Canon cache hit — episode is already complete, skip generation UI
      if (data.status === 'COMPLETE' && data.cacheHit) {
        setResult({
          id: data.jobId, // Will resolve via polling
          audioUrl: '',
          transcript: '',
        });
        // Fetch the actual episode via the job
        const jobRes = await fetch(`/api/jobs/${jobId}`);
        if (jobRes.ok) {
          const jobData = await jobRes.json();
          if (jobData.episodeId) {
            setResult({
              id: jobData.episodeId,
              audioUrl: `/api/episodes/${jobData.episodeId}/audio`,
              transcript: '',
            });
          }
        }
        setEpisodeReady(true);
        setIsGenerating(false);
        setCacheHitNotice(true);
        return;
      }

      // Start polling for status updates
      pollingRef.current = true;
      pollJobStatus(jobId);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setIsGenerating(false);
    }
  }, [topic, length, session, router, selectedTemplate, selectedStyle, selectedIntent, selectedLevel, selectedConstraints, personalContext, generationMode, selectedVoice, deviceType, pollJobStatus]);

  // Keep ref updated for auto-generate after login
  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
  }, [handleGenerate]);

  // Cancel job handler
  const handleCancel = useCallback(async () => {
    pollingRef.current = false;
    abortControllerRef.current?.abort();

    if (currentJobId) {
      try {
        await fetch(`/api/jobs/${currentJobId}`, { method: 'DELETE' });
      } catch {
        // Ignore errors on cancel
      }
    }

    setIsGenerating(false);
    setEpisodeReady(false);
    setAutoPlayEpisode(false);
    setCurrentJobId(null);
    setError('Generation cancelled');
  }, [currentJobId]);

  // Voice preview handler
  const playVoicePreview = useCallback((voiceId: string) => {
    // Stop any currently playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    // If clicking the same voice that's playing, just stop
    if (playingPreview === voiceId) {
      setPlayingPreview(null);
      return;
    }

    // Play the new preview
    const audio = new Audio(`/api/voice-preview?voice=${voiceId}`);
    previewAudioRef.current = audio;
    setPlayingPreview(voiceId);

    audio.onended = () => {
      setPlayingPreview(null);
      previewAudioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingPreview(null);
      previewAudioRef.current = null;
    };

    audio.play().catch(() => {
      setPlayingPreview(null);
      previewAudioRef.current = null;
    });
  }, [playingPreview]);

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const CurrentTip = LOADING_TIPS[tipIndex];

  const episodeResult = !isGenerating ? result : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-1 sm:px-0">
      {/* Header - more compact on mobile */}
      <div className="text-center">
        <h1 className="mb-1 text-2xl font-bold text-text-primary sm:text-display-sm">
          Train Your Mind
        </h1>
        <p className="text-sm text-text-secondary sm:text-body-md">
          Enter any topic and create an audio lesson that sticks
        </p>
      </div>

      {!episodeResult ? (
        <Card className="overflow-hidden">
          <CardContent className="space-y-5 p-4 sm:p-6">
            {/* Template Selection */}
            {!isGenerating && !topic && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">
                  Choose a format
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TOPIC_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setTopic('');
                        }}
                        className={cn(
                          'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all active:scale-[0.98]',
                          'min-h-[80px] touch-manipulation',
                          selectedTemplate === template.id
                            ? 'border-brand bg-brand/10'
                            : 'border-border hover:border-brand/50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={cn(
                            'h-4 w-4',
                            selectedTemplate === template.id ? 'text-brand' : 'text-text-muted'
                          )} />
                          <span className={cn(
                            'text-sm font-medium',
                            selectedTemplate === template.id ? 'text-brand' : 'text-text-primary'
                          )}>
                            {template.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                {selectedTemplate
                  ? TOPIC_TEMPLATES.find(t => t.id === selectedTemplate)?.label || 'Your topic'
                  : 'What do you want to learn about?'}
              </label>
              <Textarea
                placeholder={
                  selectedTemplate
                    ? `e.g., ${TOPIC_TEMPLATES.find(t => t.id === selectedTemplate)?.placeholder || 'Enter your topic...'}`
                    : 'e.g., The history of jazz, How CRISPR works...'
                }
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
                className="min-h-[80px] resize-none text-base sm:min-h-[100px]"
              />

              {/* Quick suggestions - shown when no template selected */}
              {!topic && !isGenerating && !selectedTemplate && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
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

              {/* Clear template button */}
              {selectedTemplate && !isGenerating && (
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTopic('');
                  }}
                  className="text-xs text-text-muted hover:text-text-secondary"
                >
                  ← Choose different format
                </button>
              )}
            </div>

            {/* Customization Toggle - show only after topic entered */}
            {!isGenerating && topic && !showCustomization && (
              <button
                onClick={() => setShowCustomization(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-text-muted transition-colors hover:border-brand/50 hover:text-text-secondary"
              >
                <ChevronDown className="h-4 w-4" />
                Customize style, level & more (optional)
              </button>
            )}

            {/* Customization Options - Hidden by default */}
            {!isGenerating && topic && showCustomization && (
              <div className="space-y-4 animate-fade-in rounded-xl border border-border bg-surface-secondary p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">Customization</span>
                  <button
                    onClick={() => setShowCustomization(false)}
                    className="text-xs text-text-muted hover:text-text-secondary"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>

                {/* Learning Intent Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">
                    What's your goal?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LEARNING_INTENTS.map((intent) => (
                      <button
                        key={intent.id}
                        onClick={() => setSelectedIntent(
                          selectedIntent === intent.id ? null : intent.id
                        )}
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all active:scale-95',
                          'touch-manipulation',
                          selectedIntent === intent.id
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-border hover:border-brand/50 text-text-secondary'
                        )}
                      >
                        <span>{intent.emoji}</span>
                        <span className="font-medium">{intent.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Knowledge Level Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">
                    Your level
                  </label>
                  <div className="flex gap-2">
                    {KNOWLEDGE_LEVELS.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setSelectedLevel(level.id)}
                        className={cn(
                          'flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all active:scale-95',
                          'touch-manipulation',
                          selectedLevel === level.id
                            ? 'border-brand bg-brand/10'
                            : 'border-border hover:border-brand/50'
                        )}
                      >
                        <span className={cn(
                          'text-sm font-medium',
                          selectedLevel === level.id ? 'text-brand' : 'text-text-primary'
                        )}>
                          {level.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Lens Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">
                    Perspective & Tone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_LENSES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all active:scale-95',
                          'touch-manipulation',
                          selectedStyle === style.id
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-border hover:border-brand/50 text-text-secondary'
                        )}
                      >
                        <span>{style.emoji}</span>
                        <span className="font-medium">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Constraints */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">
                    Include (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_CONSTRAINTS.map((constraint) => {
                      const isSelected = selectedConstraints.includes(constraint.id);
                      return (
                        <button
                          key={constraint.id}
                          onClick={() => {
                            setSelectedConstraints(prev =>
                              isSelected
                                ? prev.filter(c => c !== constraint.id)
                                : [...prev, constraint.id]
                            );
                          }}
                          className={cn(
                            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all active:scale-95',
                            'touch-manipulation',
                            isSelected
                              ? 'border-brand bg-brand/10 text-brand'
                              : 'border-border hover:border-brand/30 text-text-muted hover:text-text-secondary'
                          )}
                        >
                          <span>{constraint.emoji}</span>
                          <span>{constraint.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">
                    Narrator Voice
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {VOICE_OPTIONS.map((voice) => (
                      <div key={voice.id} className="relative">
                        <button
                          onClick={() => setSelectedVoice(voice.id)}
                          className={cn(
                            'flex w-full flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all active:scale-95',
                            'touch-manipulation',
                            selectedVoice === voice.id
                              ? 'border-brand bg-brand/10'
                              : 'border-border hover:border-brand/50'
                          )}
                        >
                          <span className="text-lg">{voice.emoji}</span>
                          <span className={cn(
                            'text-sm font-medium',
                            selectedVoice === voice.id ? 'text-brand' : 'text-text-primary'
                          )}>
                            {voice.label}
                          </span>
                        </button>
                        {/* Preview button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playVoicePreview(voice.id);
                          }}
                          className={cn(
                            'absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-all',
                            'bg-surface hover:bg-surface-secondary active:scale-90',
                            playingPreview === voice.id
                              ? 'border-brand text-brand'
                              : 'border-border text-text-muted hover:text-text-primary'
                          )}
                          title={playingPreview === voice.id ? 'Stop preview' : 'Preview voice'}
                        >
                          {playingPreview === voice.id ? (
                            <Square className="h-3 w-3 fill-current" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Make It About Me - Personalization */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowPersonalization(!showPersonalization)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-tertiary"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-brand" />
                      <span className="text-sm font-medium text-text-primary">
                        Make it about me
                      </span>
                      {personalContext && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                          Active
                        </span>
                      )}
                    </div>
                    {showPersonalization ? (
                      <ChevronUp className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    )}
                  </button>

                  {showPersonalization && (
                    <div className="animate-fade-in space-y-2 rounded-xl border border-border bg-surface p-4">
                      <Textarea
                        placeholder="e.g., I'm a high school teacher, I'm learning to invest, I work in healthcare..."
                        value={personalContext}
                        onChange={(e) => setPersonalContext(e.target.value)}
                        className="min-h-[80px] resize-none text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        {[
                          'I\'m a student',
                          'I\'m a teacher',
                          'I\'m an investor',
                          'I\'m a parent',
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setPersonalContext(
                              personalContext
                                ? `${personalContext}, ${suggestion.toLowerCase()}`
                                : suggestion
                            )}
                            className="rounded-full bg-surface-tertiary px-2 py-1 text-xs text-text-muted transition-colors hover:bg-border hover:text-text-primary"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  </button>
                ))}
              </div>
            </div>

            {/* Generation Mode - Quick vs Deep */}
            {!isGenerating && topic && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Generation Speed
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGenerationMode('quick')}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all active:scale-[0.98]',
                      'touch-manipulation',
                      generationMode === 'quick'
                        ? 'border-brand bg-brand/10'
                        : 'border-border hover:border-brand/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className={cn('h-5 w-5', generationMode === 'quick' ? 'text-brand' : 'text-text-muted')} />
                      <span className={cn('font-semibold', generationMode === 'quick' ? 'text-brand' : 'text-text-primary')}>
                        Quick
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">Faster</span>
                  </button>
                  <button
                    onClick={() => setGenerationMode('deep')}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all active:scale-[0.98]',
                      'touch-manipulation',
                      generationMode === 'deep'
                        ? 'border-brand bg-brand/10'
                        : 'border-border hover:border-brand/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Brain className={cn('h-5 w-5', generationMode === 'deep' ? 'text-brand' : 'text-text-muted')} />
                      <span className={cn('font-semibold', generationMode === 'deep' ? 'text-brand' : 'text-text-primary')}>
                        Deep
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">Best quality</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <ErrorAlert
                message={error}
                onDismiss={() => {
                  setError(null);
                  setShowCanonSuggestions(false);
                }}
              />
            )}

            {/* Canon suggestions — shown when free user hits limit */}
            {showCanonSuggestions && canonTopics.length > 0 && (
              <div className="space-y-3 rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 to-brand/10 p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand" />
                  <span className="text-sm font-semibold text-text-primary">
                    Popular topics — instant &amp; free
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canonTopics.map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => {
                        setTopic(ct.title);
                        setError(null);
                        setShowCanonSuggestions(false);
                      }}
                      className="rounded-full bg-white/80 dark:bg-surface border border-brand/20 px-3 py-1.5 text-sm text-text-primary transition-all hover:border-brand hover:bg-brand/10 active:scale-95"
                    >
                      {ct.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State - Enhanced */}
            {isGenerating && (
              <div className="space-y-4">
                <InstantHost
                  topic={topic}
                  isGenerating={isGenerating}
                  episodeReady={episodeReady}
                  introTextPromise={introTextPromiseRef.current}
                  context={instantHostContext}
                  onReadyToPlay={() => {
                    setEpisodeReady(false);
                    setIsGenerating(false);
                    setAutoPlayEpisode(true);
                  }}
                />
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
                  </div>
                ) : (
                  /* Simple loading state before hook arrives */
                  <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 to-brand/10 p-4">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-brand/20" />
                      <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-brand" />
                    </div>
                    <p className="font-medium text-text-primary">Creating your episode...</p>
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

                  {/* Progress bar with percentage and time estimate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>{currentStep?.name || 'Starting'}...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    {timeEstimate && (
                      <div className="flex items-center justify-center gap-1 text-xs text-text-muted pt-1">
                        <Clock className="h-3 w-3" />
                        <span>{timeEstimate}</span>
                      </div>
                    )}
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

                  {/* AI Footprints - Reasoning Traces for transparency */}
                  {footprints.length > 0 && (
                    <FootprintsDisplay footprints={footprints} />
                  )}
                </div>

              </div>
            )}

            {/* Generate Button - larger touch target */}
            {isGenerating ? (
              <div className="flex gap-2">
                {episodeReady ? (
                  <div className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-success/10 text-success">
                    <Check className="h-5 w-5" />
                    <span className="text-base font-medium">Episode ready</span>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="h-14 flex-1"
                      size="lg"
                    >
                      Cancel
                    </Button>
                    <div className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-xl bg-brand/10 text-brand">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-base font-medium">Creating...</span>
                    </div>
                  </>
                )}
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
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="success">
                  Episode Ready
                </Badge>
                {cacheHitNotice && (
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="h-3 w-3" />
                    Instant
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioPlayer src={episodeResult.audioUrl} title={topic} autoPlay={autoPlayEpisode} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Key Takeaways</CardTitle>
            </CardHeader>
            <CardContent>
              {takeawaysLoading && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating takeaways…
                </div>
              )}
              {!takeawaysLoading && takeawaysError && (
                <div className="space-y-2 text-sm text-text-muted">
                  <p>{takeawaysError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTakeaways(episodeResult.id)}
                  >
                    Retry takeaways
                  </Button>
                </div>
              )}
              {!takeawaysLoading && !takeawaysError && takeaways && (
                <div className="whitespace-pre-wrap text-sm text-text-secondary">
                  {takeaways}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm text-text-secondary sm:max-h-[400px]">
                {episodeResult.transcript}
              </div>
            </CardContent>
          </Card>

          {/* Action buttons - stacked on mobile */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setAutoPlayEpisode(false);
                setTopic('');
                setTakeaways(null);
                setTakeawaysError(null);
                setTakeawaysLoading(false);
              }}
              className="h-12 flex-1"
            >
              Create Another
            </Button>
            <Button
              onClick={() => router.push(`/episode/${episodeResult.id}`)}
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
