import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canCreateEpisode } from '@/lib/stripe';
import { processJob } from '@/lib/jobs/processor';
import { checkRateLimit, rateLimits, rateLimitedResponse, getRateLimitHeaders } from '@/lib/rate-limit';
import { sanitizeTopic, sanitizeContext, hasInappropriateContent } from '@/lib/sanitize';
import { checkCanonCache, cloneCanonEpisode, recordRequest } from '@/lib/canon';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel

// POST /api/jobs - Create a new generation job
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting - use user ID for authenticated requests
  const rateLimit = await checkRateLimit(session.user.id, rateLimits.generate);
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit);
  }

  const { topic: rawTopic, length = '10 min', style = '', mode = 'deep', voice = 'nova', deviceType = 'desktop' } = await request.json();
  const generationMode = mode === 'quick' ? 'quick' : 'deep'; // Validate mode
  const selectedVoice = typeof voice === 'string' ? voice : 'nova'; // Default to nova
  const device = deviceType === 'mobile' ? 'mobile' : 'desktop'; // Validate device type

  if (!rawTopic || typeof rawTopic !== 'string') {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }

  // Sanitize inputs
  const topic = sanitizeTopic(rawTopic);
  if (!topic || topic.length < 3) {
    return NextResponse.json({ error: 'Topic must be at least 3 characters' }, { status: 400 });
  }

  // Content moderation
  if (hasInappropriateContent(topic)) {
    return NextResponse.json(
      { error: 'This topic cannot be processed. Please try a different topic.' },
      { status: 400 }
    );
  }

  // Style is an optional tone/perspective modifier
  const stylePrompt = typeof style === 'string' ? sanitizeContext(style) : '';

  // Canon Protocol: check for cache hit BEFORE access check.
  // Canon episodes are free for everyone — no tier gating.
  try {
    const cacheHit = await checkCanonCache(topic);
    if (cacheHit) {
      // Clone the canon episode for this user (instant, no AI cost)
      const cloned = await cloneCanonEpisode(
        cacheHit.canonEpisode,
        session.user.id,
        cacheHit.topicId
      );

      // Create an instant-complete job so the frontend flow works unchanged
      const cacheJob = await db.job.create({
        data: {
          userId: session.user.id,
          topic,
          length: cacheHit.canonEpisode.length,
          voice: cacheHit.canonEpisode.voice,
          status: 'COMPLETE',
          progress: 100,
          currentStep: 'Canon cache hit',
          episodeId: cloned.id,
          startedAt: new Date(),
          completedAt: new Date(),
          costCents: 0,
        },
      });

      // Record the cache-hit request (async, non-blocking)
      waitUntil(
        recordRequest({
          topicId: cacheHit.topicId,
          userId: session.user.id,
          episodeId: cloned.id,
          costCents: 0,
          cacheHit: true,
        }).catch((e) => console.warn('Canon cache-hit tracking failed:', e))
      );

      return NextResponse.json(
        {
          jobId: cacheJob.id,
          status: 'COMPLETE',
          message: 'Canon episode served instantly',
          cacheHit: true,
        },
        { headers: getRateLimitHeaders(rateLimit) }
      );
    }
  } catch (e) {
    // Cache check failure should never block generation
    console.warn('Canon cache check failed:', e);
  }

  // Check if user can create a NEW episode (tier-gated — only for fresh generation)
  const access = await canCreateEpisode(session.user.id);
  if (!access.allowed) {
    // Count available canon topics to suggest in the error
    let canonCount = 0;
    try {
      canonCount = await db.topic.count({
        where: { status: 'CANON', canonEpisodeId: { not: null } },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json(
      {
        error: access.reason,
        needsUpgrade: true,
        ...(canonCount > 0
          ? { canonAvailable: canonCount, hint: 'Try a popular topic for instant access, or upgrade for unlimited custom episodes.' }
          : {}),
      },
      { status: 403 }
    );
  }

  // Check for existing pending job for this user (prevent duplicates)
  const existingJob = await db.job.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ['PENDING', 'RESEARCH', 'DRAFTING', 'JUDGING', 'ENHANCING', 'AUDIO'] },
    },
  });

  if (existingJob) {
    // Return the existing job instead of creating a new one
    return NextResponse.json({
      jobId: existingJob.id,
      status: existingJob.status,
      message: 'Existing job in progress',
    });
  }

  // Validate voice option
  const validVoices = ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'];
  const voiceToStore = validVoices.includes(selectedVoice) ? selectedVoice : 'nova';

  // Create the job record
  const job = await db.job.create({
    data: {
      userId: session.user.id,
      topic,
      length,
      style: stylePrompt || null,
      voice: voiceToStore,
      status: 'PENDING',
    },
  });

  // Start processing in the background using waitUntil to keep function alive
  // This ensures the job continues even after HTTP response is sent
  waitUntil(
    processJob(
      job.id,
      session.user.id,
      session.user.isPro ?? false,
      generationMode,
      voiceToStore as 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer',
      device as 'mobile' | 'desktop'
    ).catch((err) => {
      console.error('Job processing failed:', err);
    })
  );

  return NextResponse.json(
    {
      jobId: job.id,
      status: 'PENDING',
      message: 'Job created successfully',
    },
    {
      headers: getRateLimitHeaders(rateLimit),
    }
  );
}

// GET /api/jobs - List user's jobs
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await db.job.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      topic: true,
      status: true,
      progress: true,
      currentStep: true,
      createdAt: true,
      completedAt: true,
      episodeId: true,
    },
  });

  return NextResponse.json({ jobs });
}
