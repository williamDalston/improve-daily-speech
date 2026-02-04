/**
 * Performance & Cost Controller Agent
 * Tracks per-episode costs and identifies optimization opportunities
 */

export interface CostBreakdown {
  research: CostItem;
  drafting: CostItem;
  enhancement: CostItem;
  tts: CostItem;
  storage: CostItem;
  total: number;
  totalTokens: number;
  audioDurationSecs: number;
}

export interface CostItem {
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  audioSeconds?: number;
  storageMb?: number;
  cost: number;
}

// Pricing constants (as of 2024, update as needed)
const PRICING = {
  // OpenAI
  'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },

  // Anthropic
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-3-opus': { input: 0.015, output: 0.075 },

  // TTS
  'elevenlabs': 0.30, // per 1K characters (~150 words)
  'openai-tts': 0.015, // per 1K characters
  'openai-tts-hd': 0.030,

  // Storage (R2/S3)
  'storage': 0.015, // per GB/month
  'egress': 0.045, // per GB
};

/**
 * Calculate cost for LLM usage
 */
export function calculateLLMCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model as keyof typeof PRICING];
  if (!pricing || typeof pricing !== 'object') {
    console.warn(`Unknown model pricing: ${model}`);
    return 0;
  }

  const { input, output } = pricing as { input: number; output: number };
  return (inputTokens / 1000) * input + (outputTokens / 1000) * output;
}

/**
 * Calculate cost for TTS
 */
export function calculateTTSCost(
  provider: string,
  characterCount: number
): number {
  const pricePerK = PRICING[provider as keyof typeof PRICING];
  if (typeof pricePerK !== 'number') {
    console.warn(`Unknown TTS pricing: ${provider}`);
    return 0;
  }
  return (characterCount / 1000) * pricePerK;
}

/**
 * Calculate storage cost
 */
export function calculateStorageCost(sizeMb: number): number {
  return (sizeMb / 1024) * PRICING.storage;
}

/**
 * Estimate episode cost from parameters
 */
export function estimateEpisodeCost(params: {
  lengthMinutes: number;
  researchModel?: string;
  draftingModel?: string;
  enhancementModel?: string;
  ttsProvider?: string;
}): CostBreakdown {
  const {
    lengthMinutes,
    researchModel = 'gpt-4o-mini',
    draftingModel = 'claude-3-5-sonnet',
    enhancementModel = 'gpt-4o-mini',
    ttsProvider = 'openai-tts',
  } = params;

  // Estimate tokens based on length
  const wordsPerMinute = 150;
  const totalWords = lengthMinutes * wordsPerMinute;
  const tokensPerWord = 1.3;
  const outputTokens = Math.round(totalWords * tokensPerWord);

  // Research phase: ~2x output in input (context), 20% of output
  const researchInputTokens = outputTokens * 2;
  const researchOutputTokens = Math.round(outputTokens * 0.2);

  // Drafting phase: research output + prompt, full output
  const draftingInputTokens = researchOutputTokens + 500;
  const draftingOutputTokens = outputTokens;

  // Enhancement phase: 2x passes, full context each time
  const enhancementInputTokens = outputTokens * 2;
  const enhancementOutputTokens = outputTokens * 2;

  // TTS: ~6 chars per word
  const characterCount = totalWords * 6;

  // Storage: ~1MB per minute of audio
  const storageMb = lengthMinutes * 1;

  const research: CostItem = {
    provider: 'openai',
    model: researchModel,
    inputTokens: researchInputTokens,
    outputTokens: researchOutputTokens,
    cost: calculateLLMCost(researchModel, researchInputTokens, researchOutputTokens),
  };

  const drafting: CostItem = {
    provider: 'anthropic',
    model: draftingModel,
    inputTokens: draftingInputTokens,
    outputTokens: draftingOutputTokens,
    cost: calculateLLMCost(draftingModel, draftingInputTokens, draftingOutputTokens),
  };

  const enhancement: CostItem = {
    provider: 'openai',
    model: enhancementModel,
    inputTokens: enhancementInputTokens,
    outputTokens: enhancementOutputTokens,
    cost: calculateLLMCost(enhancementModel, enhancementInputTokens, enhancementOutputTokens),
  };

  const tts: CostItem = {
    provider: ttsProvider,
    audioSeconds: lengthMinutes * 60,
    cost: calculateTTSCost(ttsProvider, characterCount),
  };

  const storage: CostItem = {
    provider: 'cloudflare-r2',
    storageMb,
    cost: calculateStorageCost(storageMb),
  };

  const total = research.cost + drafting.cost + enhancement.cost + tts.cost + storage.cost;
  const totalTokens =
    (research.inputTokens || 0) + (research.outputTokens || 0) +
    (drafting.inputTokens || 0) + (drafting.outputTokens || 0) +
    (enhancement.inputTokens || 0) + (enhancement.outputTokens || 0);

  return {
    research,
    drafting,
    enhancement,
    tts,
    storage,
    total,
    totalTokens,
    audioDurationSecs: lengthMinutes * 60,
  };
}

/**
 * Track actual costs from API responses
 */
export interface UsageTracker {
  episodeId: string;
  userId: string;
  startedAt: Date;
  costs: Partial<CostBreakdown>;
}

export function createUsageTracker(episodeId: string, userId: string): UsageTracker {
  return {
    episodeId,
    userId,
    startedAt: new Date(),
    costs: {},
  };
}

export function recordLLMUsage(
  tracker: UsageTracker,
  phase: 'research' | 'drafting' | 'enhancement',
  model: string,
  inputTokens: number,
  outputTokens: number
): void {
  tracker.costs[phase] = {
    provider: model.includes('claude') ? 'anthropic' : 'openai',
    model,
    inputTokens,
    outputTokens,
    cost: calculateLLMCost(model, inputTokens, outputTokens),
  };
}

export function recordTTSUsage(
  tracker: UsageTracker,
  provider: string,
  characterCount: number,
  audioSeconds: number
): void {
  tracker.costs.tts = {
    provider,
    audioSeconds,
    cost: calculateTTSCost(provider, characterCount),
  };
}

/**
 * Generate cost optimization suggestions
 */
export function getOptimizationSuggestions(breakdown: CostBreakdown): string[] {
  const suggestions: string[] = [];

  // Check if we're overspending on research
  if (breakdown.research.cost > breakdown.total * 0.3) {
    suggestions.push('Research phase is >30% of cost. Consider caching common topic research.');
  }

  // Check TTS costs
  if (breakdown.tts.cost > breakdown.total * 0.5) {
    suggestions.push('TTS is >50% of cost. Consider OpenAI TTS for non-premium users.');
  }

  // Check for long episodes
  if (breakdown.audioDurationSecs > 900) { // 15+ minutes
    suggestions.push('Long episodes cost more. Consider offering tiered lengths by plan.');
  }

  // Token efficiency
  const tokensPerSecond = breakdown.totalTokens / breakdown.audioDurationSecs;
  if (tokensPerSecond > 50) {
    suggestions.push('High token usage per audio second. Review prompt efficiency.');
  }

  return suggestions;
}

/**
 * Calculate margin for a subscription
 */
export function calculateMargin(
  monthlyPrice: number,
  episodesPerMonth: number,
  avgLengthMinutes: number
): { margin: number; marginPercent: number; costPerEpisode: number } {
  const estimate = estimateEpisodeCost({ lengthMinutes: avgLengthMinutes });
  const totalCost = estimate.total * episodesPerMonth;
  const margin = monthlyPrice - totalCost;
  const marginPercent = (margin / monthlyPrice) * 100;

  return {
    margin,
    marginPercent,
    costPerEpisode: estimate.total,
  };
}
