/**
 * Canon Protocol — Remaster Processor
 *
 * Processes QUEUED CanonJobs: runs the remaster pipeline, generates
 * TTS audio, creates the canon episode, and updates the Topic.
 */

import { db } from '@/lib/db';
import { runCanonRemaster, type EpisodeLength } from '@/lib/ai/pipeline';
import { generateAudio, estimateAudioDuration } from '@/lib/ai/tts';
import { uploadAudio } from '@/lib/storage';
import { withTimeout } from '@/lib/async-utils';
import { estimateEpisodeCost } from '@/lib/agents/cost-controller';

const MAX_REMASTER_ATTEMPTS = 2; // Quality gate retry limit

/**
 * Process a single CanonJob: remaster → TTS → create canon episode.
 */
export async function processCanonJob(canonJobId: string): Promise<void> {
  // Mark as running
  await db.canonJob.update({
    where: { id: canonJobId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  try {
    // Fetch job context
    const canonJob = await db.canonJob.findUnique({
      where: { id: canonJobId },
      select: {
        topicId: true,
        episodeId: true,
        topic: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    if (!canonJob || !canonJob.topic) {
      throw new Error('CanonJob or Topic not found');
    }

    // Get seed transcript from the interim canon episode (if any)
    let seedTranscript = '';
    let seedLength: EpisodeLength = '10 min';
    if (canonJob.episodeId) {
      const seedEpisode = await db.episode.findUnique({
        where: { id: canonJob.episodeId },
        select: { transcript: true, length: true },
      });
      seedTranscript = seedEpisode?.transcript || '';
      seedLength = (seedEpisode?.length as EpisodeLength) || '10 min';
    }

    // If no seed transcript, get the best episode for this topic
    if (!seedTranscript) {
      const bestEpisode = await db.episode.findFirst({
        where: { topicId: canonJob.topicId, status: 'READY' },
        orderBy: { createdAt: 'desc' },
        select: { transcript: true, length: true },
      });
      seedTranscript = bestEpisode?.transcript || '';
      seedLength = (bestEpisode?.length as EpisodeLength) || '10 min';
    }

    if (!seedTranscript) {
      throw new Error('No seed transcript available for remaster');
    }

    // Run the remaster pipeline (with quality gate retry)
    let finalResult;
    for (let attempt = 0; attempt < MAX_REMASTER_ATTEMPTS; attempt++) {
      console.log(`[Canon] Remaster attempt ${attempt + 1} for topic: ${canonJob.topic.title}`);

      finalResult = await runCanonRemaster(
        canonJob.topic.title,
        seedTranscript,
        seedLength
      );

      if (finalResult.qualityGate.pass) {
        console.log(`[Canon] Quality gate PASSED (avg: ${finalResult.qualityGate.average.toFixed(1)})`);
        break;
      }

      console.log(
        `[Canon] Quality gate FAILED (avg: ${finalResult.qualityGate.average.toFixed(1)}, ` +
        `weakest: ${finalResult.qualityGate.weakest}). ` +
        (attempt < MAX_REMASTER_ATTEMPTS - 1 ? 'Retrying...' : 'Using best attempt.')
      );
    }

    if (!finalResult) {
      throw new Error('Remaster produced no output');
    }

    const finalText = finalResult.finalText;

    // Generate TTS audio (high quality for canon)
    const audioBuffer = await generateAudio(finalText, {
      fastMode: false,
      voice: 'nova',
      parallelChunks: true,
    });

    const audioDuration = estimateAudioDuration(finalText);

    // Upload to blob storage
    const topicSlug = canonJob.topic.slug;
    let audioUrl: string | null = null;
    try {
      audioUrl = await withTimeout(
        uploadAudio(audioBuffer, `canon/${topicSlug}.mp3`),
        30000,
        'canon-audio-upload'
      );
    } catch (e) {
      console.warn('[Canon] Audio upload failed:', e);
    }

    // Calculate cost
    const lengthMinutes = audioDuration / 60;
    let costCents: number | undefined;
    try {
      const costBreakdown = estimateEpisodeCost({ lengthMinutes });
      costCents = Math.round(costBreakdown.total * 100);
    } catch (e) {
      console.warn('[Canon] Cost estimation failed:', e);
    }

    // Create the canon episode
    const canonEpisode = await db.episode.create({
      data: {
        userId: 'system', // Canon episodes are system-owned
        topic: canonJob.topic.title,
        title: canonJob.topic.title,
        length: seedLength,
        transcript: finalText,
        audioUrl,
        audioDurationSecs: audioDuration,
        voice: 'nova',
        wordCount: finalText.split(/\s+/).length,
        status: 'READY',
        isCanon: true,
        topicId: canonJob.topicId,
      },
    });

    // Unmark the old canon episode (if different)
    const currentTopic = await db.topic.findUnique({
      where: { id: canonJob.topicId },
      select: { canonEpisodeId: true },
    });

    if (currentTopic?.canonEpisodeId && currentTopic.canonEpisodeId !== canonEpisode.id) {
      await db.episode.update({
        where: { id: currentTopic.canonEpisodeId },
        data: { isCanon: false },
      }).catch(() => {
        // Old episode might be deleted
      });
    }

    // Update topic with the new canon episode
    await db.topic.update({
      where: { id: canonJob.topicId },
      data: { canonEpisodeId: canonEpisode.id },
    });

    // Mark job as succeeded
    await db.canonJob.update({
      where: { id: canonJobId },
      data: {
        status: 'SUCCEEDED',
        completedAt: new Date(),
        episodeId: canonEpisode.id,
        ...(costCents !== undefined ? { costCents } : {}),
      },
    });

    console.log(`[Canon] Remaster complete for "${canonJob.topic.title}" → episode ${canonEpisode.id}`);
  } catch (error) {
    console.error(`[Canon] Remaster failed for job ${canonJobId}:`, error);

    await db.canonJob.update({
      where: { id: canonJobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Process all QUEUED CanonJobs (batch runner for cron).
 * Processes one at a time to avoid overwhelming AI APIs.
 */
export async function processQueuedCanonJobs(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const queuedJobs = await db.canonJob.findMany({
    where: { status: 'QUEUED' },
    orderBy: { createdAt: 'asc' },
    take: 5, // Process up to 5 per batch
    select: { id: true },
  });

  const result = { processed: 0, succeeded: 0, failed: 0 };

  for (const job of queuedJobs) {
    result.processed++;
    try {
      await processCanonJob(job.id);

      // Check if it succeeded
      const updated = await db.canonJob.findUnique({
        where: { id: job.id },
        select: { status: true },
      });
      if (updated?.status === 'SUCCEEDED') {
        result.succeeded++;
      } else {
        result.failed++;
      }
    } catch (e) {
      result.failed++;
      console.error(`[Canon] Unexpected error processing job ${job.id}:`, e);
    }
  }

  console.log(`[Canon] Batch: ${result.processed} processed, ${result.succeeded} succeeded, ${result.failed} failed`);
  return result;
}
