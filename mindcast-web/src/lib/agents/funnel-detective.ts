/**
 * Funnel & Retention Detective Agent
 * Tracks user journey, identifies drop-offs, and explains churn
 */

export interface FunnelStage {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface FunnelMetrics {
  stage: string;
  entered: number;
  completed: number;
  dropOff: number;
  dropOffRate: number;
  avgTimeInStage?: number; // seconds
}

export interface CohortMetrics {
  cohort: string;
  users: number;
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  conversionRate: number;
  avgEpisodesPerUser: number;
  avgListenMinutes: number;
}

export interface ChurnSignal {
  userId: string;
  signal: string;
  severity: 'low' | 'medium' | 'high';
  daysSinceLastActivity: number;
  recommendation: string;
}

// ============ FUNNEL STAGES ============

export const CORE_FUNNEL_STAGES: FunnelStage[] = [
  { id: 'visit', name: 'Visit', description: 'User visits the site', order: 0 },
  { id: 'signup', name: 'Sign Up', description: 'User creates account', order: 1 },
  { id: 'topic_entered', name: 'Topic Entered', description: 'User enters first topic', order: 2 },
  { id: 'generation_started', name: 'Generation Started', description: 'User starts first episode', order: 3 },
  { id: 'preview_played', name: 'Preview Played', description: 'User plays preview audio', order: 4 },
  { id: 'listened_30s', name: '30s Listened', description: 'User listens for 30+ seconds', order: 5 },
  { id: 'episode_finished', name: 'Episode Finished', description: 'User finishes first episode', order: 6 },
  { id: 'second_episode', name: '2nd Episode', description: 'User creates second episode', order: 7 },
  { id: 'converted', name: 'Converted', description: 'User upgrades to paid', order: 8 },
];

// ============ EVENT TRACKING ============

export interface TrackingEvent {
  userId: string;
  sessionId: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  referrer?: string;
}

export const TRACKING_EVENTS = {
  // Funnel events
  PAGE_VIEW: 'page_view',
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_COMPLETED: 'sign_up_completed',
  TOPIC_ENTERED: 'topic_entered',
  GENERATION_STARTED: 'generation_started',
  PREVIEW_PLAYED: 'preview_played',
  EPISODE_PLAY: 'episode_play',
  EPISODE_PAUSE: 'episode_pause',
  EPISODE_SEEK: 'episode_seek',
  EPISODE_PROGRESS: 'episode_progress',
  EPISODE_FINISHED: 'episode_finished',

  // Engagement events
  FLASHCARD_CREATED: 'flashcard_created',
  FLASHCARD_STUDIED: 'flashcard_studied',
  SHARE_CLICKED: 'share_clicked',
  SHARE_COMPLETED: 'share_completed',
  PLAYLIST_CREATED: 'playlist_created',
  PACK_STARTED: 'pack_started',
  PACK_COMPLETED: 'pack_completed',

  // Monetization events
  PRICING_VIEWED: 'pricing_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Error events
  GENERATION_FAILED: 'generation_failed',
  PLAYBACK_ERROR: 'playback_error',
  PAGE_ERROR: 'page_error',
} as const;

// ============ ANALYTICS HELPERS ============

/**
 * Calculate funnel metrics from event data
 */
export function calculateFunnelMetrics(
  events: TrackingEvent[],
  stages: FunnelStage[]
): FunnelMetrics[] {
  const stageEventMap: Record<string, string> = {
    visit: TRACKING_EVENTS.PAGE_VIEW,
    signup: TRACKING_EVENTS.SIGN_UP_COMPLETED,
    topic_entered: TRACKING_EVENTS.TOPIC_ENTERED,
    generation_started: TRACKING_EVENTS.GENERATION_STARTED,
    preview_played: TRACKING_EVENTS.PREVIEW_PLAYED,
    listened_30s: TRACKING_EVENTS.EPISODE_PROGRESS,
    episode_finished: TRACKING_EVENTS.EPISODE_FINISHED,
    second_episode: TRACKING_EVENTS.GENERATION_STARTED,
    converted: TRACKING_EVENTS.PURCHASE_COMPLETED,
  };

  const usersByStage: Record<string, Set<string>> = {};
  stages.forEach(stage => {
    usersByStage[stage.id] = new Set();
  });

  // Group events by user and determine furthest stage reached
  const userStages: Record<string, number> = {};
  const userEpisodeCounts: Record<string, number> = {};

  events.forEach(event => {
    const stage = Object.entries(stageEventMap).find(([_, e]) => e === event.event);
    if (stage) {
      const [stageId] = stage;
      const stageOrder = stages.find(s => s.id === stageId)?.order ?? -1;

      // Handle special case for second episode
      if (stageId === 'generation_started') {
        userEpisodeCounts[event.userId] = (userEpisodeCounts[event.userId] || 0) + 1;
        if (userEpisodeCounts[event.userId] >= 2) {
          const secondEpOrder = stages.find(s => s.id === 'second_episode')?.order ?? -1;
          userStages[event.userId] = Math.max(userStages[event.userId] || 0, secondEpOrder);
        }
      }

      // Handle 30s listened (check properties)
      if (event.event === TRACKING_EVENTS.EPISODE_PROGRESS) {
        const progress = event.properties?.progress as number;
        if (progress && progress >= 30) {
          const listenedOrder = stages.find(s => s.id === 'listened_30s')?.order ?? -1;
          userStages[event.userId] = Math.max(userStages[event.userId] || 0, listenedOrder);
        }
      }

      userStages[event.userId] = Math.max(userStages[event.userId] || 0, stageOrder);
    }
  });

  // Populate users per stage (cumulative - if reached stage 5, also counts for 0-4)
  Object.entries(userStages).forEach(([userId, maxStage]) => {
    stages.forEach(stage => {
      if (stage.order <= maxStage) {
        usersByStage[stage.id].add(userId);
      }
    });
  });

  // Calculate metrics
  return stages.map((stage, i) => {
    const entered = usersByStage[stage.id].size;
    const nextStage = stages[i + 1];
    const completed = nextStage ? usersByStage[nextStage.id].size : entered;
    const dropOff = entered - completed;
    const dropOffRate = entered > 0 ? (dropOff / entered) * 100 : 0;

    return {
      stage: stage.name,
      entered,
      completed,
      dropOff,
      dropOffRate: Math.round(dropOffRate * 10) / 10,
    };
  });
}

/**
 * Identify top drop-off points with recommendations
 */
export function identifyDropOffPoints(
  metrics: FunnelMetrics[]
): { stage: string; dropOffRate: number; recommendation: string }[] {
  const recommendations: Record<string, string> = {
    'Visit': 'Improve landing page clarity and value proposition',
    'Sign Up': 'Simplify signup flow; consider social login',
    'Topic Entered': 'Add better topic suggestions and templates',
    'Generation Started': 'Show estimated time; add loading engagement',
    'Preview Played': 'Auto-play preview; make play button more prominent',
    '30s Listened': 'Check audio quality; improve opening hook',
    'Episode Finished': 'Add engagement features (flashcards, quiz)',
    '2nd Episode': 'Send follow-up email; show Daily Drop',
    'Converted': 'Test pricing; improve paywall messaging',
  };

  return metrics
    .filter(m => m.dropOffRate > 10) // Only significant drop-offs
    .sort((a, b) => b.dropOffRate - a.dropOffRate)
    .slice(0, 3) // Top 3 leaks
    .map(m => ({
      stage: m.stage,
      dropOffRate: m.dropOffRate,
      recommendation: recommendations[m.stage] || 'Investigate user feedback',
    }));
}

// ============ COHORT ANALYSIS ============

export type CohortType = 'signup_week' | 'plan_type' | 'acquisition_source' | 'device_type';

/**
 * Generate cohort breakdown
 */
export function generateCohortAnalysis(
  users: Array<{
    id: string;
    createdAt: Date;
    plan: string;
    source?: string;
    deviceType?: string;
    episodeCount: number;
    totalListenMinutes: number;
    lastActiveAt: Date;
  }>,
  cohortType: CohortType = 'signup_week'
): CohortMetrics[] {
  const cohorts: Record<string, typeof users> = {};

  // Group users into cohorts
  users.forEach(user => {
    let cohortKey: string;

    switch (cohortType) {
      case 'signup_week':
        const weekStart = new Date(user.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        cohortKey = weekStart.toISOString().split('T')[0];
        break;
      case 'plan_type':
        cohortKey = user.plan;
        break;
      case 'acquisition_source':
        cohortKey = user.source || 'organic';
        break;
      case 'device_type':
        cohortKey = user.deviceType || 'unknown';
        break;
      default:
        cohortKey = 'all';
    }

    if (!cohorts[cohortKey]) {
      cohorts[cohortKey] = [];
    }
    cohorts[cohortKey].push(user);
  });

  // Calculate metrics per cohort
  const now = new Date();

  return Object.entries(cohorts).map(([cohort, cohortUsers]) => {
    const totalUsers = cohortUsers.length;

    // Calculate retention
    const day1Active = cohortUsers.filter(u => {
      const daysSinceSignup = Math.floor((now.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceActive = Math.floor((now.getTime() - u.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceSignup >= 1 && daysSinceActive <= daysSinceSignup - 1;
    }).length;

    const day7Active = cohortUsers.filter(u => {
      const daysSinceSignup = Math.floor((now.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceActive = Math.floor((now.getTime() - u.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceSignup >= 7 && daysSinceActive <= daysSinceSignup - 7;
    }).length;

    const day30Active = cohortUsers.filter(u => {
      const daysSinceSignup = Math.floor((now.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceActive = Math.floor((now.getTime() - u.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceSignup >= 30 && daysSinceActive <= daysSinceSignup - 30;
    }).length;

    // Calculate conversion
    const converted = cohortUsers.filter(u => u.plan !== 'free').length;

    // Calculate engagement
    const totalEpisodes = cohortUsers.reduce((sum, u) => sum + u.episodeCount, 0);
    const totalMinutes = cohortUsers.reduce((sum, u) => sum + u.totalListenMinutes, 0);

    return {
      cohort,
      users: totalUsers,
      day1Retention: totalUsers > 0 ? Math.round((day1Active / totalUsers) * 100) : 0,
      day7Retention: totalUsers > 0 ? Math.round((day7Active / totalUsers) * 100) : 0,
      day30Retention: totalUsers > 0 ? Math.round((day30Active / totalUsers) * 100) : 0,
      conversionRate: totalUsers > 0 ? Math.round((converted / totalUsers) * 100) : 0,
      avgEpisodesPerUser: totalUsers > 0 ? Math.round((totalEpisodes / totalUsers) * 10) / 10 : 0,
      avgListenMinutes: totalUsers > 0 ? Math.round(totalMinutes / totalUsers) : 0,
    };
  });
}

// ============ CHURN DETECTION ============

/**
 * Identify users at risk of churning
 */
export function detectChurnRisk(
  users: Array<{
    id: string;
    plan: string;
    episodeCount: number;
    lastActiveAt: Date;
    daysSinceLastEpisode: number;
    completionRate: number;
  }>
): ChurnSignal[] {
  const signals: ChurnSignal[] = [];
  const now = new Date();

  users.forEach(user => {
    const daysSinceActive = Math.floor(
      (now.getTime() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Signal 1: No activity after first episode
    if (user.episodeCount === 1 && daysSinceActive > 3) {
      signals.push({
        userId: user.id,
        signal: 'One episode, then inactive for 3+ days',
        severity: 'high',
        daysSinceLastActivity: daysSinceActive,
        recommendation: 'Send "Your next episode awaits" email with topic suggestion',
      });
    }

    // Signal 2: Paying user going inactive
    if (user.plan !== 'free' && daysSinceActive > 7) {
      signals.push({
        userId: user.id,
        signal: 'Paying subscriber inactive for 7+ days',
        severity: 'high',
        daysSinceLastActivity: daysSinceActive,
        recommendation: 'Personal check-in email; offer help or topic ideas',
      });
    }

    // Signal 3: Low completion rate
    if (user.episodeCount >= 3 && user.completionRate < 30) {
      signals.push({
        userId: user.id,
        signal: 'Low episode completion rate (<30%)',
        severity: 'medium',
        daysSinceLastActivity: daysSinceActive,
        recommendation: 'Survey for feedback on content quality; suggest shorter episodes',
      });
    }

    // Signal 4: Infrequent user becoming more inactive
    if (user.daysSinceLastEpisode > 14 && daysSinceActive > 7) {
      signals.push({
        userId: user.id,
        signal: 'Slowing engagement pattern',
        severity: 'medium',
        daysSinceLastActivity: daysSinceActive,
        recommendation: 'Send Daily Drop reminder or new feature announcement',
      });
    }
  });

  return signals.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ============ REPORTING ============

/**
 * Generate weekly analytics summary
 */
export function generateWeeklySummary(
  funnelMetrics: FunnelMetrics[],
  cohortMetrics: CohortMetrics[],
  churnSignals: ChurnSignal[]
): string {
  const dropOffs = identifyDropOffPoints(funnelMetrics);
  const highRiskChurn = churnSignals.filter(s => s.severity === 'high');

  let summary = `# Weekly Analytics Summary\n\n`;

  // Funnel overview
  summary += `## Funnel Health\n`;
  funnelMetrics.forEach(m => {
    const indicator = m.dropOffRate > 30 ? '🔴' : m.dropOffRate > 15 ? '🟡' : '🟢';
    summary += `- ${indicator} ${m.stage}: ${m.entered} entered, ${m.dropOffRate}% drop-off\n`;
  });

  // Top leaks
  summary += `\n## Top 3 Leaks\n`;
  dropOffs.forEach((leak, i) => {
    summary += `${i + 1}. **${leak.stage}** (${leak.dropOffRate}% drop-off)\n`;
    summary += `   → ${leak.recommendation}\n`;
  });

  // Retention highlights
  const latestCohort = cohortMetrics[cohortMetrics.length - 1];
  if (latestCohort) {
    summary += `\n## Latest Cohort (${latestCohort.cohort})\n`;
    summary += `- Users: ${latestCohort.users}\n`;
    summary += `- D1 Retention: ${latestCohort.day1Retention}%\n`;
    summary += `- D7 Retention: ${latestCohort.day7Retention}%\n`;
    summary += `- Conversion: ${latestCohort.conversionRate}%\n`;
  }

  // Churn alerts
  summary += `\n## Churn Alerts\n`;
  summary += `- High risk users: ${highRiskChurn.length}\n`;
  if (highRiskChurn.length > 0) {
    summary += `- Top signals:\n`;
    highRiskChurn.slice(0, 3).forEach(signal => {
      summary += `  - ${signal.signal}\n`;
    });
  }

  return summary;
}
