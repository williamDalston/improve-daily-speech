'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Sparkles,
  Loader2,
  ChevronRight,
  Mic,
  User,
  Shuffle,
  Check,
  MessageSquare,
  Scale,
  Zap,
  Brain,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface DebateModeProps {
  className?: string;
}

// Host personality presets
const HOST_PRESETS = [
  {
    id: 'analyst-optimist',
    name: 'Analyst vs Optimist',
    description: 'Data-driven skeptic meets hopeful visionary',
    host1: {
      name: 'Alex',
      personality: 'analytical',
      style: 'Data-driven and skeptical. Cites research, questions assumptions, and focuses on evidence.',
      emoji: '🔬',
    },
    host2: {
      name: 'Jordan',
      personality: 'optimistic',
      style: 'Hopeful and forward-thinking. Sees possibilities, highlights potential benefits, and considers human factors.',
      emoji: '✨',
    },
  },
  {
    id: 'academic-practical',
    name: 'Theory vs Practice',
    description: 'Academic expert meets real-world practitioner',
    host1: {
      name: 'Dr. Morgan',
      personality: 'academic',
      style: 'Academic and thorough. Explains theory, historical context, and underlying principles.',
      emoji: '🎓',
    },
    host2: {
      name: 'Sam',
      personality: 'practical',
      style: 'Practical and action-oriented. Focuses on real-world application, simplicity, and what actually works.',
      emoji: '🛠️',
    },
  },
  {
    id: 'devil-advocate',
    name: 'Advocate vs Critic',
    description: 'Enthusiastic supporter meets devil\'s advocate',
    host1: {
      name: 'Casey',
      personality: 'advocate',
      style: 'Enthusiastic supporter. Argues the strongest case for the topic, highlights benefits and success stories.',
      emoji: '💪',
    },
    host2: {
      name: 'Riley',
      personality: 'critic',
      style: 'Thoughtful skeptic. Raises counterarguments, identifies risks, and ensures balanced consideration.',
      emoji: '🤔',
    },
  },
  {
    id: 'old-new',
    name: 'Traditionalist vs Innovator',
    description: 'Respects the old ways vs embraces the new',
    host1: {
      name: 'Pat',
      personality: 'traditionalist',
      style: 'Values tradition and proven methods. Emphasizes what has worked, risks of change, and wisdom of experience.',
      emoji: '📚',
    },
    host2: {
      name: 'Quinn',
      personality: 'innovator',
      style: 'Champions innovation and change. Excited about new approaches, technology, and disruption.',
      emoji: '🚀',
    },
  },
];

// Episode format options
const FORMAT_OPTIONS = [
  {
    id: 'balanced',
    label: 'Balanced Discussion',
    description: 'Both perspectives explored equally',
    icon: Scale,
    prompt: 'Have a balanced, respectful discussion where both hosts make strong points. End with synthesis of both viewpoints.',
  },
  {
    id: 'debate',
    label: 'Friendly Debate',
    description: 'More back-and-forth, but still cordial',
    icon: MessageSquare,
    prompt: 'Make this a lively debate with more pushback and challenges between hosts, but keep it friendly and productive.',
  },
  {
    id: 'rapid',
    label: 'Rapid Fire',
    description: 'Quick exchanges, punchy insights',
    icon: Zap,
    prompt: 'Fast-paced exchanges with quick, punchy points. High energy, shorter turns, more dynamic.',
  },
  {
    id: 'deep',
    label: 'Deep Dive',
    description: 'Longer, more thoughtful exchanges',
    icon: Brain,
    prompt: 'Longer, more thoughtful exchanges. Each host gets time to fully develop their arguments with depth.',
  },
];

// Topic suggestions for debate mode
const DEBATE_TOPICS = [
  'Is social media good or bad for society?',
  'Should AI be regulated more strictly?',
  'Is remote work better than office work?',
  'Is college education still worth it?',
  'Are electric vehicles truly better for the environment?',
  'Should we pursue immortality through technology?',
];

export function DebateMode({ className }: DebateModeProps) {
  const router = useRouter();
  const [topic, setTopic] = React.useState('');
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = React.useState('balanced');
  const [length, setLength] = React.useState('10 min');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [customHost1Name, setCustomHost1Name] = React.useState('');
  const [customHost2Name, setCustomHost2Name] = React.useState('');
  const [customHost1Style, setCustomHost1Style] = React.useState('');
  const [customHost2Style, setCustomHost2Style] = React.useState('');
  const [showCustom, setShowCustom] = React.useState(false);

  const selectedPresetData = HOST_PRESETS.find(p => p.id === selectedPreset);
  const selectedFormatData = FORMAT_OPTIONS.find(f => f.id === selectedFormat);

  const shuffleTopic = () => {
    const randomTopic = DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)];
    setTopic(randomTopic);
  };

  const generateDebate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);

    // Build the hosts configuration
    let host1, host2;

    if (showCustom && customHost1Name && customHost2Name) {
      host1 = { name: customHost1Name, style: customHost1Style || 'Thoughtful and engaging.' };
      host2 = { name: customHost2Name, style: customHost2Style || 'Thoughtful and engaging.' };
    } else if (selectedPresetData) {
      host1 = { name: selectedPresetData.host1.name, style: selectedPresetData.host1.style };
      host2 = { name: selectedPresetData.host2.name, style: selectedPresetData.host2.style };
    } else {
      // Default hosts
      host1 = { name: 'Alex', style: 'Analytical and thorough.' };
      host2 = { name: 'Jordan', style: 'Enthusiastic and creative.' };
    }

    // Build the full prompt for debate mode
    const debatePrompt = `
TWO-HOST DISCUSSION FORMAT

Create a natural, engaging discussion between two hosts about: "${topic}"

HOST 1 - ${host1.name}: ${host1.style}
HOST 2 - ${host2.name}: ${host2.style}

FORMAT: ${selectedFormatData?.prompt || 'Balanced discussion.'}

GUIDELINES:
- Write natural dialogue, not a script. Use conversational language.
- Each host should have a distinct voice and perspective.
- Include moments of agreement, challenge, and building on each other's points.
- Use names naturally (not every turn): "${host1.name}" and "${host2.name}"
- Start with a brief intro, explore the topic thoroughly, end with key takeaways.
- Format dialogue as:
  [${host1.name}] Their dialogue here...
  [${host2.name}] Their response...

Make it sound like a real podcast conversation between knowledgeable, engaging hosts.
`.trim();

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${topic} (Two-Host Discussion)`,
          length,
          style: debatePrompt,
          isDebateMode: true,
          hosts: [host1, host2],
        }),
      });

      if (response.ok) {
        const { jobId } = await response.json();
        router.push(`/create?job=${jobId}`);
      }
    } catch (err) {
      console.error('Failed to create debate episode:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand/10 mb-4">
          <Users className="h-7 w-7 text-brand" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Two-Host Mode</h2>
        <p className="text-text-secondary mt-1">
          Hear different perspectives in a dynamic discussion
        </p>
      </div>

      {/* Topic Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">
          Discussion Topic
        </label>
        <div className="relative">
          <Textarea
            placeholder="e.g., Should we colonize Mars? Is AI a threat to jobs?..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
            className="min-h-[80px] resize-none pr-12"
          />
          <button
            onClick={shuffleTopic}
            className="absolute right-3 top-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-muted hover:text-text-primary"
            title="Random topic"
          >
            <Shuffle className="h-4 w-4" />
          </button>
        </div>

        {/* Quick suggestions */}
        {!topic && (
          <div className="flex flex-wrap gap-2">
            {DEBATE_TOPICS.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setTopic(suggestion)}
                className="rounded-full bg-surface-tertiary px-3 py-1.5 text-xs text-text-secondary hover:bg-border active:scale-95 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Host Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-primary">
            Choose Your Hosts
          </label>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-xs text-brand hover:underline"
          >
            {showCustom ? 'Use presets' : 'Custom hosts'}
          </button>
        </div>

        {!showCustom ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {HOST_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border p-4 text-left transition-all active:scale-[0.98]',
                  'touch-manipulation',
                  selectedPreset === preset.id
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'font-semibold',
                    selectedPreset === preset.id ? 'text-brand' : 'text-text-primary'
                  )}>
                    {preset.name}
                  </span>
                  {selectedPreset === preset.id && (
                    <Check className="h-4 w-4 text-brand" />
                  )}
                </div>
                <p className="text-xs text-text-muted">{preset.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-tertiary px-2 py-0.5 text-xs">
                    <span>{preset.host1.emoji}</span>
                    {preset.host1.name}
                  </span>
                  <span className="text-xs text-text-muted">vs</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-tertiary px-2 py-0.5 text-xs">
                    <span>{preset.host2.emoji}</span>
                    {preset.host2.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Custom hosts form */
          <div className="space-y-4 rounded-xl border border-border bg-surface-secondary p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Host 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10">
                    <User className="h-4 w-4 text-brand" />
                  </div>
                  <span className="text-sm font-medium">Host 1</span>
                </div>
                <Input
                  placeholder="Name (e.g., Alex)"
                  value={customHost1Name}
                  onChange={(e) => setCustomHost1Name(e.target.value)}
                  className="text-sm"
                />
                <Textarea
                  placeholder="Personality & style (e.g., Skeptical scientist who loves data...)"
                  value={customHost1Style}
                  onChange={(e) => setCustomHost1Style(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>

              {/* Host 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <User className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm font-medium">Host 2</span>
                </div>
                <Input
                  placeholder="Name (e.g., Jordan)"
                  value={customHost2Name}
                  onChange={(e) => setCustomHost2Name(e.target.value)}
                  className="text-sm"
                />
                <Textarea
                  placeholder="Personality & style (e.g., Optimistic entrepreneur who sees potential...)"
                  value={customHost2Style}
                  onChange={(e) => setCustomHost2Style(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">
          Discussion Style
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMAT_OPTIONS.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all active:scale-95',
                  'touch-manipulation',
                  selectedFormat === format.id
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/50'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  selectedFormat === format.id ? 'text-brand' : 'text-text-muted'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  selectedFormat === format.id ? 'text-brand' : 'text-text-primary'
                )}>
                  {format.label}
                </span>
                <span className="text-xs text-text-muted line-clamp-2">
                  {format.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Length Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">
          Episode Length
        </label>
        <div className="flex gap-2">
          {['5 min', '10 min', '15 min', '20 min'].map((l) => (
            <button
              key={l}
              onClick={() => setLength(l)}
              className={cn(
                'flex-1 rounded-xl border py-3 text-center text-sm font-medium transition-all active:scale-95',
                'touch-manipulation',
                length === l
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border hover:border-brand/50 text-text-secondary'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {(selectedPresetData || (showCustom && customHost1Name && customHost2Name)) && topic && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 space-y-2">
          <p className="text-xs text-brand font-medium">Episode Preview</p>
          <p className="text-sm text-text-primary">
            <strong>
              {showCustom ? customHost1Name : selectedPresetData?.host1.name}
            </strong>{' '}
            and{' '}
            <strong>
              {showCustom ? customHost2Name : selectedPresetData?.host2.name}
            </strong>{' '}
            will discuss "{topic}" in a {selectedFormatData?.label.toLowerCase()} format.
          </p>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={generateDebate}
        disabled={!topic.trim() || isGenerating || (!selectedPreset && !showCustom)}
        className="w-full h-14"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Creating Discussion...
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Generate Two-Host Episode
            <ChevronRight className="h-5 w-5 ml-1" />
          </>
        )}
      </Button>
    </div>
  );
}
