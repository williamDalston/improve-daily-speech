'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Play,
  Settings2,
  Loader2,
  Check,
  X,
  Clock,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDuration } from '@/lib/utils';

interface DailyDropProps {
  className?: string;
}

interface Category {
  id: string;
  label: string;
}

interface TodaysDrop {
  id: string;
  title: string | null;
  topic: string;
  status: string;
  audioDurationSecs: number | null;
}

const LISTENING_MODES = [
  { id: 'commute', label: 'Commute', description: '10 min, easy to follow' },
  { id: 'deep_dive', label: 'Deep Dive', description: '15 min, more detail' },
];

const NARRATOR_TONES = [
  { id: 'bbc_calm', label: 'BBC Calm', emoji: '🎙️' },
  { id: 'playful_professor', label: 'Playful Professor', emoji: '🎓' },
  { id: 'no_fluff', label: 'No Fluff', emoji: '⚡' },
];

export function DailyDrop({ className }: DailyDropProps) {
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [available, setAvailable] = React.useState(false);
  const [todaysDrop, setTodaysDrop] = React.useState<TodaysDrop | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [userInterests, setUserInterests] = React.useState<string[]>([]);
  const [showSettings, setShowSettings] = React.useState(false);
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>([]);
  const [listeningMode, setListeningMode] = React.useState('commute');
  const [narratorTone, setNarratorTone] = React.useState('bbc_calm');
  const [savingPrefs, setSavingPrefs] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchDailyDrop();
  }, []);

  // Poll for job completion when generating
  React.useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'COMPLETE') {
          setGenerating(false);
          setJobId(null);
          fetchDailyDrop(); // Refresh to show the new episode
        } else if (data.status === 'FAILED') {
          setGenerating(false);
          setJobId(null);
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId]);

  const fetchDailyDrop = async () => {
    try {
      const res = await fetch('/api/daily-drop');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setAvailable(data.available);
      setTodaysDrop(data.todaysDrop);
      setCategories(data.categories || []);
      setUserInterests(data.userInterests || []);
      setSelectedInterests(data.userInterests || []);
    } catch (err) {
      console.error('Failed to fetch daily drop:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/daily-drop', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        if (data.needsUpgrade) {
          window.location.href = '/pricing';
          return;
        }
        throw new Error(data.error || 'Failed to generate');
      }

      const data = await res.json();
      setJobId(data.jobId);
      setAvailable(false);
    } catch (err) {
      console.error('Failed to generate daily drop:', err);
      setGenerating(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/daily-drop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: selectedInterests,
          listeningMode,
          narratorTone,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setUserInterests(selectedInterests);
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <Card className={cn('border-brand/20', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </CardContent>
      </Card>
    );
  }

  // Show settings panel
  if (showSettings) {
    return (
      <Card className={cn('border-brand/20', className)}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-brand" />
              Daily Drop Preferences
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="rounded-lg p-1 hover:bg-surface-secondary"
            >
              <X className="h-4 w-4 text-text-muted" />
            </button>
          </div>

          {/* Interest Categories */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Topics I'm interested in
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleInterest(cat.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-all',
                    selectedInterests.includes(cat.id)
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-text-muted hover:border-brand/30'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listening Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Listening style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LISTENING_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setListeningMode(mode.id)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    listeningMode === mode.id
                      ? 'border-brand bg-brand/10'
                      : 'border-border hover:border-brand/30'
                  )}
                >
                  <p
                    className={cn(
                      'font-medium text-sm',
                      listeningMode === mode.id ? 'text-brand' : 'text-text-primary'
                    )}
                  >
                    {mode.label}
                  </p>
                  <p className="text-xs text-text-muted">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Narrator Tone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Narrator style
            </label>
            <div className="flex gap-2">
              {NARRATOR_TONES.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setNarratorTone(tone.id)}
                  className={cn(
                    'flex-1 rounded-xl border p-2 text-center transition-all',
                    narratorTone === tone.id
                      ? 'border-brand bg-brand/10'
                      : 'border-border hover:border-brand/30'
                  )}
                >
                  <span className="text-lg">{tone.emoji}</span>
                  <p
                    className={cn(
                      'text-xs font-medium mt-1',
                      narratorTone === tone.id ? 'text-brand' : 'text-text-primary'
                    )}
                  >
                    {tone.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSavePreferences}
            disabled={savingPrefs}
            className="w-full"
          >
            {savingPrefs ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show today's drop or generate button
  return (
    <Card
      className={cn(
        'border-brand/20 bg-gradient-to-br from-brand/5 via-transparent to-brand/5 overflow-hidden',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <Sun className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                Daily Drop
                <Badge variant="secondary" className="text-xs">
                  Personalized
                </Badge>
              </h3>
              <p className="text-sm text-text-muted">
                {todaysDrop
                  ? "Today's episode is ready"
                  : available
                  ? 'Your daily learning awaits'
                  : 'Come back tomorrow'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="rounded-lg p-2 hover:bg-surface-secondary transition-colors"
            title="Preferences"
          >
            <Settings2 className="h-4 w-4 text-text-muted" />
          </button>
        </div>

        {/* Today's Episode */}
        {todaysDrop && (
          <Link href={`/episode/${todaysDrop.id}`}>
            <div className="mt-4 rounded-xl border border-border bg-surface p-3 hover:border-brand/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand">
                  <Play className="h-5 w-5 text-white ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {todaysDrop.title || todaysDrop.topic.replace('[Daily Drop] ', '')}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    {todaysDrop.status === 'READY' ? (
                      <>
                        <Clock className="h-3 w-3" />
                        {todaysDrop.audioDurationSecs
                          ? formatDuration(todaysDrop.audioDurationSecs)
                          : '~10 min'}
                      </>
                    ) : (
                      <span className="text-brand">Processing...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Generate Button */}
        {!todaysDrop && available && (
          <div className="mt-4">
            {userInterests.length === 0 && (
              <p className="text-xs text-text-muted mb-3">
                Set your interests to personalize your Daily Drop
              </p>
            )}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Today's Drop
                </>
              )}
            </Button>
          </div>
        )}

        {/* Generating State */}
        {generating && (
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand/5 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Creating your Daily Drop...
                </p>
                <p className="text-xs text-text-muted">
                  This usually takes 1-2 minutes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Come Back Tomorrow */}
        {!todaysDrop && !available && !generating && (
          <div className="mt-4 text-center py-2">
            <p className="text-sm text-text-muted">
              Your next Daily Drop unlocks tomorrow
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
