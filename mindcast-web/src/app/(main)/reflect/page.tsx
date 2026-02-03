'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Brain, Lightbulb, Eye, Compass, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

export default function ReflectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [situation, setSituation] = useState('');
  const [selectedLenses, setSelectedLenses] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
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
            }}
            className="w-full"
          >
            Start New Reflection
          </Button>
        </div>
      )}
    </div>
  );
}
