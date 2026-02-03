'use client';

import { AudioPlayer } from '@/components/audio-player';

interface EpisodeAudioPlayerProps {
  episodeId: string;
}

export function EpisodeAudioPlayer({ episodeId }: EpisodeAudioPlayerProps) {
  // In production, this would fetch the audio URL from the API/storage
  // For now, we'll use a placeholder
  const audioUrl = `/api/audio/${episodeId}`;

  return (
    <AudioPlayer
      src={audioUrl}
      className="sticky top-20"
    />
  );
}
