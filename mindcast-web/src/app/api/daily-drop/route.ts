import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canCreateEpisode } from '@/lib/stripe';
import { processJob } from '@/lib/jobs/processor';
import { checkRateLimit, rateLimits, rateLimitedResponse } from '@/lib/rate-limit';
import { sanitizeStringArray } from '@/lib/sanitize';

// Default interest categories for Daily Drop
const INTEREST_CATEGORIES = [
  { id: 'science', label: 'Science & Tech', topics: ['quantum computing breakthroughs', 'new space discoveries', 'AI developments', 'climate science', 'medical research'] },
  { id: 'history', label: 'History', topics: ['ancient civilizations', 'world war stories', 'historical figures', 'historical mysteries', 'cultural revolutions'] },
  { id: 'psychology', label: 'Mind & Behavior', topics: ['cognitive biases', 'habit formation', 'decision making', 'emotional intelligence', 'memory and learning'] },
  { id: 'philosophy', label: 'Philosophy', topics: ['ethical dilemmas', 'existential questions', 'philosophical paradoxes', 'schools of thought', 'meaning and purpose'] },
  { id: 'economics', label: 'Money & Economics', topics: ['market psychology', 'economic history', 'behavioral economics', 'financial systems', 'wealth inequality'] },
  { id: 'nature', label: 'Nature & Environment', topics: ['animal behavior', 'ecosystems', 'environmental challenges', 'evolution', 'natural phenomena'] },
  { id: 'culture', label: 'Culture & Society', topics: ['social movements', 'cultural phenomena', 'modern trends', 'generational differences', 'media and communication'] },
  { id: 'creativity', label: 'Arts & Creativity', topics: ['creative processes', 'artistic movements', 'innovation stories', 'design thinking', 'creative breakthroughs'] },
];

// Generate a topic based on user interests
function generateDailyTopic(interests: string[]): string {
  // If no interests, pick from general popular topics
  if (!interests || interests.length === 0) {
    const allTopics = INTEREST_CATEGORIES.flatMap(c => c.topics);
    return allTopics[Math.floor(Math.random() * allTopics.length)];
  }

  // Pick a random interest category the user has selected
  const selectedCategories = INTEREST_CATEGORIES.filter(c => interests.includes(c.id));
  if (selectedCategories.length === 0) {
    const allTopics = INTEREST_CATEGORIES.flatMap(c => c.topics);
    return allTopics[Math.floor(Math.random() * allTopics.length)];
  }

  const category = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
  const topic = category.topics[Math.floor(Math.random() * category.topics.length)];

  // Add variety to the topic prompt
  const angles = [
    `The surprising truth about ${topic}`,
    `What everyone gets wrong about ${topic}`,
    `The untold story of ${topic}`,
    `Why ${topic} matters more than you think`,
    `The science behind ${topic}`,
  ];

  return angles[Math.floor(Math.random() * angles.length)];
}

// GET /api/daily-drop - Check if daily drop is available
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      interests: true,
      listeningMode: true,
      narratorTone: true,
      lastDailyDrop: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if user has already generated a Daily Drop today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDrop = user.lastDailyDrop ? new Date(user.lastDailyDrop) : null;
  const hasDropToday = lastDrop && lastDrop >= today;

  // Find today's Daily Drop episode if exists
  const todaysDrop = await db.episode.findFirst({
    where: {
      userId: session.user.id,
      createdAt: { gte: today },
      topic: { startsWith: '[Daily Drop]' },
    },
    select: {
      id: true,
      title: true,
      topic: true,
      status: true,
      audioDurationSecs: true,
    },
  });

  return NextResponse.json({
    available: !hasDropToday,
    hasInterests: Array.isArray(user.interests) && user.interests.length > 0,
    todaysDrop,
    categories: INTEREST_CATEGORIES.map(c => ({ id: c.id, label: c.label })),
    userInterests: user.interests || [],
  });
}

// POST /api/daily-drop - Generate today's Daily Drop
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const rateLimit = checkRateLimit(session.user.id, rateLimits.dailyDrop);
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit);
  }

  // Check subscription/limits
  const access = await canCreateEpisode(session.user.id);
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason, needsUpgrade: true },
      { status: 403 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      interests: true,
      listeningMode: true,
      narratorTone: true,
      lastDailyDrop: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if already generated today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDrop = user.lastDailyDrop ? new Date(user.lastDailyDrop) : null;
  if (lastDrop && lastDrop >= today) {
    return NextResponse.json(
      { error: 'Daily Drop already generated today', available: false },
      { status: 429 }
    );
  }

  // Generate topic based on interests
  const interests = Array.isArray(user.interests) ? user.interests as string[] : [];
  const topic = generateDailyTopic(interests);
  const fullTopic = `[Daily Drop] ${topic}`;

  // Build style based on user preferences
  const styleParts: string[] = [];

  if (user.listeningMode === 'commute') {
    styleParts.push('Keep it engaging and easy to follow while commuting. Use clear structure and memorable hooks.');
  } else if (user.listeningMode === 'deep_dive') {
    styleParts.push('Go deeper into the nuances and details. Include more context and connections.');
  }

  if (user.narratorTone === 'bbc_calm') {
    styleParts.push('Use a calm, authoritative BBC documentary style.');
  } else if (user.narratorTone === 'playful_professor') {
    styleParts.push('Be like an enthusiastic professor who makes everything fascinating.');
  } else if (user.narratorTone === 'no_fluff') {
    styleParts.push('Be direct and efficient. No fluff, just the essential insights.');
  }

  const stylePrompt = styleParts.join(' ');

  // Determine length based on listening mode
  const length = user.listeningMode === 'commute' ? '10 min' : '15 min';

  // Create job
  const job = await db.job.create({
    data: {
      userId: session.user.id,
      topic: fullTopic,
      length,
      style: stylePrompt || null,
      status: 'PENDING',
    },
  });

  // Update last daily drop timestamp
  await db.user.update({
    where: { id: session.user.id },
    data: { lastDailyDrop: new Date() },
  });

  // Start processing
  processJob(job.id, session.user.id, session.user.isPro ?? false).catch((err) => {
    console.error('Daily Drop job processing failed:', err);
  });

  return NextResponse.json({
    jobId: job.id,
    topic: fullTopic,
    status: 'PENDING',
  });
}

// PUT /api/daily-drop - Update user interests
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { interests: rawInterests, listeningMode, narratorTone } = await request.json();

  // Sanitize and validate inputs
  const validInterests = INTEREST_CATEGORIES.map(c => c.id);
  const interests = rawInterests
    ? sanitizeStringArray(rawInterests).filter(i => validInterests.includes(i))
    : undefined;

  const validListeningModes = ['commute', 'deep_dive'];
  const validNarratorTones = ['bbc_calm', 'playful_professor', 'no_fluff'];

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(interests !== undefined && { interests }),
      ...(listeningMode !== undefined && validListeningModes.includes(listeningMode) && { listeningMode }),
      ...(narratorTone !== undefined && validNarratorTones.includes(narratorTone) && { narratorTone }),
    },
  });

  return NextResponse.json({ success: true });
}
