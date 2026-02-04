'use client';

import { useState } from 'react';
import { Flag, AlertTriangle, HelpCircle, FileQuestion, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ContentFeedbackProps {
  episodeId: string;
  className?: string;
}

type FeedbackType = 'inaccurate' | 'needs_source' | 'too_complex' | 'too_shallow' | 'other';

const FEEDBACK_TYPES = [
  {
    id: 'inaccurate' as FeedbackType,
    label: 'This seems wrong',
    icon: AlertTriangle,
    description: 'Factual error or misleading information',
  },
  {
    id: 'needs_source' as FeedbackType,
    label: 'Needs a source',
    icon: FileQuestion,
    description: 'Claim should be cited',
  },
  {
    id: 'too_complex' as FeedbackType,
    label: 'Too complex',
    icon: HelpCircle,
    description: 'Hard to understand',
  },
  {
    id: 'too_shallow' as FeedbackType,
    label: 'Too shallow',
    icon: HelpCircle,
    description: 'Needs more depth',
  },
];

export function ContentFeedback({ episodeId, className }: ContentFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId,
          type: selectedType,
          details,
          timestamp: new Date().toISOString(),
        }),
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setSelectedType(null);
        setDetails('');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-all',
          'hover:border-warning/50 hover:bg-warning/5 hover:text-warning',
          className
        )}
      >
        <Flag className="h-4 w-4" />
        Report an issue
      </button>
    );
  }

  if (isSubmitted) {
    return (
      <div className={cn(
        'rounded-xl border border-success/30 bg-success/5 p-4',
        className
      )}>
        <div className="flex items-center gap-2 text-success">
          <Check className="h-5 w-5" />
          <span className="font-medium">Thank you for your feedback!</span>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          We'll review this and improve our content.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border border-border bg-surface-secondary p-4',
      className
    )}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-warning" />
          <span className="font-medium text-text-primary">Report an issue</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full p-1 text-text-muted hover:bg-surface-tertiary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-4 text-sm text-text-secondary">
        Help us improve by reporting problems with this content.
      </p>

      {/* Feedback type selection */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {FEEDBACK_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                selectedType === type.id
                  ? 'border-warning bg-warning/10'
                  : 'border-border hover:border-warning/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn(
                  'h-4 w-4',
                  selectedType === type.id ? 'text-warning' : 'text-text-muted'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  selectedType === type.id ? 'text-warning' : 'text-text-primary'
                )}>
                  {type.label}
                </span>
              </div>
              <span className="text-xs text-text-muted">{type.description}</span>
            </button>
          );
        })}
      </div>

      {/* Details input */}
      {selectedType && (
        <div className="mb-4">
          <Textarea
            placeholder="Optional: Add more details about the issue..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
      )}

      {/* Submit button */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsOpen(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedType || isSubmitting}
          className="flex-1 bg-warning text-white hover:bg-warning/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </div>
    </div>
  );
}
