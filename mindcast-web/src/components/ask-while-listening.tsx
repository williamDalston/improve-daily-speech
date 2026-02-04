'use client';

import * as React from 'react';
import {
  MessageCircleQuestion,
  Send,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AskWhileListeningProps {
  episodeId: string;
  currentTime?: number;
  className?: string;
}

interface QAPair {
  question: string;
  answer: string;
  timestamp: number;
}

export function AskWhileListening({
  episodeId,
  currentTime = 0,
  className,
}: AskWhileListeningProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [isAsking, setIsAsking] = React.useState(false);
  const [history, setHistory] = React.useState<QAPair[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const historyRef = React.useRef<HTMLDivElement>(null);

  // Quick question suggestions
  const QUICK_QUESTIONS = [
    'Can you explain that more simply?',
    'What are the key takeaways?',
    'How does this connect to real life?',
    'What evidence supports this?',
  ];

  React.useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Scroll to bottom of history when new answer arrives
  React.useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const handleAsk = async (q?: string) => {
    const questionToAsk = q || question.trim();
    if (!questionToAsk) return;

    setIsAsking(true);
    setError(null);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionToAsk,
          currentTime,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get answer');
      }

      const data = await res.json();

      setHistory((prev) => [
        ...prev,
        {
          question: questionToAsk,
          answer: data.answer,
          timestamp: currentTime,
        },
      ]);
      setQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  // Collapsed state - just a button
  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={cn('gap-2', className)}
      >
        <MessageCircleQuestion className="h-4 w-4" />
        Ask
      </Button>
    );
  }

  // Expanded state
  return (
    <div
      className={cn(
        'rounded-xl border border-brand/30 bg-surface overflow-hidden shadow-lg',
        'animate-scale-in',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-brand/5">
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="h-4 w-4 text-brand" />
          <span className="text-sm font-medium text-text-primary">
            Ask About This Episode
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="rounded-lg p-1 hover:bg-surface-secondary transition-colors"
        >
          <X className="h-4 w-4 text-text-muted" />
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div
          ref={historyRef}
          className="max-h-48 overflow-y-auto p-3 space-y-3 border-b border-border"
        >
          {history.map((qa, idx) => (
            <div key={idx} className="space-y-2">
              {/* Question */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-br-sm bg-brand px-3 py-2">
                  <p className="text-sm text-white">{qa.question}</p>
                </div>
              </div>
              {/* Answer */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl rounded-bl-sm bg-surface-secondary px-3 py-2">
                  <p className="text-sm text-text-primary">{qa.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Questions (show only if no history) */}
      {history.length === 0 && (
        <div className="p-3 border-b border-border">
          <p className="text-xs text-text-muted mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleAsk(q)}
                disabled={isAsking}
                className="rounded-full bg-surface-secondary px-3 py-1.5 text-xs text-text-secondary hover:bg-border transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3">
        {error && (
          <div className="mb-2 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this episode..."
            disabled={isAsking}
            className="flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none disabled:opacity-50"
          />
          <Button
            size="sm"
            onClick={() => handleAsk()}
            disabled={!question.trim() || isAsking}
          >
            {isAsking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-text-muted flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI answers based on episode content
        </p>
      </div>

      <style jsx global>{`
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Mini floating button version for the audio player
export function AskButton({
  episodeId,
  currentTime,
  className,
}: AskWhileListeningProps) {
  const [showPanel, setShowPanel] = React.useState(false);

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPanel(!showPanel)}
        className="gap-2"
      >
        <MessageCircleQuestion className="h-4 w-4" />
        {showPanel ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </Button>

      {showPanel && (
        <div className="absolute bottom-full left-0 mb-2 w-80 z-50">
          <AskWhileListening
            episodeId={episodeId}
            currentTime={currentTime}
          />
        </div>
      )}
    </div>
  );
}
