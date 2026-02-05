/**
 * Canon Protocol — Topic Service
 *
 * Core operations for the topic clustering layer:
 * - findOrCreateTopic: slug-based dedup + optional embedding similarity
 * - generateEmbedding: OpenAI text-embedding-3-small
 * - findSimilarTopics: cosine similarity over JSON embeddings
 * - recordRequest: log a TopicRequest with cost/engagement signals
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { slugifyTopic, normalizeTopic } from './topic-slug';

// Lazy-loaded OpenAI client (same pattern as pipeline.ts)
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const EMBEDDING_MODEL = 'text-embedding-3-small';
const SIMILARITY_THRESHOLD = 0.92; // cosine similarity floor for "same topic"

// ============================================================================
// Embedding
// ============================================================================

/**
 * Generate an embedding vector for a text string.
 * Returns a float array (1536 dimensions for text-embedding-3-small).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // model limit is 8191 tokens
  });
  return response.data[0].embedding;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ============================================================================
// Similarity search
// ============================================================================

interface SimilarTopic {
  id: string;
  slug: string;
  title: string;
  similarity: number;
}

/**
 * Find topics with embeddings similar to the given vector.
 * Scans all topics with embeddings (fine for <10k topics; replace with pgvector later).
 */
export async function findSimilarTopics(
  embedding: number[],
  threshold: number = SIMILARITY_THRESHOLD,
  limit: number = 5
): Promise<SimilarTopic[]> {
  // Fetch all topics that have embeddings
  const topics = await db.topic.findMany({
    where: { embedding: { not: Prisma.DbNull } },
    select: {
      id: true,
      slug: true,
      title: true,
      embedding: true,
    },
  });

  const scored: SimilarTopic[] = [];

  for (const topic of topics) {
    const stored = topic.embedding as number[];
    if (!Array.isArray(stored) || stored.length === 0) continue;

    const sim = cosineSimilarity(embedding, stored);
    if (sim >= threshold) {
      scored.push({
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        similarity: sim,
      });
    }
  }

  // Sort by similarity descending, take top N
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}

// ============================================================================
// Find or create
// ============================================================================

interface FindOrCreateResult {
  topic: {
    id: string;
    slug: string;
    title: string;
    status: string;
    isNew: boolean;
  };
  similarTopics: SimilarTopic[];
}

/**
 * Find an existing Topic by slug, or create a new one.
 *
 * Flow:
 * 1. Slugify the raw topic string
 * 2. Look up by slug (exact match = same topic)
 * 3. If not found, generate embedding and check for similar topics
 * 4. If a similar topic exists above threshold, use it instead
 * 5. Otherwise create a new Topic record
 */
export async function findOrCreateTopic(rawTopic: string): Promise<FindOrCreateResult> {
  const title = normalizeTopic(rawTopic);
  const slug = slugifyTopic(rawTopic);

  // 1. Exact slug match
  const existing = await db.topic.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, status: true },
  });

  if (existing) {
    return {
      topic: { ...existing, isNew: false },
      similarTopics: [],
    };
  }

  // 2. Generate embedding for similarity check
  let embedding: number[] | null = null;
  let similarTopics: SimilarTopic[] = [];

  try {
    embedding = await generateEmbedding(title);
    similarTopics = await findSimilarTopics(embedding);
  } catch (e) {
    // Embedding failure is non-fatal — we still create the topic without one
    console.warn('Embedding generation failed:', e);
  }

  // 3. If a very similar topic exists, cluster onto it
  if (similarTopics.length > 0 && similarTopics[0].similarity >= SIMILARITY_THRESHOLD) {
    const match = similarTopics[0];
    // Bump request count on the matched topic (will also happen in recordRequest)
    return {
      topic: {
        id: match.id,
        slug: match.slug,
        title: match.title,
        status: 'CANDIDATE',
        isNew: false,
      },
      similarTopics,
    };
  }

  // 4. Create new topic
  const created = await db.topic.create({
    data: {
      slug,
      title,
      ...(embedding ? {
        embedding: embedding as unknown as object,
        embeddingModel: EMBEDDING_MODEL,
      } : {}),
    },
    select: { id: true, slug: true, title: true, status: true },
  });

  return {
    topic: { ...created, isNew: true },
    similarTopics,
  };
}

// ============================================================================
// Cache-hit check
// ============================================================================

interface CanonCacheHit {
  topicId: string;
  canonEpisode: {
    id: string;
    topic: string;
    title: string | null;
    transcript: string | null;
    audioUrl: string | null;
    audioDurationSecs: number | null;
    voice: string;
    wordCount: number | null;
    sources: unknown;
    length: string;
  };
}

/**
 * Check if a topic has a CANON episode available for instant serving.
 *
 * Flow:
 * 1. Slugify the raw topic
 * 2. Look up Topic by exact slug match (fast path)
 * 3. If found and status = CANON with a canonEpisodeId, fetch the episode
 * 4. Return the canon episode data or null
 */
export async function checkCanonCache(rawTopic: string): Promise<CanonCacheHit | null> {
  const slug = slugifyTopic(rawTopic);

  // Look up by slug — must be CANON with a blessed episode
  const topic = await db.topic.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      canonEpisodeId: true,
    },
  });

  if (!topic || topic.status !== 'CANON' || !topic.canonEpisodeId) {
    return null;
  }

  // Fetch the canon episode
  const episode = await db.episode.findUnique({
    where: { id: topic.canonEpisodeId },
    select: {
      id: true,
      topic: true,
      title: true,
      transcript: true,
      audioUrl: true,
      audioDurationSecs: true,
      voice: true,
      wordCount: true,
      sources: true,
      length: true,
      status: true,
    },
  });

  // Only serve if the episode is actually ready
  if (!episode || episode.status !== 'READY') {
    return null;
  }

  return {
    topicId: topic.id,
    canonEpisode: episode,
  };
}

/**
 * Clone a canon episode for a specific user.
 * Creates a lightweight Episode record pointing to the same audioUrl.
 * No AI generation, no TTS — just a DB copy.
 */
export async function cloneCanonEpisode(
  canonEpisode: CanonCacheHit['canonEpisode'],
  userId: string,
  topicId: string
) {
  return db.episode.create({
    data: {
      userId,
      topic: canonEpisode.topic,
      title: canonEpisode.title || canonEpisode.topic,
      length: canonEpisode.length,
      transcript: canonEpisode.transcript,
      audioUrl: canonEpisode.audioUrl,
      audioDurationSecs: canonEpisode.audioDurationSecs,
      voice: canonEpisode.voice,
      wordCount: canonEpisode.wordCount,
      sources: canonEpisode.sources ? (canonEpisode.sources as object) : undefined,
      status: 'READY',
      topicId,
    },
  });
}

// ============================================================================
// Record request (signal tracking)
// ============================================================================

interface RecordRequestInput {
  topicId: string;
  userId: string;
  episodeId?: string;
  costCents?: number;
  cacheHit?: boolean;
  type?: 'PERSONAL' | 'CANDIDATE';
}

/**
 * Record a TopicRequest and update denormalized counters on the Topic.
 */
export async function recordRequest(input: RecordRequestInput) {
  const {
    topicId,
    userId,
    episodeId,
    costCents,
    cacheHit = false,
    type = 'CANDIDATE',
  } = input;

  // Create the request record
  const request = await db.topicRequest.create({
    data: {
      topicId,
      userId,
      type,
      cacheHit,
      ...(episodeId ? { episodeId } : {}),
      ...(costCents !== undefined ? { costCents } : {}),
    },
  });

  // Update denormalized counters on the Topic
  // requestCount: simple increment
  // uniqueUsers: count distinct users
  const uniqueUserCount = await db.topicRequest.groupBy({
    by: ['userId'],
    where: { topicId },
    _count: true,
  });

  await db.topic.update({
    where: { id: topicId },
    data: {
      requestCount: { increment: 1 },
      uniqueUsers: uniqueUserCount.length,
    },
  });

  return request;
}
