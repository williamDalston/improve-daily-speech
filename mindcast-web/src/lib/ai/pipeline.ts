/**
 * MindCast AI Pipeline — v2
 * Server-side episode generation using Claude, GPT-4, and fast models
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { withRetry, withTimeout } from '@/lib/async-utils';
import { isRetryableError } from '@/lib/ai/retry';
import {
  getResearchPrompt,
  getDraftPrompt,
  ENHANCEMENT_STAGES,
  JUDGE_PROMPT,
  SUPPORT_CHECK_PROMPT,
  PRONUNCIATION_PROMPT,
  LEARNING_ADDONS,
  PROMPT_VERSION,
  getCanonRemasterPrompt,
  CANON_QUALITY_GATE,
  type EpisodeLength,
} from './prompts';

// Re-export types for consumers
export type { EpisodeLength };

// Clients (lazy initialization)
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const DEFAULT_ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-2024-11-20';
const FAST_OPENAI_MODEL = process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = 16384;

// ============================================================================
// Core LLM Call
// ============================================================================

type Provider = 'anthropic' | 'openai';

interface LLMCallOptions {
  provider: Provider;
  system: string;
  user: string;
  temperature?: number;
  model?: string;
  maxTokens?: number;
  promptVersion?: string;
  purpose?: string;
}

async function callLLM({
  provider,
  system,
  user,
  temperature = 0.7,
  model,
  maxTokens,
  promptVersion,
  purpose,
}: LLMCallOptions): Promise<string> {
  const resolvedModel = model || (provider === 'openai' ? DEFAULT_OPENAI_MODEL : DEFAULT_ANTHROPIC_MODEL);
  const resolvedMaxTokens = maxTokens ?? MAX_TOKENS;
  console.info('LLM call', {
    provider,
    model: resolvedModel,
    temperature,
    promptVersion,
    purpose,
  });

  if (provider === 'openai') {
    const client = getOpenAIClient();
    const response = await withRetry(
      () =>
        withTimeout(
          client.chat.completions.create({
            model: resolvedModel,
            max_tokens: resolvedMaxTokens,
            temperature,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
          }),
          45000,
          'openai-chat'
        ),
      { retries: 2, shouldRetry: isRetryableError, label: 'openai-chat' }
    );
    return response.choices[0]?.message?.content || '';
  }

  // Anthropic
  const client = getAnthropicClient();
  const message = await withRetry(
    () =>
      withTimeout(
        client.messages.create({
          model: resolvedModel,
          max_tokens: resolvedMaxTokens,
          temperature,
          system,
          messages: [{ role: 'user', content: user }],
        }),
        45000,
        'anthropic-chat'
      ),
    { retries: 2, shouldRetry: isRetryableError, label: 'anthropic-chat' }
  );

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  return '';
}

// ============================================================================
// Pipeline Stages
// ============================================================================

export async function runResearch(topic: string, length: EpisodeLength): Promise<string> {
  const prompt = getResearchPrompt(topic, length);
  return callLLM({
    provider: 'anthropic',
    system: prompt.system,
    user: prompt.user,
    temperature: prompt.temperature,
    promptVersion: PROMPT_VERSION,
    purpose: 'research',
  });
}

export async function runDraft(
  topic: string,
  research: string,
  length: EpisodeLength,
  provider: Provider = 'anthropic',
  style?: string
): Promise<string> {
  const prompt = getDraftPrompt(topic, research, length, style);
  return callLLM({
    provider,
    system: prompt.system,
    user: prompt.user,
    temperature: prompt.temperature,
    promptVersion: PROMPT_VERSION,
    purpose: `draft:${provider}`,
  });
}

export async function runParallelDrafts(
  topic: string,
  research: string,
  length: EpisodeLength,
  style?: string
): Promise<{ label: string; text: string }[]> {
  const [anthropicDraft, openaiDraft] = await Promise.all([
    runDraft(topic, research, length, 'anthropic', style),
    runDraft(topic, research, length, 'openai', style),
  ]);

  return [
    { label: 'Claude', text: anthropicDraft },
    { label: 'GPT-4', text: openaiDraft },
  ];
}

export async function runJudge(
  topic: string,
  drafts: { label: string; text: string }[]
): Promise<{
  winnerIndex: number;
  winnerLabel: string;
  winnerText: string;
  judgment: string;
  graftParagraph: string;
}> {
  // Use faster GPT-4o-mini for judging (doesn't need full model power)
  const judgment = await callLLM({
    provider: 'openai',
    model: FAST_OPENAI_MODEL,
    system: JUDGE_PROMPT.system,
    user: JUDGE_PROMPT.userTemplate
      .replace('{topic}', topic)
      .replace('{draftA}', drafts[0].text)
      .replace('{draftB}', drafts[1].text),
    temperature: JUDGE_PROMPT.temperature,
    promptVersion: PROMPT_VERSION,
    purpose: 'judge',
  });

  // Parse winner
  const winnerMatch = judgment.match(/WINNER:\s*([AB])/i);
  const winnerLetter = winnerMatch?.[1]?.toUpperCase() || 'A';
  const winnerIndex = winnerLetter === 'A' ? 0 : 1;

  // Parse graft paragraph (v2 format)
  const graftMatch = judgment.match(/GRAFT_FROM_LOSER:\s*"?([\s\S]*?)"?\s*(?:WHY_WINNER_WINS:|$)/i);
  const graftParagraph = graftMatch?.[1]?.trim() || '';

  return {
    winnerIndex,
    winnerLabel: drafts[winnerIndex].label,
    winnerText: drafts[winnerIndex].text,
    judgment,
    graftParagraph,
  };
}

// ============================================================================
// Support Check (drift prevention)
// ============================================================================

export async function runSupportCheck(
  research: string,
  script: string
): Promise<{ ok: boolean; issues: string }> {
  const result = await callLLM({
    provider: 'openai',
    model: FAST_OPENAI_MODEL,
    system: SUPPORT_CHECK_PROMPT.system,
    user: SUPPORT_CHECK_PROMPT.userTemplate
      .replace('{research}', research)
      .replace('{script}', script),
    temperature: SUPPORT_CHECK_PROMPT.temperature,
    maxTokens: 2048,
    promptVersion: PROMPT_VERSION,
    purpose: 'support-check',
  });

  const ok = result.trim().toUpperCase() === 'OK';
  return { ok, issues: ok ? '' : result };
}

// ============================================================================
// Pronunciation Extraction (TTS metadata)
// ============================================================================

export async function runPronunciation(
  script: string
): Promise<string> {
  return callLLM({
    provider: 'openai',
    model: FAST_OPENAI_MODEL,
    system: PRONUNCIATION_PROMPT.system,
    user: PRONUNCIATION_PROMPT.userTemplate.replace('{script}', script),
    temperature: PRONUNCIATION_PROMPT.temperature,
    maxTokens: 1024,
    promptVersion: PROMPT_VERSION,
    purpose: 'pronunciation',
  });
}

// Enhancement stages run directly without a separate critique step
export async function runEnhancementStage(
  stageIndex: number,
  topic: string,
  _research: string,
  previousOutput: string
): Promise<string> {
  const stage = ENHANCEMENT_STAGES[stageIndex];
  return callLLM({
    provider: 'anthropic',
    system: stage.system,
    user: stage.userTemplate
      .replace('{topic}', topic)
      .replace('{previousOutput}', previousOutput),
    temperature: stage.temperature,
    promptVersion: PROMPT_VERSION,
    purpose: `enhance:${stage.name}`,
  });
}

// ============================================================================
// Full Pipeline
// ============================================================================

export type PipelineStep =
  | { type: 'research'; status: 'running' | 'done'; research?: string }
  | { type: 'drafts'; status: 'running' | 'done'; drafts?: { label: string; text: string }[]; draftA?: string; draftB?: string }
  | { type: 'judge'; status: 'running' | 'done'; winner?: string; winnerText?: string; judgment?: string }
  | { type: 'support-check'; status: 'running' | 'done'; ok?: boolean; issues?: string }
  | { type: 'enhancement'; status: 'running' | 'done'; stageName: string; stageIndex: number; text?: string; enhancedText?: string }
  | { type: 'pronunciation'; status: 'running' | 'done'; pronunciations?: string }
  | { type: 'done'; finalText: string; pronunciations?: string };

export async function* runFullPipeline(
  topic: string,
  length: EpisodeLength = '10 min',
  style?: string
): AsyncGenerator<PipelineStep> {
  // Stage 0: Research
  yield { type: 'research', status: 'running' };
  const research = await runResearch(topic, length);
  yield { type: 'research', status: 'done', research };

  // Stage 1: Parallel Drafts (with style applied)
  yield { type: 'drafts', status: 'running' };
  const drafts = await runParallelDrafts(topic, research, length, style);
  yield { type: 'drafts', status: 'done', drafts, draftA: drafts[0].text, draftB: drafts[1].text };

  // Judge
  yield { type: 'judge', status: 'running' };
  const judgeResult = await runJudge(topic, drafts);
  yield {
    type: 'judge',
    status: 'done',
    winner: judgeResult.winnerLabel,
    winnerText: judgeResult.winnerText,
    judgment: judgeResult.judgment,
  };

  // Support Check (drift prevention — fast model)
  yield { type: 'support-check', status: 'running' };
  const supportResult = await runSupportCheck(research, judgeResult.winnerText);
  yield { type: 'support-check', status: 'done', ok: supportResult.ok, issues: supportResult.issues };

  let currentText = judgeResult.winnerText;

  // OPTIMIZED: Only 2 enhancement stages (down from 4), no separate critique step
  for (let i = 0; i < ENHANCEMENT_STAGES.length; i++) {
    const stage = ENHANCEMENT_STAGES[i];

    // Direct enhancement (critique is now embedded in the prompt)
    yield { type: 'enhancement', status: 'running', stageName: stage.name, stageIndex: i };
    currentText = await runEnhancementStage(i, topic, research, currentText);
    yield {
      type: 'enhancement',
      status: 'done',
      stageName: stage.name,
      stageIndex: i,
      text: currentText,
      enhancedText: currentText,
    };
  }

  // Pronunciation extraction (runs in parallel with nothing — just extract metadata)
  yield { type: 'pronunciation', status: 'running' };
  const pronunciations = await runPronunciation(currentText);
  yield { type: 'pronunciation', status: 'done', pronunciations };

  yield { type: 'done', finalText: currentText, pronunciations };
}

/**
 * Quick pipeline - faster generation with fewer refinements
 * Skips enhancement stages and support check for speed
 */
export async function* runQuickPipeline(
  topic: string,
  length: EpisodeLength = '10 min',
  style?: string
): AsyncGenerator<PipelineStep> {
  // Stage 0: Research (still essential for quality)
  yield { type: 'research', status: 'running' };
  const research = await runResearch(topic, length);
  yield { type: 'research', status: 'done', research };

  // Stage 1: Parallel Drafts (with style applied)
  yield { type: 'drafts', status: 'running' };
  const drafts = await runParallelDrafts(topic, research, length, style);
  yield { type: 'drafts', status: 'done', drafts, draftA: drafts[0].text, draftB: drafts[1].text };

  // Judge - pick the best draft
  yield { type: 'judge', status: 'running' };
  const judgeResult = await runJudge(topic, drafts);
  yield {
    type: 'judge',
    status: 'done',
    winner: judgeResult.winnerLabel,
    winnerText: judgeResult.winnerText,
    judgment: judgeResult.judgment,
  };

  // Skip enhancement stages - use winning draft directly
  // The winning draft is already good quality from Claude or GPT-4
  yield { type: 'done', finalText: judgeResult.winnerText };
}

// ============================================================================
// Learning Add-ons
// ============================================================================

export async function generateAddon(
  addonKey: keyof typeof LEARNING_ADDONS,
  topic: string,
  transcript: string
): Promise<string> {
  const addon = LEARNING_ADDONS[addonKey];
  return callLLM({
    provider: 'anthropic',
    system: addon.system,
    user: addon.userTemplate.replace('{topic}', topic).replace('{transcript}', transcript),
    temperature: addon.temperature,
    promptVersion: PROMPT_VERSION,
    purpose: `addon:${addonKey}`,
  });
}

// ============================================================================
// Canon Protocol — Remaster Pipeline
// ============================================================================

/**
 * Run the canon remaster: research → remaster draft → enhancement → quality gate.
 * Uses the existing transcript as a seed but rewrites to higher standards.
 */
export async function runCanonRemaster(
  topic: string,
  seedTranscript: string,
  length: EpisodeLength = '10 min'
): Promise<{
  finalText: string;
  research: string;
  qualityGate: { pass: boolean; scores: Record<string, number>; average: number; weakest?: string; suggestion?: string };
}> {
  // 1. Fresh research (canon episodes need the latest data)
  const research = await runResearch(topic, length);

  // 2. Canon remaster draft (uses seed transcript + fresh research)
  const remasterPrompt = getCanonRemasterPrompt(topic, research, seedTranscript, length);
  let remasteredText = await callLLM({
    provider: 'anthropic',
    system: remasterPrompt.system,
    user: remasterPrompt.user,
    temperature: remasterPrompt.temperature,
    promptVersion: PROMPT_VERSION,
    purpose: 'canon-remaster',
  });

  // 3. Support check
  const supportResult = await runSupportCheck(research, remasteredText);
  if (!supportResult.ok) {
    console.log('[Canon] Support check flagged issues, proceeding with enhancement to address');
  }

  // 4. Enhancement passes (same as regular pipeline)
  for (let i = 0; i < ENHANCEMENT_STAGES.length; i++) {
    remasteredText = await runEnhancementStage(i, topic, research, remasteredText);
  }

  // 5. Quality gate
  const qualityGate = await runCanonQualityGate(topic, remasteredText);

  return {
    finalText: remasteredText,
    research,
    qualityGate,
  };
}

/**
 * Run the canon quality gate evaluation on a script.
 */
export async function runCanonQualityGate(
  topic: string,
  script: string
): Promise<{
  pass: boolean;
  scores: Record<string, number>;
  average: number;
  weakest?: string;
  suggestion?: string;
}> {
  const result = await callLLM({
    provider: 'openai',
    model: FAST_OPENAI_MODEL,
    system: CANON_QUALITY_GATE.system,
    user: CANON_QUALITY_GATE.userTemplate
      .replace('{topic}', topic)
      .replace('{script}', script),
    temperature: CANON_QUALITY_GATE.temperature,
    maxTokens: 1024,
    promptVersion: PROMPT_VERSION,
    purpose: 'canon-quality-gate',
  });

  try {
    // Extract JSON from response (may have markdown fences)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Canon QG] Could not parse quality gate response');
      return { pass: false, scores: {}, average: 0, suggestion: 'Failed to parse quality gate' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const scores: Record<string, number> = parsed.scores || {};
    const scoreValues = Object.values(scores).filter((v): v is number => typeof v === 'number');
    const average = scoreValues.length > 0
      ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
      : 0;

    const minScore = scoreValues.length > 0 ? Math.min(...scoreValues) : 0;
    const pass = average >= CANON_QUALITY_GATE.passThreshold &&
                 minScore >= CANON_QUALITY_GATE.minDimensionScore;

    return {
      pass,
      scores,
      average,
      weakest: parsed.weakest,
      suggestion: parsed.suggestion,
    };
  } catch (e) {
    console.warn('[Canon QG] JSON parse error:', e);
    return { pass: false, scores: {}, average: 0, suggestion: 'Quality gate parse error' };
  }
}
