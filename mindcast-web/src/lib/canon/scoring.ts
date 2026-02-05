/**
 * Canon Protocol — Scoring & Promotion Engine
 *
 * Computes canonScore from engagement signals, evaluates promotion
 * eligibility, and triggers remaster jobs when thresholds are met.
 *
 * Promotion formula:
 *   canonScore = 0.30 * norm(requestCount)
 *              + 0.25 * norm(uniqueUsers)
 *              + 0.25 * completionRate
 *              + 0.20 * saveRate
 *
 * Promotion requires ALL of:
 *   - requestCount >= PROMOTION_MIN_REQUESTS (5)
 *   - uniqueUsers  >= PROMOTION_MIN_USERS (3)
 *   - completionRate >= PROMOTION_MIN_COMPLETION (0.6)
 *   - canonScore >= PROMOTION_SCORE_THRESHOLD (0.4)
 */

import { db } from '@/lib/db';

// ============================================================================
// Thresholds (tune these as you gather data)
// ============================================================================

export const PROMOTION_THRESHOLDS = {
  minRequests: 5,       // At least 5 total requests
  minUsers: 3,          // At least 3 distinct users
  minCompletion: 0.6,   // 60%+ median completion rate
  minScore: 0.4,        // Composite score floor
} as const;

// Normalization caps — scores are clamped at these values
// (prevents a single viral topic from warping the scale)
const NORM_CAPS = {
  requestCount: 50,     // 50+ requests = max score on this dimension
  uniqueUsers: 20,      // 20+ users = max score
} as const;

// ============================================================================
// Score computation
// ============================================================================

interface TopicSignals {
  requestCount: number;
  uniqueUsers: number;
  completionRate: number;  // 0.0–1.0
  saveRate: number;        // 0.0–1.0
}

/**
 * Compute the composite canonScore for a topic.
 * Returns a value between 0.0 and 1.0.
 */
export function computeCanonScore(signals: TopicSignals): number {
  const normRequests = Math.min(signals.requestCount / NORM_CAPS.requestCount, 1);
  const normUsers = Math.min(signals.uniqueUsers / NORM_CAPS.uniqueUsers, 1);
  const completion = Math.min(Math.max(signals.completionRate, 0), 1);
  const save = Math.min(Math.max(signals.saveRate, 0), 1);

  return (
    0.30 * normRequests +
    0.25 * normUsers +
    0.25 * completion +
    0.20 * save
  );
}

// ============================================================================
// Promotion evaluation
// ============================================================================

interface PromotionDecision {
  eligible: boolean;
  score: number;
  reasons: string[];        // Why eligible
  blockers: string[];       // Why not eligible
}

/**
 * Evaluate whether a topic is ready for canon promotion.
 */
export function evaluatePromotion(signals: TopicSignals): PromotionDecision {
  const score = computeCanonScore(signals);
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (signals.requestCount >= PROMOTION_THRESHOLDS.minRequests) {
    reasons.push(`${signals.requestCount} requests (>= ${PROMOTION_THRESHOLDS.minRequests})`);
  } else {
    blockers.push(`Only ${signals.requestCount} requests (need ${PROMOTION_THRESHOLDS.minRequests})`);
  }

  if (signals.uniqueUsers >= PROMOTION_THRESHOLDS.minUsers) {
    reasons.push(`${signals.uniqueUsers} unique users (>= ${PROMOTION_THRESHOLDS.minUsers})`);
  } else {
    blockers.push(`Only ${signals.uniqueUsers} unique users (need ${PROMOTION_THRESHOLDS.minUsers})`);
  }

  if (signals.completionRate >= PROMOTION_THRESHOLDS.minCompletion) {
    reasons.push(`${(signals.completionRate * 100).toFixed(0)}% completion (>= ${PROMOTION_THRESHOLDS.minCompletion * 100}%)`);
  } else {
    blockers.push(`${(signals.completionRate * 100).toFixed(0)}% completion (need ${PROMOTION_THRESHOLDS.minCompletion * 100}%)`);
  }

  if (score >= PROMOTION_THRESHOLDS.minScore) {
    reasons.push(`Score ${score.toFixed(3)} (>= ${PROMOTION_THRESHOLDS.minScore})`);
  } else {
    blockers.push(`Score ${score.toFixed(3)} (need ${PROMOTION_THRESHOLDS.minScore})`);
  }

  return {
    eligible: blockers.length === 0,
    score,
    reasons,
    blockers,
  };
}

// ============================================================================
// Refresh denormalized signals from TopicRequest data
// ============================================================================

/**
 * Recompute completionRate and saveRate from actual TopicRequest records.
 * Called before scoring to ensure signals are fresh.
 */
async function refreshSignals(topicId: string) {
  const requests = await db.topicRequest.findMany({
    where: { topicId },
    select: {
      completionPct: true,
      saved: true,
    },
  });

  if (requests.length === 0) return;

  // Median completion rate (only from requests that have a value)
  const completions = requests
    .map(r => r.completionPct)
    .filter((c): c is number => c !== null)
    .sort((a, b) => a - b);

  const medianCompletion = completions.length > 0
    ? completions[Math.floor(completions.length / 2)]
    : 0;

  // Save rate
  const savedCount = requests.filter(r => r.saved).length;
  const saveRate = savedCount / requests.length;

  await db.topic.update({
    where: { id: topicId },
    data: {
      completionRate: medianCompletion,
      saveRate,
    },
  });

  return { completionRate: medianCompletion, saveRate };
}

// ============================================================================
// Promote a single topic
// ============================================================================

interface PromoteResult {
  promoted: boolean;
  decision: PromotionDecision;
  canonJobId?: string;
}

/**
 * Score a topic, evaluate promotion eligibility, and promote if ready.
 *
 * On promotion:
 * 1. Update Topic status to CANON
 * 2. Update canonScore and canonPromotedAt
 * 3. Create a CanonJob (QUEUED) for the remastering pipeline
 *
 * The actual remaster execution is handled separately by the CanonJob processor.
 */
export async function scoreAndPromote(topicId: string): Promise<PromoteResult> {
  // Refresh engagement signals from raw data
  await refreshSignals(topicId);

  // Fetch current topic state
  const topic = await db.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      status: true,
      requestCount: true,
      uniqueUsers: true,
      completionRate: true,
      saveRate: true,
      canonEpisodeId: true,
    },
  });

  if (!topic) {
    throw new Error(`Topic ${topicId} not found`);
  }

  // Already promoted — just update the score
  if (topic.status === 'CANON') {
    const score = computeCanonScore(topic);
    await db.topic.update({
      where: { id: topicId },
      data: { canonScore: score },
    });
    return {
      promoted: false,
      decision: { eligible: false, score, reasons: [], blockers: ['Already CANON'] },
    };
  }

  // Skip COLD topics
  if (topic.status === 'COLD') {
    return {
      promoted: false,
      decision: { eligible: false, score: 0, reasons: [], blockers: ['Topic is COLD'] },
    };
  }

  // Evaluate
  const decision = evaluatePromotion(topic);

  // Update score regardless of promotion
  await db.topic.update({
    where: { id: topicId },
    data: { canonScore: decision.score },
  });

  if (!decision.eligible) {
    return { promoted: false, decision };
  }

  // Promote! Pick the best existing episode as the canon candidate.
  // The remaster job will produce the final canon episode.
  const bestEpisode = await db.episode.findFirst({
    where: { topicId, status: 'READY' },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  // Create remaster job
  const canonJob = await db.canonJob.create({
    data: {
      topicId,
      status: 'QUEUED',
      // If we have an existing episode, the remaster can use its transcript as seed
      ...(bestEpisode ? { episodeId: bestEpisode.id } : {}),
    },
  });

  // Update topic status
  await db.topic.update({
    where: { id: topicId },
    data: {
      status: 'CANON',
      canonScore: decision.score,
      canonPromotedAt: new Date(),
      // Set the best existing episode as interim canon until remaster completes
      ...(bestEpisode ? { canonEpisodeId: bestEpisode.id } : {}),
    },
  });

  // Mark the interim canon episode
  if (bestEpisode) {
    await db.episode.update({
      where: { id: bestEpisode.id },
      data: { isCanon: true },
    });
  }

  return {
    promoted: true,
    decision,
    canonJobId: canonJob.id,
  };
}

// ============================================================================
// Batch evaluation (cron job entry point)
// ============================================================================

interface BatchResult {
  evaluated: number;
  promoted: string[];   // topic IDs that were promoted
  errors: string[];
}

/**
 * Evaluate all CANDIDATE topics for promotion.
 * Designed to run as a cron job (e.g., daily or hourly).
 *
 * Only evaluates topics with enough requests to potentially qualify,
 * avoiding unnecessary work on brand-new topics.
 */
export async function evaluateAllCandidates(): Promise<BatchResult> {
  const candidates = await db.topic.findMany({
    where: {
      status: 'CANDIDATE',
      requestCount: { gte: PROMOTION_THRESHOLDS.minRequests },
    },
    select: { id: true, slug: true },
    orderBy: { requestCount: 'desc' },
    take: 100, // Process top 100 per batch to avoid long-running jobs
  });

  const result: BatchResult = {
    evaluated: candidates.length,
    promoted: [],
    errors: [],
  };

  for (const candidate of candidates) {
    try {
      const { promoted } = await scoreAndPromote(candidate.id);
      if (promoted) {
        result.promoted.push(candidate.id);
        console.log(`[Canon] Promoted topic ${candidate.slug} (${candidate.id})`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`${candidate.id}: ${msg}`);
      console.error(`[Canon] Error evaluating ${candidate.slug}:`, e);
    }
  }

  console.log(
    `[Canon] Batch complete: ${result.evaluated} evaluated, ${result.promoted.length} promoted, ${result.errors.length} errors`
  );

  return result;
}
