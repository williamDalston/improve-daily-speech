import { db } from '@/lib/db';
import { runFullPipeline, runQuickPipeline, type EpisodeLength } from '@/lib/ai/pipeline';
import { generateAudio, generatePreviewAudio, estimateAudioDuration, type OpenAIVoice } from '@/lib/ai/tts';
import { generateQuickHook } from '@/lib/ai/gemini';
import { incrementFreeUsage } from '@/lib/stripe';
import { parseSourcesFromResearch, type Source } from '@/lib/ai/sources';
import { updateStreak, XP_REWARDS } from '@/lib/streak';

type JobStatus = 'PENDING' | 'RESEARCH' | 'DRAFTING' | 'JUDGING' | 'ENHANCING' | 'AUDIO' | 'COMPLETE' | 'FAILED';
type GenerationMode = 'quick' | 'deep';
type DeviceType = 'mobile' | 'desktop';

interface Footprint {
  timestamp: string;
  action: string;
  detail: string;
}

/**
 * Add a footprint to the job's footprint log
 */
async function addFootprint(jobId: string, action: string, detail: string) {
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { footprints: true },
  });

  const existingFootprints = (job?.footprints as unknown as Footprint[]) || [];
  const newFootprint: Footprint = {
    timestamp: new Date().toISOString(),
    action,
    detail,
  };

  // Keep last 20 footprints to avoid bloat
  const updatedFootprints = [...existingFootprints, newFootprint].slice(-20);

  await db.job.update({
    where: { id: jobId },
    data: { footprints: updatedFootprints as unknown as object },
  });
}

/**
 * Update job status and progress in the database
 */
async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  progress: number,
  currentStep?: string,
  additionalData?: Record<string, unknown>
) {
  await db.job.update({
    where: { id: jobId },
    data: {
      status,
      progress,
      currentStep,
      ...(status !== 'PENDING' && !additionalData?.startedAt ? { startedAt: new Date() } : {}),
      ...additionalData,
    },
  });
}

/**
 * Map pipeline step type to job status
 */
function mapStepToStatus(stepType: string): JobStatus {
  switch (stepType) {
    case 'research':
      return 'RESEARCH';
    case 'drafts':
      return 'DRAFTING';
    case 'judge':
      return 'JUDGING';
    case 'enhancement':
    case 'critique':
      return 'ENHANCING';
    case 'audio':
      return 'AUDIO';
    default:
      return 'ENHANCING';
  }
}

/**
 * Get descriptive footprint message for enhancement stages (OPTIMIZED: now 2 stages)
 */
function getEnhancementFootprint(stageName: string): string {
  const footprints: Record<string, string> = {
    'Stage 2: Enhancement & Voice': 'Adding depth and authentic human voice...',
    'Stage 3: Audio Polish': 'Final polish for perfect audio delivery...',
  };
  return footprints[stageName] || 'Refining the script...';
}

/**
 * Calculate progress percentage based on current step
 * OPTIMIZED: Updated for 2 enhancement stages instead of 4
 */
function calculateProgress(stepType: string, stepStatus: string, stageIndex?: number): number {
  // New faster pipeline: Research(15) -> Drafts(35) -> Judge(45) -> Enhance1(60) -> Enhance2(75) -> Audio(90) -> Done(100)
  const stepWeights: Record<string, number> = {
    research: 15,
    drafts: 35,
    judge: 45,
    enhancement: 60, // Base for first enhancement
    audio: 90,
    done: 100,
  };

  let base = stepWeights[stepType] || 50;

  // For enhancement stages, add offset based on stage index
  if (stepType === 'enhancement' && stageIndex !== undefined) {
    base = 55 + (stageIndex * 15); // Stage 0 = 55, Stage 1 = 70
  }

  return stepStatus === 'done' ? base + 5 : base;
}

/**
 * Process a generation job
 * This function handles all the AI pipeline stages and stores results in the database
 * @param mode - 'quick' for faster generation (skips enhancements), 'deep' for full pipeline
 * @param deviceType - 'mobile' for faster TTS (tts-1), 'desktop' for higher quality (tts-1-hd)
 */
export async function processJob(
  jobId: string,
  userId: string,
  isPro: boolean,
  mode: GenerationMode = 'deep',
  voice: OpenAIVoice = 'nova',
  deviceType: DeviceType = 'desktop'
): Promise<void> {
  try {
    // Get job details
    const job = await db.job.findUnique({
      where: { id: jobId },
      select: { topic: true, length: true, style: true, status: true, voice: true },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Check if job was cancelled
    if (job.status === 'FAILED') {
      return;
    }

    const { topic, length, style } = job;
    // Use voice from job if stored, otherwise use parameter (backwards compat)
    const effectiveVoice = (job.voice as OpenAIVoice) || voice;
    const isQuickMode = mode === 'quick';
    const isMobile = deviceType === 'mobile';
    // Mobile always uses fast TTS for quicker time-to-first-sound
    // Desktop uses high-quality TTS unless in quick mode
    const useFastTTS = isMobile || isQuickMode;

    // Start processing
    await updateJobStatus(jobId, 'RESEARCH', 5, 'Starting...', { startedAt: new Date() });
    await addFootprint(jobId, 'Starting', `Beginning research on "${topic.slice(0, 50)}..."`);

    // 1. Generate quick hook (instant feedback)
    try {
      await addFootprint(jobId, 'Quick Preview', 'Generating an engaging hook to preview your episode...');
      const quickHook = await generateQuickHook(topic);
      await db.job.update({
        where: { id: jobId },
        data: { quickHook: quickHook as object },
      });
      await addFootprint(jobId, 'Hook Ready', 'Created a compelling preview while we research deeper...');
    } catch (e) {
      // Non-critical, continue without hook
      console.log('Quick hook failed:', e);
    }

    // Check for cancellation
    const checkCancelled = async (): Promise<boolean> => {
      const currentJob = await db.job.findUnique({
        where: { id: jobId },
        select: { status: true },
      });
      return currentJob?.status === 'FAILED';
    };

    // 2. Run AI pipeline (quick or deep)
    let finalText = '';
    let lastEnhancementStage = '';
    let parsedSources: Source[] = [];

    // Choose pipeline based on mode
    const pipeline = isQuickMode
      ? runQuickPipeline(topic, length as EpisodeLength, style || undefined)
      : runFullPipeline(topic, length as EpisodeLength, style || undefined);

    if (isQuickMode) {
      await addFootprint(jobId, 'Quick Mode', 'Using faster generation - good quality, fewer refinements');
    }

    for await (const step of pipeline) {
      // Check for cancellation between steps
      if (await checkCancelled()) {
        return;
      }

      const status = mapStepToStatus(step.type);
      const stepStatus = step.type === 'done' ? 'done' : step.status;
      const stageIndex = 'stageIndex' in step ? step.stageIndex : undefined;
      const progress = calculateProgress(step.type, stepStatus, stageIndex);
      const currentStep = ('stageName' in step ? step.stageName : undefined) || step.type;

      await updateJobStatus(jobId, status, progress, currentStep);

      // Store intermediate results with footprints
      if (step.type === 'research' && step.status === 'running') {
        await addFootprint(jobId, 'Researching', 'Gathering facts, studies, and key milestones...');
      }

      if (step.type === 'research' && step.status === 'done') {
        const researchText = step.research || '';
        // Extract sources from research
        parsedSources = parseSourcesFromResearch(researchText);

        await db.job.update({
          where: { id: jobId },
          data: {
            research: researchText,
            ...(parsedSources.length > 0 ? { sources: parsedSources as unknown as object } : {}),
          },
        });
        await addFootprint(jobId, 'Research Complete', `Found ${parsedSources.length} sources and key insights`);
      }

      if (step.type === 'drafts' && step.status === 'running') {
        await addFootprint(jobId, 'Drafting', 'Two AI models are writing competing scripts...');
      }

      if (step.type === 'drafts' && step.status === 'done') {
        await db.job.update({
          where: { id: jobId },
          data: {
            draftA: step.draftA || '',
            draftB: step.draftB || '',
          },
        });
        await addFootprint(jobId, 'Drafts Ready', 'Claude and GPT-4 have each written a version');
      }

      if (step.type === 'judge' && step.status === 'running') {
        await addFootprint(jobId, 'Judging', 'Evaluating both drafts for depth and engagement...');
      }

      if (step.type === 'judge' && step.status === 'done') {
        await db.job.update({
          where: { id: jobId },
          data: { selectedDraft: step.winner || '' },
        });
        await addFootprint(jobId, 'Winner Selected', `${step.winner}'s version chosen as the stronger narrative`);

        // Generate preview audio EARLY from winning draft (user can listen while we enhance)
        if (step.winnerText) {
          try {
            await addFootprint(jobId, 'Quick Preview', 'Creating audio preview so you can listen while we polish...');
            // Use fast TTS for mobile to minimize time-to-first-sound
            const previewBuffer = await generatePreviewAudio(step.winnerText, { voice: effectiveVoice, fastMode: useFastTTS });
            const previewBase64 = previewBuffer.toString('base64');
            await db.job.update({
              where: { id: jobId },
              data: { previewAudio: previewBase64 },
            });
            await addFootprint(jobId, 'Preview Ready', 'Preview audio ready - listen now while we refine the script!');
          } catch (e) {
            // Non-critical, continue without early preview
            console.log('Early preview generation failed:', e);
          }
        }
      }

      if (step.type === 'enhancement' && step.status === 'running') {
        const stageName = step.stageName || 'Enhancing';
        await addFootprint(jobId, stageName, getEnhancementFootprint(step.stageName || ''));
      }

      if (step.type === 'enhancement' && step.status === 'done') {
        lastEnhancementStage = step.stageName || '';
        await db.job.update({
          where: { id: jobId },
          data: { enhanced: step.enhancedText || '' },
        });
      }

      if (step.type === 'done') {
        finalText = step.finalText;
        await db.job.update({
          where: { id: jobId },
          data: { finalScript: finalText },
        });
        await addFootprint(jobId, 'Script Complete', 'Final script polished and ready for voice');
      }
    }

    if (!finalText) {
      throw new Error('Pipeline completed without final text');
    }

    // Check for cancellation before audio
    if (await checkCancelled()) {
      return;
    }

    // 3. Update preview audio with enhanced version (skip in quick mode and on mobile for speed)
    if (!isQuickMode && !isMobile) {
      await updateJobStatus(jobId, 'AUDIO', 85, 'Upgrading preview audio...');
      await addFootprint(jobId, 'Audio Upgrade', 'Upgrading preview with polished script...');
      const previewBuffer = await generatePreviewAudio(finalText, { voice: effectiveVoice, fastMode: false });
      const previewBase64 = previewBuffer.toString('base64');

      await db.job.update({
        where: { id: jobId },
        data: { previewAudio: previewBase64 },
      });
      await addFootprint(jobId, 'Preview Upgraded', 'Preview audio upgraded with final polished script!');

      // Check for cancellation
      if (await checkCancelled()) {
        return;
      }
    }

    // 4. Generate full audio (use fast TTS for mobile or quick mode, parallel for desktop)
    await updateJobStatus(jobId, 'AUDIO', useFastTTS ? 70 : 92, 'Generating full audio...');
    await addFootprint(jobId, 'Full Audio', useFastTTS
      ? 'Generating audio with fast TTS...'
      : 'Generating complete high-quality audio...');
    // Desktop uses parallel chunk processing for faster generation
    // Mobile uses sequential for lower memory usage
    const audioBuffer = await generateAudio(finalText, {
      fastMode: useFastTTS,
      voice: effectiveVoice,
      parallelChunks: !isMobile, // Parallel for desktop, sequential for mobile
    });
    const audioBase64 = audioBuffer.toString('base64');
    const audioDuration = estimateAudioDuration(finalText);
    await addFootprint(jobId, 'Episode Complete', `Your ${Math.round(audioDuration / 60)}-minute episode is ready!`);

    // 5. Create episode record
    const episode = await db.episode.create({
      data: {
        userId,
        topic,
        length,
        title: topic, // Could use AI to generate a better title
        transcript: finalText,
        status: 'READY',
        wordCount: finalText.split(/\s+/).length,
        audioDurationSecs: audioDuration,
        voice: effectiveVoice, // Store the TTS voice used
        ...(parsedSources.length > 0 ? { sources: parsedSources as unknown as object } : {}),
        // In production: audioUrl: uploadedUrl (S3/R2)
      },
    });

    // 6. Update job as complete
    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETE',
        progress: 100,
        currentStep: 'Complete',
        fullAudio: audioBase64,
        episodeId: episode.id,
        completedAt: new Date(),
      },
    });

    // 7. Increment free usage if not pro
    if (!isPro) {
      await incrementFreeUsage(userId);
    }

    // 8. Update streak and XP for habit formation
    try {
      await updateStreak(userId, XP_REWARDS.EPISODE_CREATED);
    } catch (e) {
      // Non-critical, don't fail the job
      console.log('Streak update failed:', e);
    }
  } catch (error) {
    console.error('Job processing error:', error);

    // Mark job as failed
    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
  }
}
