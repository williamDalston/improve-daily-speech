'use client';

import { useState } from 'react';
import { Share2, Link2, Check, Copy, Lock, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  episodeId: string;
  episodeTitle: string;
  initialShareId?: string | null;
  initialIsPublic?: boolean;
  className?: string;
}

export function ShareButton({
  episodeId,
  episodeTitle,
  initialShareId,
  initialIsPublic = false,
  className,
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [shareId, setShareId] = useState(initialShareId);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = shareId
    ? `${window.location.origin}/share/${shareId}`
    : null;

  const handleGenerateLink = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}/share`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to generate share link');

      const data = await res.json();
      setShareId(data.shareId);
      setIsPublic(data.isPublic);
    } catch (err) {
      console.error('Failed to generate share link:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    setIsLoading(true);
    try {
      if (isPublic) {
        // Make private
        const res = await fetch(`/api/episodes/${episodeId}/share`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to make private');
        setIsPublic(false);
      } else {
        // Make public (generate link if needed)
        await handleGenerateLink();
      }
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl || !navigator.share) return;
    try {
      await navigator.share({
        title: episodeTitle,
        text: `Listen to "${episodeTitle}" on MindCast`,
        url: shareUrl,
      });
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className={cn('gap-2', className)}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-brand" />
                <h2 className="font-semibold text-text-primary">Share Episode</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Episode Title */}
              <div className="rounded-lg bg-surface-secondary p-3">
                <p className="text-sm text-text-muted">Sharing:</p>
                <p className="font-medium text-text-primary truncate">{episodeTitle}</p>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="h-5 w-5 text-success" />
                  ) : (
                    <Lock className="h-5 w-5 text-text-muted" />
                  )}
                  <div>
                    <p className="font-medium text-text-primary">
                      {isPublic ? 'Public' : 'Private'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {isPublic
                        ? 'Anyone with the link can listen'
                        : 'Only you can access this episode'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePublic}
                  disabled={isLoading}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    isPublic ? 'bg-success' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Share Link */}
              {isPublic && shareUrl && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2">
                      <Link2 className="h-4 w-4 text-text-muted shrink-0" />
                      <span className="text-sm text-text-primary truncate">
                        {shareUrl}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Native Share Button (mobile) */}
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                      onClick={handleNativeShare}
                      className="w-full gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share via...
                    </Button>
                  )}
                </div>
              )}

              {/* Generate Link Button */}
              {!isPublic && (
                <Button
                  onClick={handleGenerateLink}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  Generate Share Link
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
