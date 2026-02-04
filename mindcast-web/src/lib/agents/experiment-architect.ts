/**
 * Experiment Architect Agent
 * Manages A/B tests, feature flags, and experiment analysis
 */

export interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'shipped' | 'rolled_back';
  startDate?: Date;
  endDate?: Date;
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  guardrails: GuardrailMetric[];
  targetAudience?: AudienceFilter;
  trafficAllocation: number; // 0-100, percentage of eligible users
  results?: ExperimentResults;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100, percentage within experiment
  isControl: boolean;
  config: Record<string, unknown>;
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'count' | 'revenue' | 'time' | 'percentage';
  event: string;
  isPrimary: boolean;
  minDetectableEffect?: number; // Percentage improvement we want to detect
}

export interface GuardrailMetric {
  id: string;
  name: string;
  event: string;
  threshold: number;
  direction: 'above' | 'below'; // Alert if metric goes above/below threshold
}

export interface AudienceFilter {
  plans?: string[];
  countries?: string[];
  devices?: string[];
  minEpisodes?: number;
  signupAfter?: Date;
  signupBefore?: Date;
  percentile?: number; // Random sampling
}

export interface ExperimentResults {
  sampleSize: number;
  duration: number; // days
  variants: VariantResult[];
  winner?: string;
  confidence: number;
  recommendation: 'ship' | 'iterate' | 'rollback' | 'continue';
}

export interface VariantResult {
  variantId: string;
  sampleSize: number;
  metrics: Record<string, MetricResult>;
}

export interface MetricResult {
  value: number;
  change: number; // vs control
  changePercent: number;
  confidence: number;
  isSignificant: boolean;
}

// ============ EXPERIMENT TEMPLATES ============

export const EXPERIMENT_TEMPLATES: Partial<Experiment>[] = [
  {
    name: 'Pricing Page Copy Test',
    description: 'Test different value propositions on pricing page',
    hypothesis: 'Emphasizing "unlimited learning" will increase conversion vs feature list',
    metrics: [
      { id: 'm1', name: 'Checkout Started', type: 'conversion', event: 'checkout_started', isPrimary: true },
      { id: 'm2', name: 'Purchase Completed', type: 'conversion', event: 'purchase_completed', isPrimary: false },
    ],
    guardrails: [
      { id: 'g1', name: 'Page Bounce Rate', event: 'page_bounce', threshold: 60, direction: 'below' },
    ],
    variants: [
      { id: 'control', name: 'Control', description: 'Current feature list', weight: 50, isControl: true, config: {} },
      { id: 'variant_a', name: 'Value Focus', description: 'Unlimited learning messaging', weight: 50, isControl: false, config: { headline: 'Unlimited Learning, One Price' } },
    ],
    trafficAllocation: 100,
  },
  {
    name: 'Episode Length Default',
    description: 'Test default episode length selection',
    hypothesis: '10 min default will have higher completion than 15 min',
    metrics: [
      { id: 'm1', name: 'Episode Completion', type: 'percentage', event: 'episode_finished', isPrimary: true },
      { id: 'm2', name: 'Second Episode Created', type: 'conversion', event: 'second_episode', isPrimary: false },
    ],
    guardrails: [
      { id: 'g1', name: 'Generation Cancellation', event: 'generation_cancelled', threshold: 15, direction: 'below' },
    ],
    variants: [
      { id: 'control', name: '15 min default', description: 'Current default', weight: 50, isControl: true, config: { defaultLength: '15 min' } },
      { id: 'variant_a', name: '10 min default', description: 'Shorter default', weight: 50, isControl: false, config: { defaultLength: '10 min' } },
    ],
    trafficAllocation: 50,
  },
  {
    name: 'Daily Drop Timing',
    description: 'Test when to prompt for Daily Drop',
    hypothesis: 'Prompting after first episode will increase adoption vs homepage only',
    metrics: [
      { id: 'm1', name: 'Daily Drop Generated', type: 'conversion', event: 'daily_drop_created', isPrimary: true },
      { id: 'm2', name: 'D7 Retention', type: 'percentage', event: 'day_7_active', isPrimary: false },
    ],
    guardrails: [
      { id: 'g1', name: 'User Annoyance', event: 'prompt_dismissed_angry', threshold: 5, direction: 'below' },
    ],
    variants: [
      { id: 'control', name: 'Homepage Only', description: 'Current placement', weight: 50, isControl: true, config: { promptLocation: 'homepage' } },
      { id: 'variant_a', name: 'Post-Episode', description: 'Prompt after first episode', weight: 50, isControl: false, config: { promptLocation: 'post_episode' } },
    ],
    trafficAllocation: 100,
  },
  {
    name: 'Onboarding Length',
    description: 'Test 1-step vs 3-step onboarding',
    hypothesis: 'Shorter onboarding will increase completion and first episode creation',
    metrics: [
      { id: 'm1', name: 'Onboarding Complete', type: 'conversion', event: 'onboarding_completed', isPrimary: true },
      { id: 'm2', name: 'First Episode Created', type: 'conversion', event: 'first_episode_created', isPrimary: false },
    ],
    guardrails: [
      { id: 'g1', name: 'Personalization Quality', event: 'irrelevant_recommendation', threshold: 20, direction: 'below' },
    ],
    variants: [
      { id: 'control', name: '3-Step', description: 'Full onboarding', weight: 50, isControl: true, config: { steps: 3 } },
      { id: 'variant_a', name: '1-Step', description: 'Quick start', weight: 50, isControl: false, config: { steps: 1 } },
    ],
    trafficAllocation: 50,
  },
];

// ============ ASSIGNMENT LOGIC ============

/**
 * Deterministically assign user to experiment variant
 */
export function assignVariant(
  userId: string,
  experiment: Experiment
): ExperimentVariant | null {
  // Check if experiment is running
  if (experiment.status !== 'running') return null;

  // Hash user ID to get consistent assignment
  const hash = hashString(`${userId}-${experiment.id}`);
  const bucket = hash % 100;

  // Check traffic allocation
  if (bucket >= experiment.trafficAllocation) return null;

  // Assign to variant based on weights
  let cumulative = 0;
  const variantBucket = hash % 100;

  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (variantBucket < cumulative) {
      return variant;
    }
  }

  return experiment.variants[0]; // Fallback to first variant
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if user matches audience filter
 */
export function matchesAudience(
  user: {
    plan: string;
    country?: string;
    device?: string;
    episodeCount: number;
    createdAt: Date;
  },
  filter?: AudienceFilter
): boolean {
  if (!filter) return true;

  if (filter.plans && !filter.plans.includes(user.plan)) return false;
  if (filter.countries && user.country && !filter.countries.includes(user.country)) return false;
  if (filter.devices && user.device && !filter.devices.includes(user.device)) return false;
  if (filter.minEpisodes && user.episodeCount < filter.minEpisodes) return false;
  if (filter.signupAfter && user.createdAt < filter.signupAfter) return false;
  if (filter.signupBefore && user.createdAt > filter.signupBefore) return false;

  return true;
}

// ============ ANALYSIS ============

/**
 * Calculate sample size needed for experiment
 */
export function calculateSampleSize(
  baselineConversion: number, // e.g., 0.05 for 5%
  minDetectableEffect: number, // e.g., 0.2 for 20% relative improvement
  power = 0.8,
  significance = 0.05
): number {
  // Simplified sample size calculation
  // For more accuracy, use proper statistical libraries

  const alpha = significance;
  const beta = 1 - power;

  // Z-scores
  const zAlpha = 1.96; // 95% confidence
  const zBeta = 0.84; // 80% power

  const p1 = baselineConversion;
  const p2 = baselineConversion * (1 + minDetectableEffect);

  const pooledP = (p1 + p2) / 2;
  const effect = Math.abs(p2 - p1);

  const n = (2 * pooledP * (1 - pooledP) * Math.pow(zAlpha + zBeta, 2)) / Math.pow(effect, 2);

  return Math.ceil(n);
}

/**
 * Analyze experiment results
 */
export function analyzeExperiment(
  experiment: Experiment,
  data: Array<{
    variantId: string;
    userId: string;
    events: Record<string, number>;
  }>
): ExperimentResults {
  const control = experiment.variants.find(v => v.isControl);
  if (!control) throw new Error('No control variant found');

  const variantResults: VariantResult[] = [];

  experiment.variants.forEach(variant => {
    const variantData = data.filter(d => d.variantId === variant.id);
    const sampleSize = variantData.length;

    const metrics: Record<string, MetricResult> = {};

    experiment.metrics.forEach(metric => {
      // Calculate metric value for this variant
      const totalEvents = variantData.reduce((sum, d) => sum + (d.events[metric.event] || 0), 0);
      const value = metric.type === 'conversion'
        ? (totalEvents / sampleSize) * 100
        : totalEvents / sampleSize;

      // Calculate vs control
      const controlData = data.filter(d => d.variantId === control.id);
      const controlEvents = controlData.reduce((sum, d) => sum + (d.events[metric.event] || 0), 0);
      const controlValue = metric.type === 'conversion'
        ? (controlEvents / controlData.length) * 100
        : controlEvents / controlData.length;

      const change = value - controlValue;
      const changePercent = controlValue > 0 ? ((value - controlValue) / controlValue) * 100 : 0;

      // Simplified significance calculation
      const se = Math.sqrt((controlValue * (100 - controlValue)) / controlData.length +
                          (value * (100 - value)) / sampleSize);
      const zScore = se > 0 ? Math.abs(change) / se : 0;
      const confidence = Math.min(99.9, (1 - Math.exp(-0.5 * zScore * zScore)) * 100);
      const isSignificant = confidence >= 95;

      metrics[metric.id] = {
        value: Math.round(value * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 10) / 10,
        confidence: Math.round(confidence * 10) / 10,
        isSignificant,
      };
    });

    variantResults.push({
      variantId: variant.id,
      sampleSize,
      metrics,
    });
  });

  // Determine winner
  const primaryMetric = experiment.metrics.find(m => m.isPrimary);
  let winner: string | undefined;
  let maxImprovement = 0;

  if (primaryMetric) {
    variantResults.forEach(result => {
      if (result.variantId === control.id) return;

      const metricResult = result.metrics[primaryMetric.id];
      if (metricResult.isSignificant && metricResult.changePercent > maxImprovement) {
        maxImprovement = metricResult.changePercent;
        winner = result.variantId;
      }
    });
  }

  // Calculate overall confidence
  const avgConfidence = variantResults.reduce((sum, r) => {
    const primaryResult = primaryMetric ? r.metrics[primaryMetric.id] : null;
    return sum + (primaryResult?.confidence || 0);
  }, 0) / variantResults.length;

  // Determine recommendation
  let recommendation: 'ship' | 'iterate' | 'rollback' | 'continue';
  const totalSamples = variantResults.reduce((sum, r) => sum + r.sampleSize, 0);

  if (winner && avgConfidence >= 95) {
    recommendation = 'ship';
  } else if (avgConfidence < 80 && totalSamples < 1000) {
    recommendation = 'continue';
  } else if (maxImprovement < 0 && avgConfidence >= 90) {
    recommendation = 'rollback';
  } else {
    recommendation = 'iterate';
  }

  const startDate = experiment.startDate || new Date();
  const duration = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    sampleSize: totalSamples,
    duration,
    variants: variantResults,
    winner,
    confidence: Math.round(avgConfidence * 10) / 10,
    recommendation,
  };
}

/**
 * Generate experiment decision memo
 */
export function generateDecisionMemo(experiment: Experiment): string {
  if (!experiment.results) return 'No results available';

  const { results } = experiment;
  const control = experiment.variants.find(v => v.isControl);
  const winningVariant = results.winner
    ? experiment.variants.find(v => v.id === results.winner)
    : null;

  let memo = `# Experiment Decision Memo\n\n`;
  memo += `**Experiment:** ${experiment.name}\n`;
  memo += `**Status:** ${experiment.status}\n`;
  memo += `**Duration:** ${results.duration} days\n`;
  memo += `**Sample Size:** ${results.sampleSize.toLocaleString()} users\n\n`;

  memo += `## Hypothesis\n${experiment.hypothesis}\n\n`;

  memo += `## Results Summary\n`;
  results.variants.forEach(variant => {
    const v = experiment.variants.find(x => x.id === variant.variantId);
    memo += `\n### ${v?.name || variant.variantId} (n=${variant.sampleSize})\n`;

    Object.entries(variant.metrics).forEach(([metricId, result]) => {
      const metric = experiment.metrics.find(m => m.id === metricId);
      const indicator = result.isSignificant
        ? (result.changePercent > 0 ? '✅' : '❌')
        : '⏳';

      memo += `- ${indicator} ${metric?.name}: ${result.value}`;
      if (!v?.isControl) {
        memo += ` (${result.changePercent > 0 ? '+' : ''}${result.changePercent}%, ${result.confidence}% confidence)`;
      }
      memo += '\n';
    });
  });

  memo += `\n## Decision: **${results.recommendation.toUpperCase()}**\n\n`;

  switch (results.recommendation) {
    case 'ship':
      memo += `🚀 Winner: **${winningVariant?.name}** with ${results.confidence}% confidence.\n`;
      memo += `Recommendation: Ship to 100% of users.`;
      break;
    case 'iterate':
      memo += `🔄 No clear winner. Consider:\n`;
      memo += `- Testing a stronger variation\n`;
      memo += `- Running for longer\n`;
      memo += `- Segmenting by user type`;
      break;
    case 'rollback':
      memo += `⚠️ Control performs better. Roll back to original.`;
      break;
    case 'continue':
      memo += `⏳ Insufficient data. Continue running experiment.`;
      break;
  }

  return memo;
}
