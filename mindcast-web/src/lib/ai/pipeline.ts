/**
 * MindCast AI Pipeline
 * Server-side episode generation using Claude and GPT-4
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  getResearchPrompt,
  getDraftPrompt,
  ENHANCEMENT_STAGES,
  CRITIQUE_TEMPLATE,
  JUDGE_PROMPT,
  LEARNING_ADDONS,
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

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-2024-11-20';
const FAST_OPENAI_MODEL = 'gpt-4o-mini'; // For quick tasks like judging
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
}

async function callLLM({
  provider,
  system,
  user,
  temperature = 0.7,
  model,
}: LLMCallOptions): Promise<string> {
  if (provider === 'openai') {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: model || DEFAULT_OPENAI_MODEL,
      max_tokens: MAX_TOKENS,
      temperature,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return response.choices[0]?.message?.content || '';
  }

  // Anthropic
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: model || DEFAULT_ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    temperature,
    system,
    messages: [{ role: 'user', content: user }],
  });

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
  borrowNotes: string;
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
  });

  // Parse winner
  const winnerMatch = judgment.match(/WINNER:\s*([AB])/i);
  const winnerLetter = winnerMatch?.[1]?.toUpperCase() || 'A';
  const winnerIndex = winnerLetter === 'A' ? 0 : 1;

  // Parse borrow notes
  const borrowMatch = judgment.match(/BORROW FROM LOSER:\s*([\s\S]*?)$/i);
  const borrowNotes = borrowMatch?.[1]?.trim() || '';

  return {
    winnerIndex,
    winnerLabel: drafts[winnerIndex].label,
    winnerText: drafts[winnerIndex].text,
    judgment,
    borrowNotes,
  };
}

export async function runCritique(
  topic: string,
  text: string,
  completedStage: string,
  nextStage: string
): Promise<string> {
  return callLLM({
    provider: 'anthropic',
    system: CRITIQUE_TEMPLATE.system,
    user: CRITIQUE_TEMPLATE.userTemplate
      .replace('{topic}', topic)
      .replace('{completedStage}', completedStage)
      .replace('{nextStage}', nextStage)
      .replace('{text}', text),
    temperature: CRITIQUE_TEMPLATE.temperature,
  });
}

// OPTIMIZED: No longer requires separate critique step
export async function runEnhancementStage(
  stageIndex: number,
  topic: string,
  research: string,
  previousOutput: string
): Promise<string> {
  const stage = ENHANCEMENT_STAGES[stageIndex];
  return callLLM({
    provider: 'anthropic',
    system: stage.system,
    user: stage.userTemplate
      .replace('{topic}', topic)
      .replace('{research}', research)
      .replace('{previousOutput}', previousOutput),
    temperature: stage.temperature,
  });
}

// ============================================================================
// Full Pipeline
// ============================================================================

export type PipelineStep =
  | { type: 'research'; status: 'running' | 'done'; research?: string }
  | { type: 'drafts'; status: 'running' | 'done'; drafts?: { label: string; text: string }[]; draftA?: string; draftB?: string }
  | { type: 'judge'; status: 'running' | 'done'; winner?: string; winnerText?: string; judgment?: string }
  | { type: 'critique'; status: 'running' | 'done'; stageName: string; text?: string }
  | { type: 'enhancement'; status: 'running' | 'done'; stageName: string; stageIndex: number; text?: string; enhancedText?: string }
  | { type: 'done'; finalText: string };

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

  yield { type: 'done', finalText: currentText };
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
  });
}
