'use client';

import { useState, useEffect } from 'react';
import { Rss, Copy, Check, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RssFeedSection() {
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchFeedUrl();
  }, []);

  const fetchFeedUrl = async () => {
    try {
      const res = await fetch('/api/user/feed-token');
      if (res.ok) {
        const data = await res.json();
        setFeedUrl(data.feedUrl);
      }
    } catch (err) {
      console.error('Failed to fetch feed URL:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/user/feed-token', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFeedUrl(data.feedUrl);
      }
    } catch (err) {
      console.error('Failed to regenerate feed URL:', err);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-secondary p-4 sm:p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!feedUrl) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-brand/10 p-2.5">
          <Rss className="h-5 w-5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-heading-sm text-text-primary mb-1">
            Subscribe in Any Podcast App
          </h3>
          <p className="text-body-sm text-text-secondary mb-4">
            Add your personal feed to Apple Podcasts, Spotify, Pocket Casts, or any podcast app to listen on the go.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 rounded-lg bg-surface-primary border border-border px-3 py-2">
              <code className="text-body-sm text-text-secondary truncate flex-1">
                {feedUrl}
              </code>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="flex-1 sm:flex-none"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </>
                )}
              </Button>
              <a
                href={feedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-body-xs text-text-tertiary">
              This is your private feed URL. New episodes appear automatically.
            </p>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-body-xs text-text-muted hover:text-text-secondary flex items-center gap-1"
              title="Generate new URL (invalidates old one)"
            >
              <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
