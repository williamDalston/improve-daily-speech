import { NextRequest, NextResponse } from 'next/server';
import { generateAudio } from '@/lib/ai/tts';

export const runtime = 'nodejs';

// POST /api/instant-host/tts - Generate TTS for instant host
// Uses fast mode for mobile devices for quicker time-to-first-sound
export async function POST(request: NextRequest) {
  try {
    const { text, deviceType = 'desktop' } = await request.json();

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

    // Use fast TTS for mobile (tts-1) for quicker response
    // Desktop gets high-quality (tts-1-hd)
    const isMobile = deviceType === 'mobile';

    // Use OpenAI TTS - cost-effective with good quality
    // Nova voice: warm female, similar to ElevenLabs Rachel
    const audioBuffer = await generateAudio(trimmed, {
      provider: 'openai',
      voice: 'nova',
      speed: 1.0,
      fastMode: isMobile, // Mobile gets fast TTS for quicker response
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
