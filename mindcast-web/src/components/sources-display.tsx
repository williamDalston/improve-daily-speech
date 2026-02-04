'use client';

import * as React from 'react';
import { ExternalLink, ChevronDown, ChevronUp, BookOpen, Globe, FileText, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Source {
  url: string;
  title: string;
  snippet?: string;
  domain?: string;
  type?: 'article' | 'paper' | 'book' | 'website';
  confidence?: number; // 0-100 confidence score
}

interface SourcesDisplayProps {
  sources: Source[];
  className?: string;
  initialExpanded?: boolean;
}

// Get favicon URL from domain
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

// Get domain from URL
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Get icon based on source type
function SourceTypeIcon({ type }: { type?: string }) {
  switch (type) {
    case 'paper':
      return <FileText className="h-3 w-3" />;
    case 'book':
      return <BookOpen className="h-3 w-3" />;
    default:
      return <Globe className="h-3 w-3" />;
  }
}

// Confidence bar visualization
function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 80 ? 'bg-success' : confidence >= 50 ? 'bg-warning' : 'bg-error';

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-surface-tertiary overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs text-text-muted">{confidence}%</span>
    </div>
  );
}

export function SourcesDisplay({ sources, className, initialExpanded = false }: SourcesDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded);
  const [hoveredSource, setHoveredSource] = React.useState<number | null>(null);

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-xl border border-border bg-surface/80 backdrop-blur-sm', className)}>
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand" />
          <span className="text-sm font-medium text-text-primary">
            Sources & References
          </span>
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {sources.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        )}
      </button>

      {/* Sources List */}
      {isExpanded && (
        <div className="border-t border-border px-2 py-2">
          <div className="space-y-1">
            {sources.map((source, idx) => {
              const faviconUrl = getFaviconUrl(source.url);
              const domain = source.domain || getDomain(source.url);
              const isHovered = hoveredSource === idx;

              return (
                <div
                  key={idx}
                  className="relative"
                  onMouseEnter={() => setHoveredSource(idx)}
                  onMouseLeave={() => setHoveredSource(null)}
                >
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-start gap-3 rounded-lg p-3 transition-all',
                      'hover:bg-surface-secondary',
                      isHovered && 'bg-surface-secondary'
                    )}
                  >
                    {/* Favicon */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-tertiary">
                      {faviconUrl ? (
                        <img
                          src={faviconUrl}
                          alt=""
                          className="h-4 w-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <SourceTypeIcon type={source.type} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-text-primary line-clamp-2">
                          {source.title}
                        </h4>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-text-muted mt-1" />
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                        <span className="truncate">{domain}</span>
                        {source.type && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{source.type}</span>
                          </>
                        )}
                      </div>

                      {/* Confidence score if available */}
                      {source.confidence !== undefined && (
                        <div className="mt-2">
                          <ConfidenceBar confidence={source.confidence} />
                        </div>
                      )}
                    </div>
                  </a>

                  {/* Hover preview with snippet/quote */}
                  {isHovered && source.snippet && (
                    <div className="absolute left-full top-0 z-50 ml-2 hidden w-72 animate-fade-in rounded-xl border border-border bg-surface p-4 shadow-lg lg:block">
                      <div className="flex items-start gap-2">
                        <Quote className="h-4 w-4 flex-shrink-0 text-brand mt-0.5" />
                        <p className="text-sm text-text-secondary italic line-clamp-4">
                          "{source.snippet}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Accessibility note */}
          <p className="mt-3 px-3 text-xs text-text-muted">
            Click any source to view the original. Confidence scores reflect citation reliability.
          </p>
        </div>
      )}
    </div>
  );
}

// Compact inline source pills for embedding in text
export function SourcePill({ source, index }: { source: Source; index: number }) {
  const faviconUrl = getFaviconUrl(source.url);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
      title={source.title}
    >
      {faviconUrl && (
        <img src={faviconUrl} alt="" className="h-3 w-3" />
      )}
      <span>[{index + 1}]</span>
    </a>
  );
}
