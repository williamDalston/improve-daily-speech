'use client';

import * as React from 'react';
import {
  Share2,
  Download,
  Play,
  Pause,
  Copy,
  Check,
  Twitter,
  Instagram,
  Link2,
  Scissors,
  Sparkles,
  Globe,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn, formatDuration } from '@/lib/utils';

interface ShareAudiogramProps {
  audioSrc: string;
  transcript: string;
  episodeTitle: string;
  episodeId: string;
  initialShareId?: string | null;
  initialIsPublic?: boolean;
  className?: string;
  onClose?: () => void;
}

// Waveform visualization bars
function WaveformVisualizer({ isPlaying, className }: { isPlaying: boolean; className?: string }) {
  const bars = Array.from({ length: 32 }, (_, i) => i);

  return (
    <div className={cn('flex items-end justify-center gap-[2px] h-16', className)}>
      {bars.map((i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full bg-gradient-to-t from-brand to-brand-light transition-all',
            isPlaying ? 'animate-wave' : 'h-2'
          )}
          style={{
            animationDelay: isPlaying ? `${i * 0.05}s` : '0s',
            height: isPlaying ? undefined : `${8 + Math.random() * 24}px`,
          }}
        />
      ))}
    </div>
  );
}

// Style presets for the audiogram card
const CARD_STYLES = [
  {
    id: 'neon',
    name: 'Neon',
    bg: 'bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#0f0f23]',
    text: 'text-white',
    accent: 'text-cyan-400',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bg: 'bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600',
    text: 'text-white',
    accent: 'text-yellow-200',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'text-brand',
  },
  {
    id: 'dark',
    name: 'Dark',
    bg: 'bg-gray-900',
    text: 'text-white',
    accent: 'text-brand',
  },
];

export function ShareAudiogramModal({
  audioSrc,
  transcript,
  episodeTitle,
  episodeId,
  initialShareId,
  initialIsPublic = false,
  className,
  onClose,
}: ShareAudiogramProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [clipStart, setClipStart] = React.useState(0);
  const [clipEnd, setClipEnd] = React.useState(30);
  const [selectedStyle, setSelectedStyle] = React.useState(CARD_STYLES[0]);
  const [copied, setCopied] = React.useState(false);
  const [publicLinkCopied, setPublicLinkCopied] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [shareId, setShareId] = React.useState<string | null>(initialShareId || null);
  const [isPublic, setIsPublic] = React.useState(initialIsPublic);
  const [isTogglingPublic, setIsTogglingPublic] = React.useState(false);

  // Max clip length is 30 seconds (optimal for social sharing)
  const MAX_CLIP_LENGTH = 30;

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setClipEnd(Math.min(30, audio.duration));
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime >= clipEnd) {
        audio.pause();
        audio.currentTime = clipStart;
        setIsPlaying(false);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [clipStart, clipEnd]);

  const togglePlayPreview = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.currentTime = clipStart;
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRangeChange = (values: number[]) => {
    const [start, end] = values;
    // Ensure minimum 5 second clip and maximum 30 second clip
    const clampedEnd = Math.min(end, start + MAX_CLIP_LENGTH);
    const clampedStart = Math.max(start, clampedEnd - MAX_CLIP_LENGTH);
    setClipStart(clampedStart);
    setClipEnd(clampedEnd);
  };

  const shareUrl = `${window.location.origin}/e/${episodeId}?t=${Math.floor(clipStart)}`;

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Web Share API for native mobile sharing
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: episodeTitle,
          text: `Listen to "${episodeTitle}" on MindCast - AI-powered learning podcasts`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        if ((err as Error).name !== 'AbortError') {
          copyShareLink();
        }
      }
    } else {
      copyShareLink();
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const shareToTwitter = () => {
    const text = `🎧 Just listened to "${episodeTitle}" on MindCast - AI-powered learning podcasts\n\n`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const generateAudiogram = async () => {
    setIsGenerating(true);
    // In production, this would call an API to generate the video
    // For now, we'll just simulate the process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    // Download would happen here
  };

  const togglePublicLink = async () => {
    setIsTogglingPublic(true);
    try {
      if (isPublic && shareId) {
        // Make private
        const res = await fetch(`/api/episodes/${episodeId}/share`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setIsPublic(false);
          setShareId(null);
        }
      } else {
        // Make public
        const res = await fetch(`/api/episodes/${episodeId}/share`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          setShareId(data.shareId);
          setIsPublic(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle public link:', error);
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const publicShareUrl = shareId ? `${window.location.origin}/share/${shareId}` : null;

  const copyPublicLink = async () => {
    if (publicShareUrl) {
      await navigator.clipboard.writeText(publicShareUrl);
      setPublicLinkCopied(true);
      setTimeout(() => setPublicLinkCopied(false), 2000);
    }
  };

  const clipDuration = clipEnd - clipStart;
  const style = selectedStyle;

  // Extract a snippet from the transcript for the clip
  const getClipText = () => {
    // Simple extraction - in production, would use timestamps
    const words = transcript.split(' ');
    const startWord = Math.floor((clipStart / duration) * words.length);
    const endWord = Math.floor((clipEnd / duration) * words.length);
    return words.slice(startWord, Math.min(endWord, startWord + 30)).join(' ') + '...';
  };

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4', className)}>
      <div className="w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <Share2 className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Create Audiogram</h2>
              <p className="text-sm text-text-muted">Share a clip on social media</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-surface-tertiary transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <audio ref={audioRef} src={audioSrc} preload="metadata" />

          {/* Preview Card */}
          <div
            className={cn(
              'relative rounded-xl p-6 overflow-hidden',
              style.bg
            )}
          >
            {/* Brand watermark */}
            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-80">
              <Sparkles className={cn('h-4 w-4', style.accent)} />
              <span className={cn('text-xs font-medium', style.text)}>MindCast</span>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center text-center pt-4">
              <WaveformVisualizer isPlaying={isPlaying} />

              <h3 className={cn('mt-4 text-lg font-semibold line-clamp-2', style.text)}>
                {episodeTitle}
              </h3>

              <p className={cn('mt-2 text-sm opacity-80 line-clamp-3 max-w-md', style.text)}>
                "{getClipText()}"
              </p>

              <div className={cn('mt-4 text-xs opacity-60', style.text)}>
                {formatDuration(clipDuration)} clip
              </div>
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Style</label>
            <div className="flex gap-2">
              {CARD_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s)}
                  className={cn(
                    'h-10 flex-1 rounded-lg border-2 transition-all',
                    s.bg,
                    selectedStyle.id === s.id
                      ? 'border-brand ring-2 ring-brand/20'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                >
                  <span className={cn('text-xs font-medium', s.text)}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clip Range Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Select Clip ({formatDuration(clipDuration)})
              </label>
              <span className="text-xs text-text-muted">Max {MAX_CLIP_LENGTH}s</span>
            </div>

            <div className="space-y-2">
              <Slider
                value={[clipStart, clipEnd]}
                max={duration}
                step={1}
                onValueChange={handleRangeChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>{formatDuration(clipStart)}</span>
                <span>{formatDuration(clipEnd)}</span>
              </div>
            </div>

            {/* Preview playback */}
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPreview}
              className="w-full"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Preview Clip
                </>
              )}
            </Button>
          </div>

          {/* Share Actions */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary">Share</label>

            {/* Native Share Button - prominent on mobile */}
            {canNativeShare && (
              <Button
                onClick={nativeShare}
                className="w-full flex items-center justify-center gap-2 mb-3"
              >
                <Share2 className="h-4 w-4" />
                Share Episode
              </Button>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button
                variant="outline"
                onClick={copyShareLink}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={shareToTwitter}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>

              <Button
                variant="outline"
                disabled
                className="flex items-center gap-2"
                title="Coming soon"
              >
                <Instagram className="h-4 w-4" />
                Story
              </Button>

              <Button
                onClick={generateAudiogram}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isGenerating ? 'Creating...' : 'Download'}
              </Button>
            </div>
          </div>

          {/* Public Link Section */}
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public Link
              </label>
              <span className="text-xs text-text-muted">Anyone with the link can listen</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={isPublic ? 'default' : 'outline'}
                onClick={togglePublicLink}
                disabled={isTogglingPublic}
                className="flex items-center gap-2"
              >
                {isTogglingPublic ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isPublic ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {isTogglingPublic ? 'Updating...' : isPublic ? 'Make Private' : 'Generate Public Link'}
              </Button>

              {isPublic && publicShareUrl && (
                <Button
                  variant="outline"
                  onClick={copyPublicLink}
                  className="flex items-center gap-2 flex-1"
                >
                  {publicLinkCopied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Public Link
                    </>
                  )}
                </Button>
              )}
            </div>

            {isPublic && publicShareUrl && (
              <div className="rounded-lg bg-surface-secondary p-3">
                <code className="text-xs text-text-muted break-all">{publicShareUrl}</code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add keyframes for wave animation */}
      <style jsx global>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: ${24 + Math.random() * 32}px; }
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Simple share button that opens the audiogram modal
export function ShareButton({
  episodeId,
  episodeTitle,
  audioSrc,
  transcript,
  shareId,
  isPublic,
  className,
}: {
  episodeId: string;
  episodeTitle: string;
  audioSrc: string;
  transcript: string;
  shareId?: string | null;
  isPublic?: boolean;
  className?: string;
}) {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowModal(true)}
        className={cn('flex items-center gap-2', className)}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {showModal && (
        <ShareAudiogramModal
          episodeId={episodeId}
          episodeTitle={episodeTitle}
          audioSrc={audioSrc}
          transcript={transcript}
          initialShareId={shareId}
          initialIsPublic={isPublic}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
