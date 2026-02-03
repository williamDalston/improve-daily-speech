import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canCreateEpisode, incrementFreeUsage } from '@/lib/stripe';
import { runFullPipeline, type EpisodeLength } from '@/lib/ai/pipeline';
import { generateAudio, generatePreviewAudio, estimateAudioDuration } from '@/lib/ai/tts';
import { generateQuickHook } from '@/lib/ai/gemini';

export const maxDuration = 300; // 5 minutes max for Vercel

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { topic, length = '10 min' } = await request.json();

  if (!topic || typeof topic !== 'string') {
    return new Response(JSON.stringify({ error: 'Topic is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if user can create episode
  const access = await canCreateEpisode(session.user.id);
  if (!access.allowed) {
    return new Response(
      JSON.stringify({ error: access.reason, needsUpgrade: true }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create episode record
  const episode = await db.episode.create({
    data: {
      userId: session.user.id,
      topic,
      length,
      status: 'PROCESSING',
    },
  });

  // Stream progress updates using Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        let finalText = '';

        // INSTANT: Generate quick hook with Gemini (~1-2 sec)
        // This gives the user something to read while the full pipeline runs
        try {
          const quickHook = await generateQuickHook(topic);
          sendEvent({ quickHook });
        } catch (e) {
          // Non-critical, continue without hook
          console.log('Quick hook failed:', e);
        }

        // Run full pipeline (this takes a while)
        for await (const step of runFullPipeline(topic, length as EpisodeLength)) {
          sendEvent({ step });

          if (step.type === 'done') {
            finalText = step.finalText;
          }
        }

        // Generate preview audio first (fast, ~30 sec)
        sendEvent({ step: { type: 'audio', status: 'running', message: 'Generating preview...' } });
        const previewBuffer = await generatePreviewAudio(finalText);
        const previewBase64 = previewBuffer.toString('base64');

        // Send preview immediately so user can start listening
        sendEvent({
          step: { type: 'preview', status: 'done' },
          preview: {
            audio: `data:audio/mp3;base64,${previewBase64}`,
          },
        });

        // Now generate full audio in background
        sendEvent({ step: { type: 'audio', status: 'running', message: 'Generating full audio...' } });
        const audioBuffer = await generateAudio(finalText);
        const audioDuration = estimateAudioDuration(finalText);

        // Store audio (in production, upload to S3/R2)
        const audioBase64 = audioBuffer.toString('base64');

        // Update episode
        await db.episode.update({
          where: { id: episode.id },
          data: {
            transcript: finalText,
            title: topic, // Could use AI to generate a title
            status: 'READY',
            wordCount: finalText.split(/\s+/).length,
            audioDurationSecs: audioDuration,
            // In production: audioUrl: uploadedUrl
          },
        });

        // Increment free usage if not pro
        if (!session.user.isPro) {
          await incrementFreeUsage(session.user.id);
        }

        sendEvent({
          step: { type: 'audio', status: 'done' },
          complete: true,
          episode: {
            id: episode.id,
            audio: `data:audio/mp3;base64,${audioBase64}`,
            transcript: finalText,
            duration: audioDuration,
          },
        });
      } catch (error) {
        console.error('Pipeline error:', error);
        await db.episode.update({
          where: { id: episode.id },
          data: { status: 'ERROR' },
        });
        sendEvent({
          error: error instanceof Error ? error.message : 'Pipeline failed',
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
