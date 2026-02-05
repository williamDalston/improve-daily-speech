import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { withRetry, withTimeout } from '@/lib/async-utils';
import { isRetryableError } from '@/lib/ai/retry';
import { SimpleCache } from '@/lib/simple-cache';
import { INSTANT_HOST_PROMPT_VERSION } from '@/lib/ai/prompt-versions';
import { sanitizeTopic } from '@/lib/sanitize';
import { INSTANT_HOST_PERSONA } from '@/lib/ai/host-persona';

const anthropic = new Anthropic();
const cache = new SimpleCache<{ text: string; phase: string }>(5 * 60 * 1000);

// POST /api/instant-host - Generate instant topic-specific content while full episode generates
export async function POST(request: NextRequest) {
  try {
    const { topic: rawTopic, phase } = await request.json();

    if (!rawTopic || typeof rawTopic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const topic = sanitizeTopic(rawTopic);
    if (!topic) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    const validPhases = ['intro', 'deep_dive', 'curiosity', 'almost_ready'];
    if (!validPhases.includes(phase)) {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
    }

    const cacheKey = `${phase}:${topic.toLowerCase().trim()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Prompt-Version': INSTANT_HOST_PROMPT_VERSION,
          'X-Cache': 'HIT',
        },
      });
    }

    // Phase-specific user messages — persona is in system message
    let userPrompt: string;

    if (phase === 'intro') {
      userPrompt = `Someone just asked you to explore "${topic}" with them. Generate a SHORT (40-50 words) spoken opening that:

1. Acknowledge the topic with genuine intellectual interest—not just "great choice!" but WHY it's fascinating
2. Make ONE unexpected observation or connection that shows depth of thought
3. Let them know you're diving in: "Give me a moment to put something together..."

Sound like someone who's genuinely intellectually excited, not generically enthusiastic. Natural speech, with thinking pauses.

Just output the spoken text, nothing else.`;
    } else if (phase === 'deep_dive') {
      userPrompt = `You're researching "${topic}" and just discovered something interesting. Generate a SHORT (45-55 words) spoken segment that:

1. Share a genuine insight or observation you're having about the topic—something non-obvious
2. Connect it to a broader idea, another field, or human experience
3. Ask ONE open-ended question that makes them think and explain—use "Tell me...", "Describe...", "What do you think about..." (NEVER yes/no or either/or questions)

Think out loud. Wonder genuinely. Sound like you're discovering alongside them.

Just output the spoken text, nothing else.`;
    } else if (phase === 'curiosity') {
      userPrompt = `You're deep into researching "${topic}". Generate a SHORT (40-50 words) spoken segment that does ONE of these (pick the most interesting):

- Share a surprising connection between the topic and an unrelated field (philosophy, biology, history, art)
- Mention a counterintuitive finding that challenges common assumptions
- Reference a thinker, study, or idea that sheds new light on the topic
- Ask a "what if" question that reframes how we think about this

Sound like someone whose mind is actively working, making connections. Natural pauses, genuine curiosity.

Just output the spoken text, nothing else.`;
    } else {
      // almost_ready
      userPrompt = `You've just finished creating something in-depth about "${topic}" and you're genuinely excited to share it. Generate a SHORT (35-45 words) spoken transition that:

1. Express authentic intellectual excitement—what specifically fascinates you about what you found
2. Tease ONE specific insight or angle they won't expect
3. Invite them warmly: "Ready?"

Sound like a friend who just finished reading something fascinating and can't wait to discuss it.

Just output the spoken text, nothing else.`;
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
    const temperature = 0.8;
    console.info('Instant host prompt', {
      model,
      temperature,
      promptVersion: INSTANT_HOST_PROMPT_VERSION,
      phase,
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
          'instant-host'
        ),
      { retries: 2, shouldRetry: isRetryableError, label: 'instant-host' }
    );

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    const payload = { text, phase };
    cache.set(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: {
        'X-Prompt-Version': INSTANT_HOST_PROMPT_VERSION,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Instant host error:', error);
    return NextResponse.json(
      { error: 'Failed to generate host content' },
      { status: 500 }
    );
  }
}
