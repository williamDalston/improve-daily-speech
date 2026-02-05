import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withRetry, withTimeout } from '@/lib/async-utils';
import { isRetryableError } from '@/lib/ai/retry';

export const runtime = 'nodejs';

let openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

const OPENAI_TTS_MAX_FAILURES = 3;
const OPENAI_TTS_FAILURE_WINDOW_MS = 60000;
const OPENAI_TTS_COOLDOWN_MS = 120000;
const openaiTtsBreaker = { failures: 0, lastFailureAt: 0, openUntil: 0 };

function isBreakerOpen() {
  return Date.now() < openaiTtsBreaker.openUntil;
}

function recordFailure() {
  const now = Date.now();
  if (now - openaiTtsBreaker.lastFailureAt > OPENAI_TTS_FAILURE_WINDOW_MS) {
    openaiTtsBreaker.failures = 0;
  }
  openaiTtsBreaker.failures += 1;
  openaiTtsBreaker.lastFailureAt = now;
  if (openaiTtsBreaker.failures >= OPENAI_TTS_MAX_FAILURES) {
    openaiTtsBreaker.openUntil = now + OPENAI_TTS_COOLDOWN_MS;
  }
}

function recordSuccess() {
  openaiTtsBreaker.failures = 0;
  openaiTtsBreaker.lastFailureAt = 0;
  openaiTtsBreaker.openUntil = 0;
}

// POST /api/instant-host/tts - Generate TTS for instant host
// Calls OpenAI directly and streams the response — no server-side buffering.
// Always uses tts-1 (fast mode) for short conversational phrases.
export async function POST(request: NextRequest) {
  try {
    const { text, prewarm } = await request.json().catch(() => ({ text: '', prewarm: false }));

    if (!prewarm && (!text || typeof text !== 'string')) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!prewarm && !trimmed) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!prewarm && trimmed.length > 800) {
      return NextResponse.json({ error: 'Text too long' }, { status: 413 });
    }

    if (isBreakerOpen()) {
      return NextResponse.json({ error: 'TTS temporarily unavailable' }, { status: 503 });
    }

    const client = getClient();
    const inputText = prewarm ? (trimmed || 'Okay') : trimmed;
    const response = await withRetry(
      () =>
        withTimeout(
          client.audio.speech.create({
            model: 'tts-1',
            voice: 'nova',
            input: inputText,
            speed: 1.0,
            response_format: 'mp3',
          }),
          15000,
          'instant-host-tts'
        ),
      { retries: 2, shouldRetry: isRetryableError, label: 'instant-host-tts' }
    ).then((res) => {
      recordSuccess();
      return res;
    }).catch((error) => {
      recordFailure();
      throw error;
    });

    // Stream directly to client — avoids server-side buffer copy
    if (!response.body) {
      return NextResponse.json({ error: 'No audio data' }, { status: 500 });
    }

    if (prewarm) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'X-Prewarm': '1',
        },
      });
    }

    return new NextResponse(response.body as ReadableStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Instant host TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice audio' },
      { status: 500 }
    );
  }
}
