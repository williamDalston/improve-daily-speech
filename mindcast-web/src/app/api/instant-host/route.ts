import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// POST /api/instant-host - Generate instant topic-specific content while full episode generates
export async function POST(request: NextRequest) {
  try {
    const { topic, phase } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Different prompts for different phases of the wait
    let prompt: string;

    if (phase === 'intro') {
      // First thing they hear - hook them immediately
      prompt = `You are an enthusiastic, knowledgeable host about to create an episode on "${topic}".

Generate a SHORT (30-40 words max) spoken intro that:
1. Acknowledges the topic with genuine excitement
2. Shares ONE fascinating hook or surprising fact
3. Builds anticipation ("Let me dig into this for you...")

Sound natural and conversational, like you're talking to a friend. No filler words. Get to the interesting stuff fast.

Just output the spoken text, nothing else.`;
    } else if (phase === 'deep_dive') {
      // While they wait longer - share real knowledge
      prompt = `You are a knowledgeable host researching "${topic}" right now.

Generate a SHORT (40-50 words) spoken segment that:
1. Shares a genuinely interesting insight or lesser-known fact
2. Connects it to why it matters
3. Hints that you're finding even more interesting stuff

Sound like you're actively discovering and excited to share. Natural speech, no jargon.

Just output the spoken text, nothing else.`;
    } else if (phase === 'almost_ready') {
      // Near the end - build anticipation
      prompt = `You just finished creating an in-depth episode about "${topic}".

Generate a SHORT (25-35 words) spoken transition that:
1. Expresses satisfaction with what you've put together
2. Teases one thing they'll learn
3. Asks if they're ready to hear the full episode

Natural, warm, excited tone. Like a friend who can't wait to share something cool.

Just output the spoken text, nothing else.`;
    } else {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ text, phase });
  } catch (error) {
    console.error('Instant host error:', error);
    return NextResponse.json(
      { error: 'Failed to generate host content' },
      { status: 500 }
    );
  }
}
