import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';
import { withRetry, withTimeout } from '@/lib/async-utils';
import { isRetryableError } from '@/lib/ai/retry';
import { SimpleCache } from '@/lib/simple-cache';
import { QUIZ_PROMPT_VERSION } from '@/lib/ai/prompt-versions';
import { sanitizeTopic } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
const quizCache = new SimpleCache<{ questions: unknown[] }>(5 * 60 * 1000);

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// Simple quiz question generator - creates engaging trivia about the topic
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { topic: rawTopic } = await request.json();

    if (!rawTopic) {
      return NextResponse.json({ error: 'Topic required' }, { status: 400 });
    }

    const topic = sanitizeTopic(rawTopic);
    if (!topic) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    const cacheKey = topic.toLowerCase().trim();
    const cached = quizCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Prompt-Version': QUIZ_PROMPT_VERSION,
          'X-Cache': 'HIT',
        },
      });
    }

    // Use OpenAI SDK with structured JSON output
    const response = await withRetry(
      () =>
        withTimeout(
          getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a quiz master creating fun, engaging trivia questions. Generate exactly 3 multiple-choice questions about the given topic. Make them interesting and educational - mix easy and medium difficulty.

Return valid JSON with this structure:
{
  "questions": [
    {
      "question": "The question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}`,
              },
              {
                role: 'user',
                content: `Create 3 trivia questions about: ${topic}`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000,
          }),
          20000,
          'instant-host-quiz'
        ),
      { retries: 2, shouldRetry: isRetryableError, label: 'instant-host-quiz' }
    );

    const content = response.choices[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(content);
      quizCache.set(cacheKey, parsed);
      return NextResponse.json(parsed, {
        headers: {
          'X-Prompt-Version': QUIZ_PROMPT_VERSION,
          'X-Cache': 'MISS',
        },
      });
    } catch {
      // If parsing fails, return default questions
    }

    // Fallback questions if generation fails
    const fallback = {
      questions: [
        {
          question: `What makes "${topic.slice(0, 30)}" an interesting subject to explore?`,
          options: [
            'Its historical significance',
            'Its impact on modern life',
            'Its complexity and depth',
            'All of the above',
          ],
          correctIndex: 3,
          explanation: 'Most topics are interesting for multiple reasons!',
        },
        {
          question: 'Learning about new topics helps us:',
          options: [
            'Build new neural connections',
            'See the world differently',
            'Connect ideas across domains',
            'All of the above',
          ],
          correctIndex: 3,
          explanation: 'Learning has many cognitive and practical benefits.',
        },
        {
          question: 'The best way to retain new knowledge is to:',
          options: [
            'Read it once quickly',
            'Engage with it actively',
            'Memorize facts only',
            'Avoid asking questions',
          ],
          correctIndex: 1,
          explanation: 'Active engagement through discussion, questioning, and application helps knowledge stick.',
        },
      ],
    };
    quizCache.set(cacheKey, fallback);
    return NextResponse.json(fallback, {
      headers: {
        'X-Prompt-Version': QUIZ_PROMPT_VERSION,
        'X-Cache': 'FALLBACK',
      },
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
