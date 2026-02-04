import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Voice preview samples - short, engaging phrases that showcase each voice's character
const VOICE_SAMPLES: Record<string, string> = {
  nova: "Welcome to your learning journey. I'm Nova, and I'll be your guide through fascinating ideas.",
  alloy: "Knowledge opens doors. Let me help you explore new concepts with clarity and precision.",
  echo: "Every great discovery starts with curiosity. Let's dive into something remarkable together.",
  fable: "Once upon a time, in the realm of ideas, a curious mind set out on an adventure...",
  onyx: "The pursuit of wisdom requires discipline and focus. Let us begin this intellectual journey.",
  shimmer: "Oh, this is going to be exciting! There's so much fascinating stuff to discover together!",
};

// Cache previews in memory to avoid regenerating (they never change)
const previewCache = new Map<string, Buffer>();

export async function GET(request: NextRequest) {
  const voice = request.nextUrl.searchParams.get('voice');

  if (!voice || !VOICE_SAMPLES[voice]) {
    return NextResponse.json(
      { error: 'Invalid voice. Must be one of: nova, alloy, echo, fable, onyx, shimmer' },
      { status: 400 }
    );
  }

  // Check cache first
  const cached = previewCache.get(voice);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.audio.speech.create({
      model: 'tts-1', // Use faster model for previews
      voice: voice as 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer',
      input: VOICE_SAMPLES[voice],
      response_format: 'mp3',
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cache the result
    previewCache.set(voice, buffer);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Voice preview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice preview' },
      { status: 500 }
    );
  }
}
