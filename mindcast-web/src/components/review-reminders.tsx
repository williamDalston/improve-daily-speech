'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DueEpisode {
  id: string;
  title: string;
  topic: string;
  nextReviewAt: string;
  reviewCount: number;
  daysPastDue: number;
}

interface UpcomingEpisode {
  id: string;
  title: string;
  topic: string;
  nextReviewAt: string;
  daysUntilDue: number;
}

interface ReviewStats {
  dueNow: number;
  dueThisWeek: number;
  totalReviews: number;
  averageQuality: number;
}

export function ReviewReminders() {
  const [isLoading, setIsLoading] = useState(true);
  const [dueEpisodes, setDueEpisodes] = useState<DueEpisode[]>([]);
  const [upcomingEpisodes, setUpcomingEpisodes] = useState<UpcomingEpisode[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (!res.ok) throw new Error('Failed to fetch reviews');

      const data = await res.json();
      setDueEpisodes(data.dueEpisodes);
      setUpcomingEpisodes(data.upcomingEpisodes);
      setStats(data.stats);
    } catch (err) {
      setError('Could not load review schedule');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-error/30">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <span className="text-sm text-error">{error}</span>
        </CardContent>
      </Card>
    );
  }

  // Don't show anything if no reviews scheduled
  if (dueEpisodes.length === 0 && upcomingEpisodes.length === 0) {
    return null;
  }

  return (
    <Card className="border-brand/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-brand/10 to-brand/5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-brand p-1.5">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base">Spaced Review</CardTitle>
          </div>
          {stats && stats.totalReviews > 0 && (
            <span className="text-xs text-text-muted">
              {stats.totalReviews} reviews completed
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Due Now Section */}
        {dueEpisodes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-medium text-text-primary">
                Due for Review
              </h3>
              <span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                {dueEpisodes.length} episode{dueEpisodes.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {dueEpisodes.slice(0, 3).map((episode) => (
                <Link
                  key={episode.id}
                  href={`/episode/${episode.id}`}
                  className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3 transition-colors hover:bg-warning/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {episode.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                      <RefreshCw className="h-3 w-3" />
                      <span>Review #{episode.reviewCount + 1}</span>
                      {episode.daysPastDue > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-warning">
                            {episode.daysPastDue} day{episode.daysPastDue !== 1 ? 's' : ''} overdue
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                </Link>
              ))}
            </div>

            {dueEpisodes.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all {dueEpisodes.length} due
              </Button>
            )}
          </div>
        )}

        {/* Upcoming Section */}
        {upcomingEpisodes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-medium text-text-primary">
                Coming Up
              </h3>
            </div>

            <div className="space-y-1">
              {upcomingEpisodes.slice(0, 3).map((episode) => (
                <div
                  key={episode.id}
                  className="flex items-center justify-between rounded-lg p-2 text-sm"
                >
                  <span className="text-text-secondary truncate flex-1">
                    {episode.title}
                  </span>
                  <span className="text-xs text-text-muted shrink-0 ml-2">
                    {episode.daysUntilDue === 1
                      ? 'Tomorrow'
                      : `In ${episode.daysUntilDue} days`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No reviews due - show motivational message */}
        {dueEpisodes.length === 0 && upcomingEpisodes.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <p className="text-sm text-success">
              All caught up! Next review in {upcomingEpisodes[0]?.daysUntilDue || 1} day
              {(upcomingEpisodes[0]?.daysUntilDue || 1) !== 1 ? 's' : ''}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for navbar or sidebar
export function ReviewBadge() {
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        setDueCount(data.stats?.dueNow || 0);
      })
      .catch(() => {
        setDueCount(null);
      });
  }, []);

  if (dueCount === null || dueCount === 0) return null;

  return (
    <Link
      href="/library"
      className="flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning hover:bg-warning/20 transition-colors"
    >
      <Brain className="h-3 w-3" />
      {dueCount} due
    </Link>
  );
}
