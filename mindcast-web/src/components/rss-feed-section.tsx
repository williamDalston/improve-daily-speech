'use client';

import { useState } from 'react';
import { Rss, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RssFeedSectionProps {
  feedUrl: string;
}

export function RssFeedSection({ feedUrl }: RssFeedSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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

          <p className="text-body-xs text-text-tertiary mt-3">
            New episodes will automatically appear in your podcast app when you create them.
          </p>
        </div>
      </div>
    </div>
  );
}
