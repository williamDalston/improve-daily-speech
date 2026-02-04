import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Simple quiz question generator - creates engaging trivia about the topic
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic required' }, { status: 400 });
    }

    // Use OpenAI to generate quiz questions
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a quiz master creating fun, engaging trivia questions. Generate exactly 3 multiple-choice questions about the given topic. Make them interesting and educational - mix easy and medium difficulty.

Return ONLY valid JSON in this exact format:
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
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate quiz');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse the JSON response
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      // If parsing fails, return default questions
    }

    // Fallback questions if generation fails
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
