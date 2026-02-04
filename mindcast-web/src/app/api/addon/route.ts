import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateAddon } from '@/lib/ai/pipeline';
import { checkRateLimit, rateLimits, rateLimitedResponse } from '@/lib/rate-limit';
import { sanitizeId } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const rateLimit = checkRateLimit(session.user.id, rateLimits.addon);
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit);
  }

  const { episodeId: rawEpisodeId, addonType } = await request.json();

  if (!rawEpisodeId || !addonType) {
    return NextResponse.json(
      { error: 'episodeId and addonType are required' },
      { status: 400 }
    );
  }

  // Validate and sanitize inputs
  const episodeId = sanitizeId(rawEpisodeId);
  if (!episodeId) {
    return NextResponse.json({ error: 'Invalid episode ID' }, { status: 400 });
  }

  if (!['quiz', 'journal', 'takeaways'].includes(addonType)) {
    return NextResponse.json({ error: 'Invalid addon type' }, { status: 400 });
  }

  // Fetch episode
  const episode = await db.episode.findFirst({
    where: {
      id: episodeId,
      userId: session.user.id,
    },
    select: {
      topic: true,
      transcript: true,
    },
  });

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }

  if (!episode.transcript) {
    return NextResponse.json(
      { error: 'Episode has no transcript' },
      { status: 400 }
    );
  }

  try {
    const content = await generateAddon(
      addonType as 'quiz' | 'journal' | 'takeaways',
      episode.topic,
      episode.transcript
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Addon generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate addon' },
      { status: 500 }
    );
  }
}
