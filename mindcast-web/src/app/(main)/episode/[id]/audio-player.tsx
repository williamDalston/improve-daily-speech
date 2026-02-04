'use client';

import { useState, useCallback } from 'react';
import { AudioPlayer } from '@/components/audio-player';
import { LearningLoop } from '@/components/learning-loop';
import { AskWhileListening } from '@/components/ask-while-listening';

interface EpisodeAudioPlayerProps {
  episodeId: string;
  episodeTitle: string;
}

export function EpisodeAudioPlayer({ episodeId, episodeTitle }: EpisodeAudioPlayerProps) {
  const audioUrl = `/api/episodes/${episodeId}/audio`;
  const [showLearningLoop, setShowLearningLoop] = useState(false);
  const [learningLoopDismissed, setLearningLoopDismissed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handleAudioEnded = () => {
    // Show learning loop when audio finishes (if not already dismissed)
    if (!learningLoopDismissed) {
      setShowLearningLoop(true);
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

  return (
    <div className="space-y-4">
      <AudioPlayer
        src={audioUrl}
        title={episodeTitle}
        onEnded={handleAudioEnded}
        onTimeUpdate={handleTimeUpdate}
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
