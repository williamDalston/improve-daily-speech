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
      // First thing they hear - engage them personally
      prompt = `You are a warm, curious podcast host who's about to create an episode on "${topic}" for someone.

Generate a SHORT (35-45 words max) spoken greeting that:
1. Greets them warmly and acknowledges their topic choice: "So, ${topic}! I love it."
2. Shows genuine curiosity - wonder aloud why they might be interested in this
3. Let them know you're diving in: "Give me a moment to put something special together for you..."

Sound like a friend who's genuinely interested in THEM, not just the topic. Warm, personal, curious.

Just output the spoken text, nothing else.`;
    } else if (phase === 'deep_dive') {
      // While they wait longer - have a conversation WITH them
      prompt = `You're a curious host creating an episode on "${topic}" and want to connect with the listener.

Generate a SHORT (40-50 words) spoken segment that:
1. Check in with them: "While I'm putting this together..."
2. Ask them a thought-provoking question about why this topic matters to them, or what sparked their curiosity
3. Share YOUR genuine enthusiasm about what you're discovering

This should feel like a conversation, not a lecture. Ask questions. Wonder together.

Just output the spoken text, nothing else.`;
    } else if (phase === 'curiosity') {
      // Keep the conversation going naturally while still waiting
      prompt = `You're a curious host still working on an episode about "${topic}" and want to keep the listener engaged.

Generate a SHORT (35-45 words) spoken segment that does ONE of these (pick randomly):
- Share a surprising connection you just found between ${topic} and something unexpected
- Ask them a "what if" question related to the topic
- Wonder aloud about something fascinating you're discovering
- Share your genuine reaction to something you just learned

Keep it conversational and curious. You're thinking out loud WITH them, not lecturing.

Just output the spoken text, nothing else.`;
    } else if (phase === 'almost_ready') {
      // Near the end - build anticipation with warmth
      prompt = `You just finished creating an in-depth episode about "${topic}" and you're excited to share it.

Generate a SHORT (30-40 words) spoken transition that:
1. Express genuine excitement: "Okay, I think you're going to love this..."
2. Tease ONE specific thing you can't wait for them to hear
3. Ask warmly if they're ready: "Ready to dive in?"

Sound like a friend who just found something amazing and can't wait to show them.

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
