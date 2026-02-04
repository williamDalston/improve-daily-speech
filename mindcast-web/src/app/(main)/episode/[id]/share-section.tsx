'use client';

import { ShareButton } from '@/components/share-audiogram';

interface ShareSectionProps {
  episodeId: string;
  episodeTitle: string;
  transcript?: string;
  shareId?: string | null;
  isPublic?: boolean;
}

export function ShareSection({ episodeId, episodeTitle, transcript, shareId, isPublic }: ShareSectionProps) {
  // In production, this would fetch the audio URL from the API/storage
  const audioUrl = `/api/episodes/${episodeId}/audio`;

  return (
    <ShareButton
      episodeId={episodeId}
      episodeTitle={episodeTitle}
      audioSrc={audioUrl}
      transcript={transcript || ''}
      shareId={shareId}
      isPublic={isPublic}
    />
  );
}
