'use client';

import { ShareButton } from '@/components/share-audiogram';

interface ShareSectionProps {
  episodeId: string;
  episodeTitle: string;
  transcript?: string;
}

export function ShareSection({ episodeId, episodeTitle, transcript }: ShareSectionProps) {
  // In production, this would fetch the audio URL from the API/storage
  const audioUrl = `/api/episodes/${episodeId}/audio`;

  return (
    <ShareButton
      episodeId={episodeId}
      episodeTitle={episodeTitle}
      audioSrc={audioUrl}
      transcript={transcript || ''}
    />
  );
}
