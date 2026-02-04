'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Brain, Lightbulb, Eye, Compass, Sparkles, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { trackEvent, Events } from '@/lib/analytics';

const LENSES = [
  {
    id: 'stoic',
    name: 'Stoic',
    description: 'Focus on what you can control',
    icon: Compass,
    color: 'text-blue-600',
  },
  {
    id: 'socratic',
    name: 'Socratic',
    description: 'Question your assumptions',
    icon: Lightbulb,
    color: 'text-amber-600',
  },
  {
    id: 'systems',
    name: 'Systems',
    description: 'See interconnections and leverage',
    icon: Brain,
    color: 'text-purple-600',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Explore unconventional solutions',
    icon: Sparkles,
    color: 'text-pink-600',
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Examine hidden motivations',
    icon: Eye,
    color: 'text-slate-600',
  },
];

interface ReflectHistory {
  id: string;
  situation: string;
  analysis: string;
  lenses: string[];
  createdAt: string;
}

export default function ReflectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [situation, setSituation] = useState('');
  const [selectedLenses, setSelectedLenses] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentReflectId, setCurrentReflectId] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<ReflectHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    if (session?.user) {
      loadHistory();
    }
  }, [session?.user]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/reflect?limit=10');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.reflects);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleLens = (id: string) => {
    setSelectedLenses((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id].slice(0, 3)
    );
  };

  const handleAnalyze = async () => {
    if (!situation.trim() || selectedLenses.length === 0) return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setCurrentReflectId(null);

    try {
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, lenses: selectedLenses }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setCurrentReflectId(data.id);

      // Track analytics
      trackEvent({
        name: Events.REFLECT_SUBMITTED,
        properties: {
          lenses: selectedLenses.join(','),
          situationLength: situation.length,
        },
      });

      // Refresh history
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 w-fit rounded-full bg-brand/10 p-3">
          <Brain className="h-8 w-8 text-brand" />
        </div>
        <h1 className="mb-2 text-display-sm text-text-primary">Sovereign Mind</h1>
        <p className="text-body-md text-text-secondary">
          Analyze any situation through powerful philosophical lenses
        </p>
      </div>

      {!analysis ? (
        <Card>
          <CardContent className="space-y-6 p-6">
            {/* Situation Input */}
            <div className="space-y-2">
              <label className="text-body-sm font-medium text-text-primary">
                Describe your situation or dilemma
              </label>
              <Textarea
                placeholder="I'm facing a difficult decision at work... / I keep procrastinating on... / I'm conflicted about..."
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                disabled={isAnalyzing}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Lens Selection */}
            <div className="space-y-3">
              <label className="text-body-sm font-medium text-text-primary">
                Choose up to 3 lenses
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {LENSES.map((lens) => {
                  const Icon = lens.icon;
                  const isSelected = selectedLenses.includes(lens.id);
                  return (
                    <button
                      key={lens.id}
                      onClick={() => toggleLens(lens.id)}
                      disabled={isAnalyzing}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                        isSelected
                          ? 'border-brand bg-brand/5'
                          : 'border-border hover:border-brand/50'
                      )}
                    >
                      <Icon className={cn('h-6 w-6', lens.color)} />
                      <span className="text-body-sm font-medium text-text-primary">
                        {lens.name}
                      </span>
                      <span className="text-caption text-text-muted">
                        {lens.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-error/10 p-4 text-body-sm text-error">
                {error}
              </div>
            )}

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!situation.trim() || selectedLenses.length === 0 || isAnalyzing}
              loading={isAnalyzing}
              className="w-full"
              size="lg"
            >
              <Brain className="h-5 w-5" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Situation'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Analysis Result */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Analysis</CardTitle>
              <CardDescription>
                Using: {selectedLenses.map((l) => LENSES.find((x) => x.id === l)?.name).join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm whitespace-pre-wrap text-text-secondary">
                {analysis}
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={() => {
              setAnalysis(null);
              setSituation('');
              setSelectedLenses([]);
              setCurrentReflectId(null);
            }}
            className="w-full"
          >
            Start New Reflection
          </Button>
        </div>
      )}

      {/* Past Reflections */}
      {history.length > 0 && (
        <div className="border-t border-border pt-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-muted" />
              <span className="text-body-sm font-medium text-text-primary">
                Past Reflections ({history.length})
              </span>
            </div>
            {showHistory ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" />
                </div>
              ) : (
                history.map((item) => {
                  const isExpanded = expandedHistoryId === item.id;
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <button
                        onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                        className="w-full text-left p-4 hover:bg-surface-secondary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm font-medium text-text-primary line-clamp-2">
                              {truncate(item.situation, 100)}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-caption text-text-muted">
                              <span>{formatDate(item.createdAt)}</span>
                              <span>•</span>
                              <span>{item.lenses.map((l) => LENSES.find((x) => x.id === l)?.name || l).join(', ')}</span>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border">
                          <div className="mt-4 prose prose-sm whitespace-pre-wrap text-text-secondary">
                            {item.analysis}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
