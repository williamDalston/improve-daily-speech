'use client';

import * as React from 'react';
import { Share2, Copy, Check, Twitter, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuoteCardProps {
  quote: string;
  episodeTitle: string;
  episodeId: string;
  className?: string;
}

// Card style presets
const CARD_STYLES = [
  {
    id: 'dark',
    bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
    text: 'text-white',
    accent: 'text-brand',
  },
  {
    id: 'brand',
    bg: 'bg-gradient-to-br from-brand to-brand-dark',
    text: 'text-white',
    accent: 'text-white/80',
  },
  {
    id: 'sunset',
    bg: 'bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600',
    text: 'text-white',
    accent: 'text-yellow-200',
  },
  {
    id: 'minimal',
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'text-brand',
  },
];

export function QuoteCard({ quote, episodeTitle, episodeId, className }: QuoteCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [selectedStyle, setSelectedStyle] = React.useState(CARD_STYLES[0]);
  const [copied, setCopied] = React.useState(false);
  const [showShare, setShowShare] = React.useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/episode/${episodeId}`
    : '';

  const copyQuote = async () => {
    const text = `"${quote}"\n\n— ${episodeTitle}\n${shareUrl}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = `"${quote.slice(0, 200)}${quote.length > 200 ? '...' : ''}"\n\nFrom: ${episodeTitle}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    // In production, this would use html2canvas or similar
    // For now, copy the quote with formatting
    const text = `"${quote}"\n\n— ${episodeTitle}\nListen on MindCast: ${shareUrl}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const style = selectedStyle;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quote Card Preview */}
      <div
        ref={cardRef}
        className={cn(
          'relative rounded-2xl p-8 overflow-hidden shadow-lg',
          style.bg
        )}
      >
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 text-4xl opacity-20">"</div>
        <div className="absolute bottom-4 right-4 text-4xl opacity-20 rotate-180">"</div>

        {/* Quote content */}
        <div className="relative z-10 text-center space-y-4">
          <p className={cn('text-lg font-medium leading-relaxed', style.text)}>
            "{quote}"
          </p>

          <div className="pt-4 border-t border-white/20">
            <div className={cn('flex items-center justify-center gap-2', style.accent)}>
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">MindCast</span>
            </div>
            <p className={cn('text-sm mt-1 opacity-80', style.text)}>
              {episodeTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Style Selector */}
      <div className="flex items-center justify-center gap-2">
        {CARD_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStyle(s)}
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-all',
              s.bg,
              selectedStyle.id === s.id
                ? 'ring-2 ring-brand ring-offset-2 border-transparent'
                : 'border-border'
            )}
          />
        ))}
      </div>

      {/* Share Actions */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={copyQuote}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1 text-success" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>

        <Button variant="outline" size="sm" onClick={shareToTwitter}>
          <Twitter className="h-4 w-4 mr-1" />
          Tweet
        </Button>

        <Button variant="outline" size="sm" onClick={downloadCard}>
          <Download className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}

// Extract quotes from transcript
export function extractQuotes(transcript: string): string[] {
  // Find sentences that are likely good quotes (memorable, insightful)
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .filter((s) => {
      const trimmed = s.trim();
      // Good quotes are typically 50-200 characters
      if (trimmed.length < 50 || trimmed.length > 200) return false;
      // Should start with a capital letter
      if (!/^[A-Z]/.test(trimmed)) return false;
      // Avoid sentences that are just facts/numbers
      if (/^\d+|percent|million|billion/i.test(trimmed)) return false;
      // Prefer sentences with interesting words
      const hasInterestingWords = /secret|surprising|actually|truth|key|important|remember|never|always|most people|the real/i.test(trimmed);
      return hasInterestingWords;
    });

  // Return top 5 quotes
  return sentences.slice(0, 5);
}

// Quote selector modal
interface QuoteSelectorProps {
  transcript: string;
  episodeTitle: string;
  episodeId: string;
  onClose: () => void;
}

export function QuoteSelector({ transcript, episodeTitle, episodeId, onClose }: QuoteSelectorProps) {
  const [selectedQuote, setSelectedQuote] = React.useState<string | null>(null);
  const quotes = React.useMemo(() => extractQuotes(transcript), [transcript]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Create Quote Card</h2>
          <p className="text-sm text-text-muted">Select a quote to share</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedQuote ? (
            <QuoteCard
              quote={selectedQuote}
              episodeTitle={episodeTitle}
              episodeId={episodeId}
            />
          ) : (
            <div className="space-y-3">
              {quotes.length > 0 ? (
                quotes.map((quote, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedQuote(quote)}
                    className="w-full text-left p-4 rounded-xl border border-border hover:border-brand hover:bg-brand/5 transition-all"
                  >
                    <p className="text-text-primary">"{quote}"</p>
                  </button>
                ))
              ) : (
                <p className="text-center text-text-muted py-8">
                  No quotable moments found in this episode
                </p>
              )}

              {/* Custom quote input */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-text-muted mb-2">Or enter a custom quote:</p>
                <textarea
                  placeholder="Type or paste a quote..."
                  className="w-full p-3 rounded-xl border border-border bg-surface-secondary text-text-primary resize-none"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const value = (e.target as HTMLTextAreaElement).value.trim();
                      if (value) setSelectedQuote(value);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3">
          {selectedQuote && (
            <Button variant="outline" onClick={() => setSelectedQuote(null)}>
              ← Back
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
