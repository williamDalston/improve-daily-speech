import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import OpenAI from 'openai';
import { checkRateLimit, rateLimits, rateLimitedResponse } from '@/lib/rate-limit';
import { sanitizeQuestion, sanitizeId } from '@/lib/sanitize';

// Lazy-load OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface RouteParams {
  params: { id: string };
}

// POST /api/episodes/[id]/ask - Ask a question about the episode
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const rateLimit = checkRateLimit(session.user.id, rateLimits.ask);
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit);
  }

  // Validate episode ID
  const episodeId = sanitizeId(params.id);
  if (!episodeId) {
    return NextResponse.json({ error: 'Invalid episode ID' }, { status: 400 });
  }

  const { question: rawQuestion, currentTime } = await request.json();

  if (!rawQuestion || typeof rawQuestion !== 'string') {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  // Sanitize question
  const question = sanitizeQuestion(rawQuestion);
  if (!question || question.length < 3) {
    return NextResponse.json({ error: 'Question must be at least 3 characters' }, { status: 400 });
  }

  // Get the episode
  const episode = await db.episode.findFirst({
    where: {
      id: episodeId,
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      topic: true,
      transcript: true,
      sources: true,
    },
  });

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }

  if (!episode.transcript) {
    return NextResponse.json({ error: 'Episode has no transcript' }, { status: 400 });
  }

  try {
    // Build context with transcript and sources
    let context = `Episode: ${episode.title || episode.topic}\n\nTranscript:\n${episode.transcript}`;

    if (episode.sources && Array.isArray(episode.sources)) {
      context += '\n\nSources referenced in this episode:\n';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      episode.sources.forEach((source: any, idx: number) => {
        context += `[${idx + 1}] ${source.title} by ${source.author} (${source.year})\n`;
      });
    }

    // Add current playback context if available
    let timeContext = '';
    if (currentTime !== undefined && currentTime > 0) {
      // Estimate which part of transcript they're at based on time
      const wordsPerMinute = 150;
      const estimatedWordPosition = Math.floor((currentTime / 60) * wordsPerMinute);
      const words = episode.transcript.split(/\s+/);
      const startWord = Math.max(0, estimatedWordPosition - 100);
      const endWord = Math.min(words.length, estimatedWordPosition + 100);
      const nearbyContent = words.slice(startWord, endWord).join(' ');
      timeContext = `\n\nThe listener is currently around this part of the episode:\n"...${nearbyContent}..."`;
    }

    const systemPrompt = `You are a helpful learning assistant for an educational audio platform called MindCast.
The user is listening to an episode and has a question about the content.

Your job is to:
1. Answer their question based on the episode content
2. Be concise but thorough (2-3 sentences usually)
3. Reference specific parts of the transcript when relevant
4. If the question goes beyond what's covered in the episode, acknowledge this and provide helpful context
5. Encourage deeper understanding, not just surface-level answers

${timeContext ? 'The user is currently listening at a specific point - prioritize content near that section if relevant to their question.' : ''}

Episode Content:
${context}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User question: ${question}` },
      ],
      max_tokens: 500,
    });

    const answer = response.choices[0]?.message?.content || 'Sorry, I could not generate an answer.';

    // Log for analytics (optional - could track common questions)
    console.log(`Ask feature used for episode ${episode.id}: "${question.substring(0, 50)}..."`);

    return NextResponse.json({
      answer,
      episodeId: episode.id,
    });
  } catch (err) {
    console.error('Failed to answer question:', err);
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    );
  }
}
