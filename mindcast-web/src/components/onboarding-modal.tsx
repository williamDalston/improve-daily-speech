'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Atom,
  Landmark,
  Briefcase,
  Heart,
  Palette,
  Globe,
  Cpu,
  BookOpen,
  Car,
  Brain,
  Mic,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  userName?: string | null;
  onComplete: () => void;
}

// Interest categories with icons
const INTERESTS = [
  { id: 'science', label: 'Science', icon: Atom },
  { id: 'history', label: 'History', icon: Landmark },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'arts', label: 'Arts & Culture', icon: Palette },
  { id: 'world', label: 'World Affairs', icon: Globe },
  { id: 'tech', label: 'Technology', icon: Cpu },
  { id: 'philosophy', label: 'Philosophy', icon: BookOpen },
];

// Listening modes
const LISTENING_MODES = [
  {
    id: 'commute',
    label: 'Commute',
    description: 'Shorter episodes (5-10 min), punchy insights',
    icon: Car,
    defaultLength: '10 min',
  },
  {
    id: 'deep-dive',
    label: 'Deep Dive',
    description: 'Longer episodes (15-20 min), comprehensive coverage',
    icon: Brain,
    defaultLength: '15 min',
  },
];

// Narrator tones/vibes
const NARRATOR_TONES = [
  {
    id: 'bbc-calm',
    label: 'BBC Calm',
    description: 'Measured, authoritative, trustworthy',
    emoji: '🎙️',
    stylePrompt: 'Use a calm, measured BBC documentary tone. Be authoritative but approachable.',
  },
  {
    id: 'playful-professor',
    label: 'Playful Professor',
    description: 'Enthusiastic, uses analogies, conversational',
    emoji: '🧑‍🏫',
    stylePrompt: 'Use a warm, enthusiastic tone like a favorite professor. Include relatable analogies and occasional humor.',
  },
  {
    id: 'no-fluff',
    label: 'No Fluff',
    description: 'Direct, fact-dense, efficient',
    emoji: '⚡',
    stylePrompt: 'Be direct and efficient. Focus on facts and key insights without filler. Every sentence should add value.',
  },
];

// Sample topics based on interests
const SAMPLE_TOPICS: Record<string, string[]> = {
  science: ['Why does time slow down at high speeds?', 'How do black holes form?', 'The science of sleep'],
  history: ['How Rome really fell', 'The untold story of the printing press', 'Why the Bronze Age collapsed'],
  business: ['How Netflix killed Blockbuster', 'The psychology of pricing', 'Why most startups fail'],
  health: ['How your gut affects your brain', 'The science of longevity', 'Why we need sleep'],
  arts: ['Why the Mona Lisa is famous', 'How hip-hop changed music', 'The psychology of color'],
  world: ['Why some countries are rich', 'How borders are drawn', 'The future of democracy'],
  tech: ['How AI actually works', 'Why quantum computing matters', 'The history of the internet'],
  philosophy: ['What is consciousness?', 'The trolley problem explained', 'Why do we exist?'],
};

export function OnboardingModal({ userName, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [listeningMode, setListeningMode] = useState<string | null>(null);
  const [narratorTone, setNarratorTone] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();

  const canProceed = () => {
    switch (step) {
      case 0: return selectedInterests.length >= 1;
      case 1: return listeningMode !== null;
      case 2: return narratorTone !== null;
      default: return true;
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 5
        ? [...prev, id]
        : prev
    );
  };

  const handleComplete = async () => {
    setIsCompleting(true);

    // Get a sample topic based on first selected interest
    const primaryInterest = selectedInterests[0] || 'science';
    const topics = SAMPLE_TOPICS[primaryInterest] || SAMPLE_TOPICS.science;
    const sampleTopic = topics[Math.floor(Math.random() * topics.length)];

    // Get style prompt from selected tone
    const tone = NARRATOR_TONES.find((t) => t.id === narratorTone);
    const mode = LISTENING_MODES.find((m) => m.id === listeningMode);

    try {
      // Save preferences
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: selectedInterests,
          listeningMode,
          narratorTone,
          defaultLength: mode?.defaultLength || '10 min',
        }),
      });

      onComplete();

      // Navigate to create page with pre-filled sample topic
      const params = new URLSearchParams({
        topic: sampleTopic,
        length: mode?.defaultLength || '10 min',
        style: tone?.stylePrompt || '',
      });
      router.push(`/create?${params.toString()}`);
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      onComplete();
      router.push('/create');
    }
  };

  const handleSkip = async () => {
    try {
      await fetch('/api/user/onboarding', { method: 'POST' });
    } catch {
      // Ignore
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-tertiary">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-6 pt-8 pb-6 sm:px-8">
          {/* Step 1: Interests */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 mb-4">
                  <Sparkles className="h-6 w-6 text-brand" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">
                  {userName ? `Hey ${userName.split(' ')[0]}!` : 'Welcome!'} What interests you?
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Pick 1-5 topics you'd like to explore
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 transition-all active:scale-[0.98]',
                        'touch-manipulation text-left',
                        isSelected
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-border hover:border-brand/50 text-text-primary'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', isSelected ? 'text-brand' : 'text-text-muted')} />
                      <span className="text-sm font-medium">{interest.label}</span>
                      {isSelected && <Check className="h-4 w-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-text-muted text-center">
                {selectedInterests.length}/5 selected
              </p>
            </div>
          )}

          {/* Step 2: Listening Mode */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 mb-4">
                  <Volume2 className="h-6 w-6 text-brand" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">
                  How do you like to listen?
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  This sets your default episode length
                </p>
              </div>

              <div className="space-y-3">
                {LISTENING_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = listeningMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setListeningMode(mode.id)}
                      className={cn(
                        'w-full flex items-center gap-4 rounded-xl border p-4 transition-all active:scale-[0.99]',
                        'touch-manipulation text-left',
                        isSelected
                          ? 'border-brand bg-brand/10'
                          : 'border-border hover:border-brand/50'
                      )}
                    >
                      <div className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                        isSelected ? 'bg-brand text-white' : 'bg-surface-tertiary text-text-muted'
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'font-semibold',
                            isSelected ? 'text-brand' : 'text-text-primary'
                          )}>
                            {mode.label}
                          </span>
                          <span className="text-xs text-text-muted">
                            {mode.defaultLength}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {mode.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-brand flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Narrator Tone */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 mb-4">
                  <Mic className="h-6 w-6 text-brand" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">
                  Pick your narrator vibe
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Sets the tone for your episodes
                </p>
              </div>

              <div className="space-y-3">
                {NARRATOR_TONES.map((tone) => {
                  const isSelected = narratorTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      onClick={() => setNarratorTone(tone.id)}
                      className={cn(
                        'w-full flex items-center gap-4 rounded-xl border p-4 transition-all active:scale-[0.99]',
                        'touch-manipulation text-left',
                        isSelected
                          ? 'border-brand bg-brand/10'
                          : 'border-border hover:border-brand/50'
                      )}
                    >
                      <div className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                        isSelected ? 'bg-brand/20' : 'bg-surface-tertiary'
                      )}>
                        {tone.emoji}
                      </div>
                      <div className="flex-1">
                        <span className={cn(
                          'font-semibold',
                          isSelected ? 'text-brand' : 'text-text-primary'
                        )}>
                          {tone.label}
                        </span>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {tone.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-brand flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            <Button
              onClick={step === 2 ? handleComplete : () => setStep((s) => s + 1)}
              disabled={!canProceed() || isCompleting}
              className={cn('flex-1', step === 0 && 'w-full')}
            >
              {isCompleting ? (
                'Creating your first episode...'
              ) : step === 2 ? (
                <>
                  Create Sample Episode
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {step === 0 && (
            <button
              onClick={handleSkip}
              className="w-full mt-3 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
