import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export const runtime = 'nodejs';

// POST /api/instant-host/respond - Generate response to user's voice input
export async function POST(request: NextRequest) {
  try {
    const { topic, userMessage, conversationHistory } = await request.json();

    if (!topic || !userMessage) {
      return NextResponse.json({ error: 'Topic and message required' }, { status: 400 });
    }

    // Build conversation context
    const historyContext = conversationHistory
      ?.map((msg: { role: string; text: string }) =>
        `${msg.role === 'host' ? 'You said' : 'They said'}: "${msg.text}"`
      )
      .join('\n') || '';

    const prompt = `You are a brilliant, well-read intellectual having a real-time conversation with someone about "${topic}". You've read widely across philosophy, science, history, and culture. You make unexpected connections between ideas. You think out loud naturally.

Your voice is warm but intellectually stimulating—like having coffee with someone who makes you feel smarter just by talking with them. You're genuinely curious, not performatively enthusiastic.

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}

They just said: "${userMessage}"

Generate a SHORT (40-60 words) spoken response that:
1. Actually RESPONDS to what they said - acknowledge their thought, build on it, or gently push back
2. Add YOUR OWN insight or connection that moves the conversation forward
3. Maybe ask a follow-up question if natural, or share something that their comment made you think of

DO NOT:
- Just repeat what they said back
- Be generic or vague
- Sound like a chatbot ("That's a great question!")
- Ignore what they actually said

This should feel like a real conversation between two curious minds. Think out loud. Make connections. Be genuinely engaged with THEIR specific thought.

Just output the spoken text, nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Respond error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
