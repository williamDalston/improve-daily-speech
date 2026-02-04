'use client';

import { useState } from 'react';
import { BookMarked, ChevronDown, ChevronUp, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Source } from '@/lib/ai/sources';

interface SourcesSectionProps {
  sources: Source[];
}

// Confidence levels for trust indicators
type ConfidenceLevel = 'high' | 'medium' | 'low';

function getSourceConfidence(source: Source): ConfidenceLevel {
  // Simple heuristic based on source metadata
  const hasAuthor = source.author && source.author !== 'Unknown';
  const hasYear = source.year && source.year !== 'n.d.';
  const isAcademic = source.type === 'Academic' || source.type === 'Research';

  if (hasAuthor && hasYear && isAcademic) return 'high';
  if (hasAuthor || (hasYear && isAcademic)) return 'medium';
  return 'low';
}

const confidenceConfig = {
  high: {
    label: 'Well-sourced',
    icon: CheckCircle2,
    className: 'text-success bg-success/10',
  },
  medium: {
    label: 'Sourced',
    icon: Shield,
    className: 'text-brand bg-brand/10',
  },
  low: {
    label: 'Verify',
    icon: AlertTriangle,
    className: 'text-warning bg-warning/10',
  },
};

export function SourcesSection({ sources }: SourcesSectionProps) {
  // Always show all sources by default (per UX research - trust primitives)
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedConfidenceFilter, setSelectedConfidenceFilter] = useState<ConfidenceLevel | 'all'>('all');

  // Count sources by confidence level
  const confidenceCounts = sources.reduce(
    (acc, source) => {
      const confidence = getSourceConfidence(source);
      acc[confidence]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  // Filter sources based on selected confidence
  const filteredSources = selectedConfidenceFilter === 'all'
    ? sources
    : sources.filter(source => getSourceConfidence(source) === selectedConfidenceFilter);

  // Show first 5 sources when collapsed
  const displayedSources = isExpanded ? filteredSources : filteredSources.slice(0, 5);
  const hasMore = filteredSources.length > 5;

  return (
    <Card className="border-2 border-brand/20">
      <CardHeader className="bg-gradient-to-r from-brand/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-brand" />
          Sources & Citations
          <Badge variant="outline" className="ml-auto">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Trust indicator explanation */}
        <div className="mb-4 rounded-lg bg-surface-secondary p-3">
          <p className="text-body-sm text-text-secondary mb-3">
            These sources informed the research. Each is tagged with a confidence indicator.
          </p>

          {/* Confidence filter buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedConfidenceFilter('all')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all',
                selectedConfidenceFilter === 'all'
                  ? 'bg-text-primary text-white'
                  : 'bg-surface-tertiary text-text-secondary hover:bg-border'
              )}
            >
              All ({sources.length})
            </button>
            {(['high', 'medium', 'low'] as ConfidenceLevel[]).map((level) => {
              const config = confidenceConfig[level];
              const Icon = config.icon;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedConfidenceFilter(level)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all',
                    selectedConfidenceFilter === level
                      ? config.className
                      : 'bg-surface-tertiary text-text-secondary hover:bg-border'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {config.label} ({confidenceCounts[level]})
                </button>
              );
            })}
          </div>
        </div>

        {/* Sources list */}
        <ul className="space-y-3">
          {displayedSources.map((source, idx) => {
            const confidence = getSourceConfidence(source);
            const config = confidenceConfig[confidence];
            const Icon = config.icon;

            return (
              <li
                key={source.id || idx}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3 transition-all hover:border-brand/30"
              >
                <span className="flex-shrink-0 rounded bg-brand/10 px-2 py-0.5 text-caption font-medium text-brand">
                  [{idx + 1}]
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-body-sm font-medium text-text-primary">
                      {source.title}
                    </p>
                    <span className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0',
                      config.className
                    )}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                  <p className="text-caption text-text-secondary">
                    {source.author !== 'Unknown' && `${source.author} • `}
                    {source.year}
                    {source.type && source.type !== 'Reference' && ` • ${source.type}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show fewer sources
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show all {filteredSources.length} sources
              </>
            )}
          </Button>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
          <p className="text-caption text-text-secondary">
            AI-generated content should be independently verified. Sources were identified during research but citations may require confirmation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
