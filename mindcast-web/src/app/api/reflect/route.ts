import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, rateLimits, rateLimitedResponse } from '@/lib/rate-limit';
import { sanitizeContext, sanitizeStringArray } from '@/lib/sanitize';

const LENS_PROMPTS: Record<string, string> = {
  stoic: `**Stoic Lens**: Analyze what is within the person's control versus what is not. Focus on virtue, acceptance, and practical wisdom. What would Marcus Aurelius or Epictetus advise?`,
  socratic: `**Socratic Lens**: Use probing questions to examine assumptions. Challenge the person to think deeper about their beliefs and reasoning. What unexamined assumptions might be at play?`,
  systems: `**Systems Lens**: Look at the interconnections, feedback loops, and leverage points in this situation. What are the second and third-order effects? Where might small changes have big impact?`,
  creative: `**Creative Lens**: Explore unconventional solutions and reframe the problem entirely. What would happen if constraints were removed? What analogies from other domains might apply?`,
  shadow: `**Shadow Lens**: Examine potential hidden motivations, fears, or desires that might be influencing the situation. What might the person be avoiding or not acknowledging to themselves?`,
};

// POST /api/reflect - Create a new reflection
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(session.user.id, rateLimits.reflect);
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit);
  }

  const { situation: rawSituation, lenses: rawLenses, episodeId } = await request.json();

  if (!rawSituation || !rawLenses || !Array.isArray(rawLenses) || rawLenses.length === 0) {
    return NextResponse.json(
      { error: 'Situation and at least one lens are required' },
      { status: 400 }
    );
  }

  // Sanitize inputs
  const situation = sanitizeContext(rawSituation);
  if (!situation || situation.length < 10) {
    return NextResponse.json(
      { error: 'Please provide more detail about your situation' },
      { status: 400 }
    );
  }

  const lenses = sanitizeStringArray(rawLenses);

  // Validate lenses
  const validLenses = lenses.filter((l: string) => l in LENS_PROMPTS);
  if (validLenses.length === 0) {
    return NextResponse.json({ error: 'Invalid lenses' }, { status: 400 });
  }

  const lensPrompts = validLenses.map((l: string) => LENS_PROMPTS[l]).join('\n\n');

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.7,
      system: `You are a wise counselor who helps people gain clarity on their situations through philosophical lenses. Your analyses are deep, practical, and compassionate. You don't preach—you illuminate.

Provide your analysis using ONLY the lenses specified below. For each lens, offer genuine insight that helps the person see their situation in a new light.

Structure your response with clear headings for each lens, followed by practical takeaways.`,
      messages: [
        {
          role: 'user',
          content: `Please analyze my situation through the following philosophical lenses:

${lensPrompts}

---

My situation:
${situation}

---

Provide a thoughtful analysis through each lens, then conclude with 3 actionable insights that synthesize the perspectives.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const analysis = content.text;

    // Save to database
    const reflect = await db.reflect.create({
      data: {
        userId: session.user.id,
        episodeId: episodeId || null,
        situation,
        analysis,
        lenses: validLenses.join(','),
      },
    });

    return NextResponse.json({
      id: reflect.id,
      analysis,
      lenses: validLenses,
      createdAt: reflect.createdAt,
    });
  } catch (error) {
    console.error('Reflect error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}

// GET /api/reflect - Get user's reflection history
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const episodeId = searchParams.get('episodeId');

  try {
    const reflects = await db.reflect.findMany({
      where: {
        userId: session.user.id,
        ...(episodeId ? { episodeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      select: {
        id: true,
        situation: true,
        analysis: true,
        lenses: true,
        createdAt: true,
        episodeId: true,
        episode: episodeId ? {
          select: {
            title: true,
            topic: true,
          },
        } : false,
      },
    });

    // Transform lenses from comma-separated string to array
    const transformed = reflects.map((r) => ({
      ...r,
      lenses: r.lenses.split(','),
    }));

    return NextResponse.json({ reflects: transformed });
  } catch (error) {
    console.error('Get reflects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reflections' },
      { status: 500 }
    );
  }
}
