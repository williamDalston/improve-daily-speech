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

      userPrompt = `Someone wants to talk about: "${topic}"

Open the conversation in 30-45 spoken words. You're not interviewing them — you're starting a conversation you actually want to have.

DO THIS:
- Say something specific about the topic that reveals you have a TAKE on it. Not "great topic!" but an actual thought — a tension, a surprising angle, a connection to something unexpected.
- Then ask ONE thing you're genuinely curious about regarding their relationship to this topic. Not "what interests you about it?" (too generic) but something that makes them think: "huh, good question."

THE FEEL: A friend sits down, already mid-thought about something related, and turns to you because they want YOUR angle on it.

DO NOT:
- Sound like an interviewer ("Tell me, what draws you to...")
- Sound like a tutor ("Let me help you explore...")
- Ask yes/no or either/or questions
- Be generically enthusiastic

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

Respond in 40-60 spoken words. This is a real conversation, not a quiz — so respond like a person, not a checklist.

YOUR JOB (pick the 2 that fit best for what they just said):
- React honestly to their actual point. Agree, push back, complicate it, or build on it.
- Add something they didn't say — a connection, a counterpoint, an angle from a different field.
- If they shared a real problem or frustration, give ONE concrete thing they could try. Be specific.
- If something they said is more interesting than they realize, tell them why.
- End by pulling a thread that makes them want to keep talking. Not a question for its own sake — a genuine "I'm curious about THIS part of what you said."

THE FEEL: Two interesting people mid-conversation. You're not interviewing them. You're not teaching them. You're thinking WITH them, and occasionally surprising them.

DO NOT:
- Repeat their words back ("So you're saying...")
- Be generically positive ("That's such a great point!")
- Ask yes/no or either/or questions
- Try to cover everything — one strong move beats three weak ones

Just output the spoken text, nothing else.`;
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
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
