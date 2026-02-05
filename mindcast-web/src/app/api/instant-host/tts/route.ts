import { NextRequest, NextResponse } from 'next/server';
import { generateAudio } from '@/lib/ai/tts';

export const runtime = 'nodejs';

// POST /api/instant-host/tts - Generate TTS for instant host
// Always uses tts-1 (fast mode) — instant host is short conversational phrases
// where speed matters more than HD quality. HD is reserved for final episode audio.
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

    // Always use fast TTS (tts-1) for instant host — ~2x faster than tts-1-hd
    // Quality difference is negligible for short conversational phrases (35-55 words)
    const audioBuffer = await generateAudio(trimmed, {
      provider: 'openai',
      voice: 'nova',
      speed: 1.0,
      fastMode: true,
    });

    return new NextResponse(new Uint8Array(audioBuffer), {
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
