/**
 * Monetization Optimizer Agent
 * Manages pricing, upgrade triggers, and subscription health
 */

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: PlanLimits;
  isPopular?: boolean;
  savings?: string;
}

export interface PlanLimits {
  episodesPerMonth: number | 'unlimited';
  maxLengthMinutes: number;
  dailyDrop: boolean;
  seriesMode: boolean;
  flashcards: boolean;
  priorityGeneration: boolean;
  customNarrator: boolean;
}

export interface UpgradeTrigger {
  id: string;
  name: string;
  description: string;
  condition: TriggerCondition;
  message: UpgradeMessage;
  placement: 'modal' | 'inline' | 'banner' | 'toast';
  priority: number; // Higher = show first
}

export interface TriggerCondition {
  type: 'limit_reached' | 'feature_blocked' | 'engagement_threshold' | 'time_based';
  params: Record<string, unknown>;
}

export interface UpgradeMessage {
  headline: string;
  body: string;
  cta: string;
  highlight?: string;
}

export interface SubscriptionHealth {
  totalSubscribers: number;
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  paybackPeriod: number;
  revenueByPlan: Record<string, number>;
  trialToPayConversion: number;
  upgrades: number;
  downgrades: number;
  cancellations: number;
}

// ============ PRICING PLANS ============

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '3 episodes per month',
      'Up to 10 minute episodes',
      'Standard generation speed',
      'Basic topic templates',
    ],
    limits: {
      episodesPerMonth: 3,
      maxLengthMinutes: 10,
      dailyDrop: false,
      seriesMode: false,
      flashcards: false,
      priorityGeneration: false,
      customNarrator: false,
    },
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: 12,
    interval: 'month',
    isPopular: true,
    features: [
      'Unlimited episodes',
      'Up to 20 minute episodes',
      'Daily Drop personalized episodes',
      '5-part series mode',
      'Flashcards & learning tools',
      'Priority generation',
    ],
    limits: {
      episodesPerMonth: 'unlimited',
      maxLengthMinutes: 20,
      dailyDrop: true,
      seriesMode: true,
      flashcards: true,
      priorityGeneration: true,
      customNarrator: false,
    },
  },
  {
    id: 'pro_yearly',
    name: 'Pro (Annual)',
    price: 99,
    interval: 'year',
    savings: 'Save 31%',
    features: [
      'Everything in Pro',
      '2 months free',
      'Custom narrator styles',
      'Early access to new features',
    ],
    limits: {
      episodesPerMonth: 'unlimited',
      maxLengthMinutes: 20,
      dailyDrop: true,
      seriesMode: true,
      flashcards: true,
      priorityGeneration: true,
      customNarrator: true,
    },
  },
];

// ============ UPGRADE TRIGGERS ============

export const UPGRADE_TRIGGERS: UpgradeTrigger[] = [
  {
    id: 'limit_reached',
    name: 'Episode Limit Reached',
    description: 'User has used all free episodes',
    condition: {
      type: 'limit_reached',
      params: { resource: 'episodes', remaining: 0 },
    },
    message: {
      headline: 'You\'ve used all your free episodes',
      body: 'Upgrade to Pro for unlimited learning',
      cta: 'Unlock Unlimited',
      highlight: 'Most popular choice',
    },
    placement: 'modal',
    priority: 100,
  },
  {
    id: 'daily_drop_blocked',
    name: 'Daily Drop Feature',
    description: 'User tries to use Daily Drop on free plan',
    condition: {
      type: 'feature_blocked',
      params: { feature: 'daily_drop' },
    },
    message: {
      headline: 'Daily Drop is a Pro feature',
      body: 'Get personalized episodes delivered fresh every day',
      cta: 'Start Learning Daily',
    },
    placement: 'modal',
    priority: 80,
  },
  {
    id: 'series_blocked',
    name: 'Series Mode Feature',
    description: 'User tries to create a series on free plan',
    condition: {
      type: 'feature_blocked',
      params: { feature: 'series_mode' },
    },
    message: {
      headline: 'Unlock Series Mode',
      body: 'Create 5-part deep dives on any topic',
      cta: 'Upgrade to Pro',
    },
    placement: 'modal',
    priority: 75,
  },
  {
    id: 'flashcards_blocked',
    name: 'Flashcards Feature',
    description: 'User tries to create flashcards on free plan',
    condition: {
      type: 'feature_blocked',
      params: { feature: 'flashcards' },
    },
    message: {
      headline: 'Retain what you learn',
      body: 'Flashcards with spaced repetition help you remember',
      cta: 'Unlock Learning Tools',
    },
    placement: 'inline',
    priority: 70,
  },
  {
    id: 'length_blocked',
    name: 'Episode Length',
    description: 'User tries to create episode longer than 10 min',
    condition: {
      type: 'feature_blocked',
      params: { feature: 'long_episodes', maxLength: 10 },
    },
    message: {
      headline: 'Go deeper with longer episodes',
      body: 'Pro lets you create up to 20 minute episodes',
      cta: 'Unlock Full Length',
    },
    placement: 'inline',
    priority: 60,
  },
  {
    id: 'high_engagement',
    name: 'High Engagement User',
    description: 'User has created 2+ episodes and finished them',
    condition: {
      type: 'engagement_threshold',
      params: { episodesCreated: 2, completionRate: 0.8 },
    },
    message: {
      headline: 'You\'re getting value from MindCast',
      body: 'Unlock unlimited episodes and never stop learning',
      cta: 'Continue Learning',
      highlight: 'Special offer for active learners',
    },
    placement: 'banner',
    priority: 50,
  },
  {
    id: 'second_visit',
    name: 'Return Visitor',
    description: 'User returns for second session',
    condition: {
      type: 'time_based',
      params: { sessionCount: 2, daysSinceSignup: 1 },
    },
    message: {
      headline: 'Welcome back!',
      body: 'Ready for unlimited learning?',
      cta: 'See Pro Features',
    },
    placement: 'toast',
    priority: 30,
  },
];

// ============ TRIGGER EVALUATION ============

export interface UserContext {
  plan: string;
  episodesUsed: number;
  episodesLimit: number;
  episodesCompleted: number;
  completionRate: number;
  sessionCount: number;
  daysSinceSignup: number;
  lastUpgradePrompt?: Date;
  dismissedTriggers: string[];
}

/**
 * Evaluate which upgrade trigger to show
 */
export function evaluateUpgradeTriggers(
  context: UserContext,
  action?: { type: string; params?: Record<string, unknown> }
): UpgradeTrigger | null {
  // Don't show if already pro
  if (context.plan !== 'free') return null;

  // Don't show if prompted recently (within 24h)
  if (context.lastUpgradePrompt) {
    const hoursSince = (Date.now() - context.lastUpgradePrompt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) return null;
  }

  // Find matching triggers, sorted by priority
  const matchingTriggers = UPGRADE_TRIGGERS
    .filter(trigger => {
      // Skip dismissed triggers
      if (context.dismissedTriggers.includes(trigger.id)) return false;

      const { type, params } = trigger.condition;

      switch (type) {
        case 'limit_reached':
          if (params.resource === 'episodes') {
            return context.episodesUsed >= context.episodesLimit;
          }
          return false;

        case 'feature_blocked':
          if (action?.type === 'feature_access') {
            return action.params?.feature === params.feature;
          }
          return false;

        case 'engagement_threshold':
          return (
            context.episodesCompleted >= (params.episodesCreated as number) &&
            context.completionRate >= (params.completionRate as number)
          );

        case 'time_based':
          return (
            context.sessionCount >= (params.sessionCount as number) &&
            context.daysSinceSignup >= (params.daysSinceSignup as number)
          );

        default:
          return false;
      }
    })
    .sort((a, b) => b.priority - a.priority);

  return matchingTriggers[0] || null;
}

// ============ SUBSCRIPTION ANALYTICS ============

/**
 * Calculate subscription health metrics
 */
export function calculateSubscriptionHealth(
  subscriptions: Array<{
    id: string;
    planId: string;
    price: number;
    status: 'active' | 'cancelled' | 'past_due';
    startDate: Date;
    endDate?: Date;
    cancelledAt?: Date;
  }>,
  previousPeriod?: { mrr: number; subscribers: number }
): SubscriptionHealth {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const active = subscriptions.filter(s => s.status === 'active');
  const cancelled = subscriptions.filter(s =>
    s.cancelledAt && s.cancelledAt >= thirtyDaysAgo
  );

  // MRR calculation
  const mrr = active.reduce((sum, s) => {
    const plan = PRICING_PLANS.find(p => p.id === s.planId);
    if (!plan) return sum;
    return sum + (plan.interval === 'year' ? plan.price / 12 : plan.price);
  }, 0);

  // Revenue by plan
  const revenueByPlan: Record<string, number> = {};
  active.forEach(s => {
    const plan = PRICING_PLANS.find(p => p.id === s.planId);
    if (!plan) return;
    const monthly = plan.interval === 'year' ? plan.price / 12 : plan.price;
    revenueByPlan[s.planId] = (revenueByPlan[s.planId] || 0) + monthly;
  });

  // Churn rate
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const cancelledThisMonth = subscriptions.filter(s =>
    s.cancelledAt && s.cancelledAt >= startOfMonth
  ).length;
  const activeAtStartOfMonth = subscriptions.filter(s =>
    s.startDate < startOfMonth && (!s.cancelledAt || s.cancelledAt >= startOfMonth)
  ).length;
  const churnRate = activeAtStartOfMonth > 0
    ? (cancelledThisMonth / activeAtStartOfMonth) * 100
    : 0;

  // LTV calculation (simplified: MRR / churn rate)
  const monthlyChurnRate = churnRate / 100;
  const avgMonthlyRevenue = mrr / Math.max(active.length, 1);
  const ltv = monthlyChurnRate > 0
    ? avgMonthlyRevenue / monthlyChurnRate
    : avgMonthlyRevenue * 24; // Assume 2 year lifetime if no churn

  // Payback period (months to recover CAC - assuming $10 CAC)
  const estimatedCAC = 10;
  const paybackPeriod = avgMonthlyRevenue > 0 ? estimatedCAC / avgMonthlyRevenue : 0;

  // Upgrades/downgrades (simplified - would need transaction history)
  const upgrades = subscriptions.filter(s =>
    s.startDate >= thirtyDaysAgo &&
    s.planId.includes('pro')
  ).length;

  return {
    totalSubscribers: active.length,
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    churnRate: Math.round(churnRate * 10) / 10,
    ltv: Math.round(ltv * 100) / 100,
    paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    revenueByPlan,
    trialToPayConversion: 0, // Would need trial data
    upgrades,
    downgrades: 0, // Would need transaction history
    cancellations: cancelled.length,
  };
}

/**
 * Generate monetization recommendations
 */
export function generateMonetizationRecommendations(
  health: SubscriptionHealth,
  userBehavior: {
    avgEpisodesBeforeUpgrade: number;
    topUpgradeTriggers: string[];
    commonCancellationReasons: string[];
  }
): string[] {
  const recommendations: string[] = [];

  // Churn recommendations
  if (health.churnRate > 5) {
    recommendations.push(
      `High churn rate (${health.churnRate}%). Consider:` +
      `\n  - Exit survey to understand reasons` +
      `\n  - Win-back email sequence` +
      `\n  - Annual plan incentives`
    );
  }

  // LTV recommendations
  if (health.ltv < 50) {
    recommendations.push(
      `Low LTV ($${health.ltv}). Focus on:` +
      `\n  - Improving retention (streaks, challenges)` +
      `\n  - Upselling annual plans` +
      `\n  - Adding premium features`
    );
  }

  // Conversion recommendations
  if (userBehavior.avgEpisodesBeforeUpgrade > 2.5) {
    recommendations.push(
      `Users create ${userBehavior.avgEpisodesBeforeUpgrade} episodes before upgrading. Consider:` +
      `\n  - Reducing free tier to 2 episodes` +
      `\n  - Earlier upgrade prompts` +
      `\n  - Time-limited trial of Pro features`
    );
  }

  // Plan mix recommendations
  const monthlyRevenue = health.revenueByPlan['pro_monthly'] || 0;
  const yearlyRevenue = health.revenueByPlan['pro_yearly'] || 0;
  const yearlyPercent = (yearlyRevenue / (monthlyRevenue + yearlyRevenue)) * 100;

  if (yearlyPercent < 40) {
    recommendations.push(
      `Only ${Math.round(yearlyPercent)}% on annual plans. To increase:` +
      `\n  - Offer larger annual discount` +
      `\n  - Highlight annual savings more prominently` +
      `\n  - Add annual-only features`
    );
  }

  // Pricing experiment suggestions
  if (health.mrr > 1000 && health.totalSubscribers > 100) {
    recommendations.push(
      `Consider testing:` +
      `\n  - $15/mo price point (vs $12)` +
      `\n  - Team/family plan` +
      `\n  - Student discount`
    );
  }

  return recommendations;
}

// ============ EXIT SURVEY ============

export interface ExitSurvey {
  reason: string;
  subreason?: string;
  feedback?: string;
  wouldReturn?: boolean;
  pricePoint?: number;
}

export const EXIT_SURVEY_REASONS = [
  {
    id: 'too_expensive',
    label: 'Too expensive',
    subreasons: ['Found a free alternative', 'Budget constraints', 'Not enough value for price'],
    followUp: 'What price would work for you?',
  },
  {
    id: 'not_using',
    label: 'Not using it enough',
    subreasons: ['Too busy', 'Forgot about it', 'Finished learning what I needed'],
    followUp: 'What would make you use it more?',
  },
  {
    id: 'missing_features',
    label: 'Missing features I need',
    subreasons: ['Need offline mode', 'Want different voices', 'Need better content'],
    followUp: 'What feature would bring you back?',
  },
  {
    id: 'quality_issues',
    label: 'Quality wasn\'t good enough',
    subreasons: ['Episodes were inaccurate', 'Audio quality issues', 'Topics too shallow'],
    followUp: 'Can you share a specific example?',
  },
  {
    id: 'other',
    label: 'Other',
    subreasons: [],
    followUp: 'Please tell us more',
  },
];

/**
 * Analyze exit surveys for insights
 */
export function analyzeExitSurveys(
  surveys: ExitSurvey[]
): {
  topReasons: { reason: string; count: number; percent: number }[];
  avgWillingPrice: number;
  returnLikelihood: number;
  actionableInsights: string[];
} {
  const reasonCounts: Record<string, number> = {};
  let priceSum = 0;
  let priceCount = 0;
  let returnYes = 0;
  let returnTotal = 0;

  surveys.forEach(survey => {
    reasonCounts[survey.reason] = (reasonCounts[survey.reason] || 0) + 1;

    if (survey.pricePoint && survey.pricePoint > 0) {
      priceSum += survey.pricePoint;
      priceCount++;
    }

    if (survey.wouldReturn !== undefined) {
      returnTotal++;
      if (survey.wouldReturn) returnYes++;
    }
  });

  const topReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason,
      count,
      percent: Math.round((count / surveys.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const actionableInsights: string[] = [];

  // Generate insights
  if (topReasons[0]?.reason === 'too_expensive' && topReasons[0].percent > 30) {
    actionableInsights.push('Price sensitivity is high. Consider testing lower price point or longer free tier.');
  }

  if (topReasons.find(r => r.reason === 'not_using' && r.percent > 25)) {
    actionableInsights.push('Engagement is an issue. Focus on Daily Drop, notifications, and habit formation.');
  }

  if (topReasons.find(r => r.reason === 'quality_issues' && r.percent > 20)) {
    actionableInsights.push('Quality concerns need addressing. Review Episode Quality Auditor findings.');
  }

  return {
    topReasons,
    avgWillingPrice: priceCount > 0 ? Math.round(priceSum / priceCount * 100) / 100 : 0,
    returnLikelihood: returnTotal > 0 ? Math.round((returnYes / returnTotal) * 100) : 0,
    actionableInsights,
  };
}
