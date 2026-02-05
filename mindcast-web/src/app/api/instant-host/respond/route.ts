import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { withRetry, withTimeout } from '@/lib/async-utils';
import { isRetryableError } from '@/lib/ai/retry';
import { SimpleCache } from '@/lib/simple-cache';
import { INSTANT_HOST_CONVO_VERSION } from '@/lib/ai/prompt-versions';
import { sanitizeTopic, sanitizeInput } from '@/lib/sanitize';
import { INSTANT_HOST_PERSONA } from '@/lib/ai/host-persona';

const anthropic = new Anthropic();
const starterCache = new SimpleCache<{ text: string }>(5 * 60 * 1000);

export const runtime = 'nodejs';

// POST /api/instant-host/respond - Generate response to user's voice input
export async function POST(request: NextRequest) {
  try {
    const { topic: rawTopic, userMessage: rawMessage, conversationHistory } = await request.json();

    if (!rawTopic || !rawMessage) {
      return NextResponse.json({ error: 'Topic and message required' }, { status: 400 });
    }

    const topic = sanitizeTopic(rawTopic);
    if (!topic) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    const isConversationStarter = rawMessage === '__START_CONVERSATION__';
    const userMessage = isConversationStarter
      ? rawMessage
      : sanitizeInput(rawMessage, { maxLength: 1000, allowNewlines: false });

    let userPrompt: string;

    if (isConversationStarter) {
      const cacheKey = `starter:${topic.toLowerCase().trim()}`;
      const cached = starterCache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Prompt-Version': INSTANT_HOST_CONVO_VERSION,
            'X-Cache': 'HIT',
          },
        });
      }

      userPrompt = `You're about to have a spontaneous conversation about the topic: "${topic}"

Generate a SHORT (30-45 words) engaging OPENING that:
1. Shows genuine curiosity about their interest in this topic
2. Asks them a specific, intriguing question about it
3. Makes them want to think and respond immediately

The opener should feel like a friend who just sat down, genuinely interested, already diving into real conversation.

DO NOT:
- Be generic ("What do you want to know?")
- Sound like a tutor ("Let me teach you about...")
- Be overly enthusiastic or fake
- Make it about yourself

Just output the spoken text, nothing else.`;
    } else {
      // Build conversation context (limit to last 6 exchanges)
      const historyContext = Array.isArray(conversationHistory)
        ? conversationHistory
            .slice(-6)
            .map((msg: { role: string; text: string }) =>
              `${msg.role === 'host' ? 'You said' : 'They said'}: "${sanitizeInput(String(msg.text || ''), { maxLength: 500, allowNewlines: false })}"`
            )
            .join('\n')
        : '';

      userPrompt = `Topic of conversation: "${topic}"

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}They just said: "${userMessage}"

Generate a SHORT (40-60 words) spoken response that:
1. Actually RESPONDS to what they said - acknowledge their thought, build on it, or gently push back
2. Add YOUR OWN insight or connection that moves the conversation forward
3. End with a follow-up question to keep the dialogue going

DO NOT:
- Just repeat what they said back
- Be generic or vague
- Sound like a chatbot ("That's a great question!")
- Ignore what they actually said

This should feel like a real conversation between two curious minds. Always end with something that invites their response.

Just output the spoken text, nothing else.`;
    }

    const model = 'claude-sonnet-4-5-20250929';
    const temperature = 0.8;
    console.info('Instant host response', {
      model,
      temperature,
      promptVersion: INSTANT_HOST_CONVO_VERSION,
      starter: isConversationStarter,
    });

    const message = await withRetry(
      () =>
        withTimeout(
          anthropic.messages.create({
            model,
            max_tokens: 200,
            temperature,
            system: INSTANT_HOST_PERSONA,
            messages: [{ role: 'user', content: userPrompt }],
          }),
          30000,
          'instant-host-respond'
        ),
      { retries: 2, shouldRetry: isRetryableError, label: 'instant-host-respond' }
    );

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    const payload = { text };

    if (isConversationStarter) {
      const cacheKey = `starter:${topic.toLowerCase().trim()}`;
      starterCache.set(cacheKey, payload);
    }

    return NextResponse.json(payload, {
      headers: {
        'X-Prompt-Version': INSTANT_HOST_CONVO_VERSION,
        'X-Cache': isConversationStarter ? 'MISS' : 'BYPASS',
      },
    });
  } catch (error) {
    console.error('Respond error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
