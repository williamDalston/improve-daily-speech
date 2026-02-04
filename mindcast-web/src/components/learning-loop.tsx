'use client';

import { useState, useEffect } from 'react';
import {
  Lightbulb,
  Brain,
  BookOpen,
  Loader2,
  Check,
  ChevronRight,
  Trophy,
  Bookmark,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LearningLoopProps {
  episodeId: string;
  episodeTitle: string;
  onComplete?: () => void;
  onDismiss?: () => void;
  className?: string;
}

type LoopStep = 'intro' | 'takeaways' | 'quiz' | 'journal' | 'complete';

export function LearningLoop({
  episodeId,
  episodeTitle,
  onComplete,
  onDismiss,
  className,
}: LearningLoopProps) {
  const [currentStep, setCurrentStep] = useState<LoopStep>('intro');
  const [isLoading, setIsLoading] = useState(false);

  // Takeaways state
  const [takeaways, setTakeaways] = useState<string[]>([]);
  const [savedTakeaways, setSavedTakeaways] = useState<Set<number>>(new Set());

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Journal state
  const [journalEntry, setJournalEntry] = useState('');

  // XP earned in this loop
  const [xpEarned, setXpEarned] = useState(0);

  // Start with intro, auto-progress to takeaways
  useEffect(() => {
    if (currentStep === 'intro') {
      const timer = setTimeout(() => loadTakeaways(), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const loadTakeaways = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, addonType: 'takeaways' }),
      });

      if (response.ok) {
        const data = await response.json();
        // Parse takeaways from numbered list
        const parsed = data.content
          .split(/\d+\.\s+/)
          .filter((t: string) => t.trim())
          .map((t: string) => t.trim());
        setTakeaways(parsed);
      }
    } catch (err) {
      console.error('Failed to load takeaways:', err);
    } finally {
      setIsLoading(false);
      setCurrentStep('takeaways');
    }
  };

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, addonType: 'quiz' }),
      });

      if (response.ok) {
        const data = await response.json();
        // Parse quiz content - expecting JSON or structured format
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(data.content);
          setQuizQuestions(parsed.questions || []);
        } catch {
          // Fall back to creating simple questions from content
          const lines = data.content.split('\n').filter((l: string) => l.trim());
          const questions: QuizQuestion[] = [];

          for (let i = 0; i < Math.min(lines.length, 2); i++) {
            questions.push({
              question: lines[i],
              options: ['True', 'False', 'Partially true', 'Not mentioned'],
              correctIndex: 0,
              explanation: 'This tests your recall of the key concepts.',
            });
          }
          setQuizQuestions(questions);
        }
      }
    } catch (err) {
      console.error('Failed to load quiz:', err);
      // Create default questions
      setQuizQuestions([
        {
          question: `What is the main takeaway from "${episodeTitle}"?`,
          options: ['Think about it...', 'Check the transcript', 'Try to recall', 'All of the above'],
          correctIndex: 2,
          explanation: 'Active recall strengthens memory more than re-reading!',
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentStep('quiz');
    }
  };

  const handleSaveTakeaway = (index: number) => {
    setSavedTakeaways((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        setXpEarned((prev) => prev + 5);
      }
      return next;
    });
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (answerIndex === currentQuestion.correctIndex) {
      setCorrectAnswers((prev) => prev + 1);
      setXpEarned((prev) => prev + 25);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setCurrentStep('journal');
    }
  };

  const handleJournalSubmit = async () => {
    if (journalEntry.trim()) {
      setXpEarned((prev) => prev + 25);

      // Save journal entry via API
      try {
        await fetch('/api/addon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId,
            addonType: 'journal',
            userResponse: journalEntry,
          }),
        });
      } catch (err) {
        console.error('Failed to save journal:', err);
      }
    }
    setCurrentStep('complete');
  };

  const handleComplete = async () => {
    // Persist XP to server
    if (xpEarned > 0) {
      try {
        await fetch('/api/user/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: xpEarned }),
        });
      } catch (err) {
        console.error('Failed to save XP:', err);
      }
    }
    onComplete?.();
  };

  const stepProgress = {
    intro: 0,
    takeaways: 25,
    quiz: 50,
    journal: 75,
    complete: 100,
  };

  return (
    <Card className={cn('overflow-hidden border-2 border-brand/20', className)}>
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-brand/10 to-brand/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-brand p-1.5">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base">Learning Loop</CardTitle>
          </div>
          {onDismiss && currentStep !== 'complete' && (
            <button
              onClick={onDismiss}
              className="rounded-full p-1 text-text-muted hover:bg-surface-tertiary hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Progress value={stepProgress[currentStep]} className="mt-3 h-1.5" />
      </CardHeader>

      <CardContent className="p-4 pt-4">
        {/* Intro */}
        {currentStep === 'intro' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-brand/10 p-4">
              <Lightbulb className="h-8 w-8 text-brand" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">
              Great listening!
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
              Let's lock in what you learned with a quick review.
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        )}

        {/* Takeaways */}
        {currentStep === 'takeaways' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-brand" />
              <h3 className="font-semibold text-text-primary">Key Takeaways</h3>
            </div>
            <p className="text-sm text-text-secondary">
              Tap to save the insights that resonated with you.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : (
              <div className="space-y-2">
                {takeaways.map((takeaway, index) => (
                  <button
                    key={index}
                    onClick={() => handleSaveTakeaway(index)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99]',
                      savedTakeaways.has(index)
                        ? 'border-brand bg-brand/10'
                        : 'border-border hover:border-brand/50'
                    )}
                  >
                    <Bookmark
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        savedTakeaways.has(index)
                          ? 'fill-brand text-brand'
                          : 'text-text-muted'
                      )}
                    />
                    <span className="text-sm text-text-primary">{takeaway}</span>
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={loadQuiz}
              className="w-full"
              disabled={isLoading}
            >
              Continue to Quiz
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Quiz */}
        {currentStep === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand" />
              <h3 className="font-semibold text-text-primary">Quick Recall</h3>
              <span className="ml-auto text-xs text-text-muted">
                {currentQuestionIndex + 1} / {quizQuestions.length}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : quizQuestions.length > 0 ? (
              <>
                <p className="text-sm font-medium text-text-primary">
                  {quizQuestions[currentQuestionIndex]?.question}
                </p>

                <div className="space-y-2">
                  {quizQuestions[currentQuestionIndex]?.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !showExplanation && handleQuizAnswer(index)}
                      disabled={showExplanation}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                        showExplanation && index === quizQuestions[currentQuestionIndex].correctIndex
                          ? 'border-success bg-success/10'
                          : showExplanation && index === selectedAnswer && index !== quizQuestions[currentQuestionIndex].correctIndex
                          ? 'border-error bg-error/10'
                          : selectedAnswer === index
                          ? 'border-brand bg-brand/10'
                          : 'border-border hover:border-brand/50',
                        showExplanation && 'cursor-default'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                          showExplanation && index === quizQuestions[currentQuestionIndex].correctIndex
                            ? 'border-success bg-success text-white'
                            : showExplanation && index === selectedAnswer
                            ? 'border-error bg-error text-white'
                            : 'border-border'
                        )}
                      >
                        {showExplanation && index === quizQuestions[currentQuestionIndex].correctIndex ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span className="text-sm">{option}</span>
                    </button>
                  ))}
                </div>

                {showExplanation && (
                  <div className="rounded-xl bg-surface-secondary p-3">
                    <p className="text-sm text-text-secondary">
                      {quizQuestions[currentQuestionIndex]?.explanation}
                    </p>
                  </div>
                )}

                {showExplanation && (
                  <Button onClick={handleNextQuestion} className="w-full">
                    {currentQuestionIndex < quizQuestions.length - 1 ? (
                      <>
                        Next Question
                        <ChevronRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Continue to Reflection
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={() => setCurrentStep('journal')} className="w-full">
                Skip to Reflection
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Journal */}
        {currentStep === 'journal' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-brand" />
              <h3 className="font-semibold text-text-primary">Quick Reflection</h3>
            </div>
            <p className="text-sm text-text-secondary">
              What's one thing you'll do differently based on what you learned?
            </p>

            <Textarea
              placeholder="I'll try to..."
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              className="min-h-[100px] resize-none"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('complete')}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handleJournalSubmit}
                disabled={!journalEntry.trim()}
                className="flex-1"
              >
                Save & Complete
              </Button>
            </div>
          </div>
        )}

        {/* Complete */}
        {currentStep === 'complete' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-success/10 p-4">
              <Trophy className="h-8 w-8 text-success" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">
              Learning Locked In!
            </h3>
            <p className="mb-2 text-sm text-text-secondary">
              {correctAnswers > 0 && `${correctAnswers} correct answers • `}
              {savedTakeaways.size > 0 && `${savedTakeaways.size} takeaways saved`}
            </p>
            {xpEarned > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2">
                <Lightbulb className="h-4 w-4 text-brand" />
                <span className="font-semibold text-brand">+{xpEarned} XP</span>
              </div>
            )}
            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
