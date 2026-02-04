'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ChevronRight,
  Check,
  Loader2,
  Sparkles,
  BookOpen,
  History,
  Scale,
  Lightbulb,
  Compass,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SeriesCreatorProps {
  className?: string;
  onClose?: () => void;
}

// Pre-defined series templates (5-part structure)
const SERIES_TEMPLATES = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Deep Dive',
    icon: BookOpen,
    description: 'Master a topic from foundations to advanced concepts',
    parts: [
      { title: 'Foundations', prompt: 'Explain the fundamental concepts and definitions of [TOPIC]. What do beginners need to understand first?' },
      { title: 'Key Mechanisms', prompt: 'How does [TOPIC] actually work? Explain the core mechanisms, processes, and principles.' },
      { title: 'History & Evolution', prompt: 'Trace the history and evolution of [TOPIC]. How did we get here?' },
      { title: 'Current State', prompt: 'What is the current state of [TOPIC]? Recent developments, key players, and latest research.' },
      { title: 'Future & Implications', prompt: 'Where is [TOPIC] heading? Future trends, predictions, and implications for society.' },
    ],
  },
  {
    id: 'debate',
    name: 'Debate & Perspectives',
    icon: Scale,
    description: 'Explore multiple viewpoints on a controversial topic',
    parts: [
      { title: 'The Landscape', prompt: 'What is [TOPIC] and why is it controversial? Set the stage for the debate.' },
      { title: 'Arguments For', prompt: 'Make the strongest case FOR [TOPIC]. What are the best arguments from proponents?' },
      { title: 'Arguments Against', prompt: 'Make the strongest case AGAINST [TOPIC]. What are the best counterarguments?' },
      { title: 'The Nuance', prompt: 'What nuances are often missed in the [TOPIC] debate? Explore the middle ground and edge cases.' },
      { title: 'Synthesis', prompt: 'How should we think about [TOPIC]? Synthesize the debate into actionable wisdom.' },
    ],
  },
  {
    id: 'historical',
    name: 'Historical Journey',
    icon: History,
    description: 'Travel through time to understand a topic\'s evolution',
    parts: [
      { title: 'Origins', prompt: 'Where did [TOPIC] begin? Explore the earliest origins and initial developments.' },
      { title: 'Key Turning Points', prompt: 'What were the major turning points in the history of [TOPIC]? Pivotal moments and breakthroughs.' },
      { title: 'Key Figures', prompt: 'Who were the most influential people in the history of [TOPIC]? Their stories and contributions.' },
      { title: 'Modern Era', prompt: 'How has [TOPIC] evolved in modern times? Recent history and current state.' },
      { title: 'Lessons & Legacy', prompt: 'What lessons can we learn from the history of [TOPIC]? How does history inform the future?' },
    ],
  },
  {
    id: 'practical',
    name: 'Practical Mastery',
    icon: Lightbulb,
    description: 'Learn how to actually apply knowledge in real life',
    parts: [
      { title: 'What & Why', prompt: 'What is [TOPIC] and why does it matter for your life? Practical importance and benefits.' },
      { title: 'Getting Started', prompt: 'How do you get started with [TOPIC]? First steps, resources, and common mistakes to avoid.' },
      { title: 'Core Skills', prompt: 'What are the core skills and techniques for [TOPIC]? Detailed how-to guidance.' },
      { title: 'Advanced Strategies', prompt: 'What advanced strategies separate experts from beginners in [TOPIC]? Pro tips and techniques.' },
      { title: 'Making It Stick', prompt: 'How do you build lasting habits around [TOPIC]? Integration into daily life.' },
    ],
  },
];

export function SeriesCreator({ className, onClose }: SeriesCreatorProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<'template' | 'topic' | 'customize' | 'create'>('template');
  const [selectedTemplate, setSelectedTemplate] = React.useState<typeof SERIES_TEMPLATES[0] | null>(null);
  const [topic, setTopic] = React.useState('');
  const [customParts, setCustomParts] = React.useState<{ title: string; prompt: string }[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdCount, setCreatedCount] = React.useState(0);

  // Initialize custom parts when template is selected
  React.useEffect(() => {
    if (selectedTemplate) {
      setCustomParts(selectedTemplate.parts.map((p) => ({ ...p })));
    }
  }, [selectedTemplate]);

  const handleCreateSeries = async () => {
    if (!selectedTemplate || !topic.trim()) return;

    setIsCreating(true);
    setStep('create');

    // Create each episode in sequence
    for (let i = 0; i < customParts.length; i++) {
      const part = customParts[i];
      const fullTopic = `${topic}: Part ${i + 1} - ${part.title}`;
      const fullPrompt = part.prompt.replace(/\[TOPIC\]/g, topic);

      try {
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: fullTopic,
            length: '10 min',
            style: `This is Part ${i + 1} of a 5-part series on ${topic}. ${fullPrompt}`,
            seriesId: `series-${topic}-${Date.now()}`,
            seriesPart: i + 1,
            seriesTotal: customParts.length,
          }),
        });

        if (response.ok) {
          setCreatedCount(i + 1);
        }
      } catch (err) {
        console.error(`Failed to create part ${i + 1}:`, err);
      }
    }

    // Navigate to library after all created
    setTimeout(() => {
      router.push('/library');
    }, 1500);
  };

  return (
    <div className={cn('rounded-2xl border border-border bg-surface overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-surface-secondary">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand/10">
            <Layers className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Create Series</h2>
            <p className="text-sm text-text-muted">5-part structured learning journey</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Choose Template */}
        {step === 'template' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Choose a series structure:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SERIES_TEMPLATES.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-brand bg-brand/5'
                        : 'border-border hover:border-brand/50'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={cn('h-5 w-5', isSelected ? 'text-brand' : 'text-text-muted')} />
                      <span className={cn('font-semibold', isSelected ? 'text-brand' : 'text-text-primary')}>
                        {template.name}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">
                      {template.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => setStep('topic')}
              disabled={!selectedTemplate}
              className="w-full"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Enter Topic */}
        {step === 'topic' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              What topic do you want to explore in this series?
            </p>
            <Input
              placeholder="e.g., Artificial Intelligence, Stoicism, Climate Change..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-lg"
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('template')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('customize')}
                disabled={!topic.trim()}
                className="flex-1"
              >
                Customize Episodes
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Customize Parts */}
        {step === 'customize' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Customize each episode in your series:
            </p>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {customParts.map((part, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-surface-secondary">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <Input
                      value={part.title}
                      onChange={(e) => {
                        const updated = [...customParts];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setCustomParts(updated);
                      }}
                      className="font-semibold"
                    />
                  </div>
                  <textarea
                    value={part.prompt.replace(/\[TOPIC\]/g, topic)}
                    onChange={(e) => {
                      const updated = [...customParts];
                      updated[idx] = { ...updated[idx], prompt: e.target.value };
                      setCustomParts(updated);
                    }}
                    rows={2}
                    className="w-full p-2 text-sm rounded-lg border border-border bg-surface resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('topic')}>
                Back
              </Button>
              <Button onClick={handleCreateSeries} className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" />
                Create 5-Part Series
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Creating */}
        {step === 'create' && (
          <div className="text-center py-8 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10">
              <Loader2 className="h-8 w-8 text-brand animate-spin" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Creating Your Series
              </h3>
              <p className="text-text-muted mt-1">
                {createdCount}/{customParts.length} episodes queued
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {customParts.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    idx < createdCount
                      ? 'bg-success text-white'
                      : idx === createdCount
                      ? 'bg-brand text-white animate-pulse'
                      : 'bg-surface-tertiary text-text-muted'
                  )}
                >
                  {idx < createdCount ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
              ))}
            </div>

            <p className="text-sm text-text-muted">
              Episodes will appear in your library as they complete.
            </p>
          </div>
        )}
      </div>

      {/* Close button */}
      {onClose && step !== 'create' && (
        <div className="px-6 py-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
