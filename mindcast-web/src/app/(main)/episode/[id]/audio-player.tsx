'use client';

import { useState, useCallback, useRef } from 'react';
import { AudioPlayer } from '@/components/audio-player';
import { LearningLoop } from '@/components/learning-loop';
import { AskWhileListening } from '@/components/ask-while-listening';

// Fire-and-forget signal update — non-blocking, no error surfacing
function sendSignal(episodeId: string, data: Record<string, unknown>) {
  fetch(`/api/episodes/${episodeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}

interface EpisodeAudioPlayerProps {
  episodeId: string;
  episodeTitle: string;
}

export function EpisodeAudioPlayer({ episodeId, episodeTitle }: EpisodeAudioPlayerProps) {
  const audioUrl = `/api/episodes/${episodeId}/audio`;
  const [showLearningLoop, setShowLearningLoop] = useState(false);
  const [learningLoopDismissed, setLearningLoopDismissed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const completionSent = useRef(false);

  const handleAudioEnded = () => {
    // Show learning loop when audio finishes (if not already dismissed)
    if (!learningLoopDismissed) {
      setShowLearningLoop(true);
    }

    // Track completion signal for Canon scoring (once per session)
    if (!completionSent.current) {
      completionSent.current = true;
      sendSignal(episodeId, { completionPct: 1.0 });
    }
  };

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleLearningLoopComplete = () => {
    setShowLearningLoop(false);
  };

  const handleLearningLoopDismiss = () => {
    setShowLearningLoop(false);
    setLearningLoopDismissed(true);
  };

  const handleReplay = useCallback(() => {
    // If we already tracked a completion, this is a replay
    if (completionSent.current) {
      sendSignal(episodeId, { replayed: true });
    }
  }, [episodeId]);

  return (
    <div className="space-y-4">
      <AudioPlayer
        src={audioUrl}
        title={episodeTitle}
        onEnded={handleAudioEnded}
        onTimeUpdate={handleTimeUpdate}
        onReplay={handleReplay}
        className="sticky top-20 z-10"
      />

      {/* Ask While Listening */}
      <div className="flex justify-end">
        <AskWhileListening
          episodeId={episodeId}
          currentTime={currentTime}
        />
      </div>

      {/* Post-Listen Learning Loop */}
      {showLearningLoop && (
        <LearningLoop
          episodeId={episodeId}
          episodeTitle={episodeTitle}
          onComplete={handleLearningLoopComplete}
          onDismiss={handleLearningLoopDismiss}
        />
      )}
    </div>
  );
}
