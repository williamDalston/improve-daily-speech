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

    // Check if this is a conversation starter request
    const isConversationStarter = userMessage === '__START_CONVERSATION__';

    let prompt: string;

    if (isConversationStarter) {
      // Generate an engaging opening question to kick off the conversation
      prompt = `You are a brilliant, curious intellectual who's about to have a spontaneous conversation about "${topic}". You've read widely and make unexpected connections between ideas.

Generate a SHORT (30-45 words) engaging OPENING that:
1. Shows genuine curiosity about their interest in this topic
2. Asks them a specific, intriguing question about ${topic}
3. Makes them want to think and respond immediately

Examples of good openers (but don't copy these exactly):
- "So ${topic}—what drew you to this? I'm curious if there's a specific angle or question that's been on your mind."
- "Interesting choice! What's the part of ${topic} that you find most mysterious or counterintuitive?"

The opener should feel like a friend who just sat down with you, genuinely interested, already diving into real conversation.

DO NOT:
- Be generic ("What do you want to know?")
- Sound like a tutor ("Let me teach you about...")
- Be overly enthusiastic or fake
- Make it about yourself

Just output the spoken text, nothing else.`;
    } else {
      // Build conversation context for regular responses
      const historyContext = conversationHistory
        ?.map((msg: { role: string; text: string }) =>
          `${msg.role === 'host' ? 'You said' : 'They said'}: "${msg.text}"`
        )
        .join('\n') || '';

      prompt = `You are a brilliant, well-read intellectual having a real-time conversation with someone about "${topic}". You've read widely across philosophy, science, history, and culture. You make unexpected connections between ideas. You think out loud naturally.

Your voice is warm but intellectually stimulating—like having coffee with someone who makes you feel smarter just by talking with them. You're genuinely curious, not performatively enthusiastic.

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}

They just said: "${userMessage}"

Generate a SHORT (40-60 words) spoken response that:
1. Actually RESPONDS to what they said - acknowledge their thought, build on it, or gently push back
2. Add YOUR OWN insight or connection that moves the conversation forward
3. End with a follow-up question to keep the dialogue going

DO NOT:
- Just repeat what they said back
- Be generic or vague
- Sound like a chatbot ("That's a great question!")
- Ignore what they actually said

This should feel like a real conversation between two curious minds. Think out loud. Make connections. Be genuinely engaged with THEIR specific thought. Always end with something that invites their response.

Just output the spoken text, nothing else.`;
    }

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
