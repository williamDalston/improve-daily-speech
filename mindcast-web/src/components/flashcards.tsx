'use client';

import * as React from 'react';
import {
  Layers,
  RotateCcw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain,
  Clock,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Flashcard {
  id: string;
  front: string; // Question or prompt
  back: string; // Answer
  episodeId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  nextReview?: Date;
  correctCount: number;
  incorrectCount: number;
}

interface FlashcardsProps {
  episodeId: string;
  episodeTitle: string;
  transcript: string;
  className?: string;
}

// Simple spaced repetition intervals (in days)
const SR_INTERVALS = {
  again: 0, // Review immediately
  hard: 1,
  good: 3,
  easy: 7,
};

export function Flashcards({ episodeId, episodeTitle, transcript, className }: FlashcardsProps) {
  const [cards, setCards] = React.useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [mode, setMode] = React.useState<'browse' | 'study'>('browse');
  const [studyQueue, setStudyQueue] = React.useState<string[]>([]);

  // Load saved cards from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem(`flashcards-${episodeId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCards(parsed.map((c: Flashcard) => ({
          ...c,
          lastReviewed: c.lastReviewed ? new Date(c.lastReviewed) : undefined,
          nextReview: c.nextReview ? new Date(c.nextReview) : undefined,
        })));
      } catch {}
    }
  }, [episodeId]);

  // Save cards to localStorage
  const saveCards = React.useCallback((newCards: Flashcard[]) => {
    localStorage.setItem(`flashcards-${episodeId}`, JSON.stringify(newCards));
    setCards(newCards);
  }, [episodeId]);

  // Generate flashcards from transcript
  const generateCards = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId,
          type: 'flashcards',
          transcript: transcript.slice(0, 8000), // Limit for API
        }),
      });

      if (!response.ok) throw new Error('Failed to generate flashcards');

      const data = await response.json();
      const newCards: Flashcard[] = (data.cards || []).map((card: { front: string; back: string }, idx: number) => ({
        id: `card-${episodeId}-${idx}`,
        front: card.front,
        back: card.back,
        episodeId,
        difficulty: 'medium' as const,
        correctCount: 0,
        incorrectCount: 0,
      }));

      saveCards(newCards);
    } catch (err) {
      console.error('Failed to generate flashcards:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Get cards due for review
  const getDueCards = () => {
    const now = new Date();
    return cards.filter((card) => {
      if (!card.nextReview) return true;
      return new Date(card.nextReview) <= now;
    });
  };

  // Start study session
  const startStudy = () => {
    const due = getDueCards();
    if (due.length === 0) {
      // If no due cards, study all
      setStudyQueue(cards.map((c) => c.id));
    } else {
      setStudyQueue(due.map((c) => c.id));
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setMode('study');
  };

  // Handle study response
  const handleResponse = (response: 'again' | 'hard' | 'good' | 'easy') => {
    const currentCardId = studyQueue[currentIndex];
    const card = cards.find((c) => c.id === currentCardId);
    if (!card) return;

    const now = new Date();
    const intervalDays = SR_INTERVALS[response];
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    const updatedCard: Flashcard = {
      ...card,
      lastReviewed: now,
      nextReview,
      correctCount: response !== 'again' ? card.correctCount + 1 : card.correctCount,
      incorrectCount: response === 'again' ? card.incorrectCount + 1 : card.incorrectCount,
      difficulty: response === 'easy' ? 'easy' : response === 'again' ? 'hard' : 'medium',
    };

    const newCards = cards.map((c) => (c.id === currentCardId ? updatedCard : c));
    saveCards(newCards);

    // Move to next card
    if (currentIndex < studyQueue.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    } else {
      // Session complete
      setMode('browse');
      setStudyQueue([]);
    }
  };

  // Delete a card
  const deleteCard = (cardId: string) => {
    const newCards = cards.filter((c) => c.id !== cardId);
    saveCards(newCards);
    if (currentIndex >= newCards.length && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentCard = mode === 'study'
    ? cards.find((c) => c.id === studyQueue[currentIndex])
    : cards[currentIndex];

  const dueCount = getDueCards().length;

  if (cards.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface p-6', className)}>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10">
            <Layers className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Flashcards</h3>
            <p className="text-sm text-text-secondary mt-1">
              Create flashcards from this episode for spaced repetition learning
            </p>
          </div>
          <Button onClick={generateCards} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Flashcards
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border bg-surface overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand" />
          <span className="font-semibold text-text-primary">Flashcards</span>
          <span className="text-sm text-text-muted">({cards.length})</span>
        </div>
        {dueCount > 0 && mode === 'browse' && (
          <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full">
            {dueCount} due
          </span>
        )}
      </div>

      {/* Card Display */}
      <div className="p-4">
        {mode === 'study' && (
          <div className="text-center text-sm text-text-muted mb-3">
            Card {currentIndex + 1} of {studyQueue.length}
          </div>
        )}

        {currentCard && (
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={cn(
              'relative min-h-[200px] rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 transform',
              'hover:shadow-lg',
              isFlipped
                ? 'bg-brand/5 border-brand/30'
                : 'bg-surface-secondary border-border'
            )}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className={cn(
                'absolute inset-0 p-6 flex flex-col justify-center items-center backface-hidden',
                isFlipped && 'invisible'
              )}
            >
              <Brain className="h-6 w-6 text-brand mb-3" />
              <p className="text-center text-text-primary font-medium">
                {currentCard.front}
              </p>
              <p className="text-xs text-text-muted mt-4">Tap to reveal answer</p>
            </div>

            {/* Back */}
            <div
              className={cn(
                'absolute inset-0 p-6 flex flex-col justify-center items-center',
                !isFlipped && 'invisible'
              )}
              style={{ transform: 'rotateY(180deg)' }}
            >
              <Check className="h-6 w-6 text-success mb-3" />
              <p className="text-center text-text-primary">
                {currentCard.back}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        {mode === 'browse' ? (
          <div className="mt-4 space-y-3">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-text-muted">
                {currentIndex + 1} / {cards.length}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1))}
                disabled={currentIndex === cards.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={startStudy} className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                {dueCount > 0 ? `Study ${dueCount} Due` : 'Study All'}
              </Button>
              {currentCard && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => deleteCard(currentCard.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={generateCards}
              disabled={isGenerating}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Regenerate Cards
            </Button>
          </div>
        ) : (
          /* Study Mode Controls */
          <div className="mt-4 space-y-3">
            {isFlipped && (
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  className="border-error text-error hover:bg-error/10"
                  onClick={() => handleResponse('again')}
                >
                  Again
                </Button>
                <Button
                  variant="outline"
                  className="border-warning text-warning hover:bg-warning/10"
                  onClick={() => handleResponse('hard')}
                >
                  Hard
                </Button>
                <Button
                  variant="outline"
                  className="border-success text-success hover:bg-success/10"
                  onClick={() => handleResponse('good')}
                >
                  Good
                </Button>
                <Button
                  variant="outline"
                  className="border-brand text-brand hover:bg-brand/10"
                  onClick={() => handleResponse('easy')}
                >
                  Easy
                </Button>
              </div>
            )}

            <p className="text-xs text-center text-text-muted">
              {isFlipped
                ? 'How well did you know this?'
                : 'Tap the card to reveal the answer'}
            </p>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode('browse');
                setStudyQueue([]);
              }}
            >
              Exit Study Mode
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
