import { NextRequest, NextResponse } from 'next/server';
import { generateAudio } from '@/lib/ai/tts';

export const runtime = 'nodejs';

// POST /api/instant-host/tts - Generate premium-quality TTS for instant host
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

    // Use ElevenLabs for the most natural, human-like voice
    // Rachel voice: warm, engaging - perfect for conversational host
    const audioBuffer = await generateAudio(trimmed, {
      provider: 'elevenlabs',
      voice: 'rachel',
      stability: 0.5,        // Balanced stability
      similarityBoost: 0.75, // Natural variation
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
