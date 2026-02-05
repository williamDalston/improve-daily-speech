import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

let openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

// POST /api/instant-host/tts - Generate TTS for instant host
// Calls OpenAI directly and streams the response — no server-side buffering.
// Always uses tts-1 (fast mode) for short conversational phrases.
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (trimmed.length > 800) {
      return NextResponse.json({ error: 'Text too long' }, { status: 413 });
    }

    const client = getClient();
    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: trimmed,
      speed: 1.0,
      response_format: 'mp3',
    });

    // Stream directly to client — avoids server-side buffer copy
    if (!response.body) {
      return NextResponse.json({ error: 'No audio data' }, { status: 500 });
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
