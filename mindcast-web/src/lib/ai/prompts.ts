/**
 * MindCast AI Pipeline Prompts — v2
 * Ear-first audio documentary generation with drift prevention
 */

import { PIPELINE_PROMPT_VERSION } from './prompt-versions';

export const PROMPT_VERSION = PIPELINE_PROMPT_VERSION;

export const EPISODE_LENGTHS = {
  '5 min': { minutes: 5, wordsMin: 750, wordsMax: 900 },
  '10 min': { minutes: 10, wordsMin: 1500, wordsMax: 1800 },
  '15 min': { minutes: 15, wordsMin: 2250, wordsMax: 2700 },
  '20 min': { minutes: 20, wordsMin: 3000, wordsMax: 3600 },
} as const;

export type EpisodeLength = keyof typeof EPISODE_LENGTHS;

// ============================================================================
// 1a. Research — v2 (scene seeds + confidence-tagged sources)
// ============================================================================

export function getResearchPrompt(topic: string, length: EpisodeLength) {
  const config = EPISODE_LENGTHS[length];

  return {
    system: `You are a meticulous research assistant. You produce structured research briefs that equip an audio documentary writer with authoritative, specific, grounded material.
Citations: Only cite sources you are confident exist. If unsure, omit the citation and present the idea without attribution.`,
    user: `I need to write a ${config.minutes}-minute documentary-style audio episode on: "${topic}"

Produce a comprehensive research brief with:

1) Key historical milestones (5–10): dates, names, what happened, why it mattered.
2) Foundational theories/frameworks: who, when, what it explains, critiques.
3) Landmark studies/experiments: method, sample size if known, key findings, limitations.
4) Surprising statistics or counterintuitive facts (with context).
5) Key figures: what they did, what they changed.
6) Current debates/open questions: who disagrees and why.
7) Recent advances (last 5 years): what changed and what's next.
8) Cross-disciplinary connections: unexpected links to other fields.
9) Memorable quotes: only if confidently real, otherwise omit.
10) Common misconceptions: what people get wrong and the correction.
11) SOURCE LIST: numbered list. For each: Title, Author(s), Year, Type, confidence (high/medium).
    IMPORTANT: If confidence is not high, either omit or mark as medium and do not rely on it for core claims.

12) SCENE SEEDS (Theater of the Mind):
3–5 moments the writer can dramatize.

For each:
- Scene: [one sentence describing the moment]
- Setting: [place, time period]
- Sensory palette: [2–3 *types* of sensation to evoke — NOT invented specifics]
- Emotional beat: [what the listener should feel]
- Support: [source #] | INFERRED (from [source #]) | SPECULATIVE

SPECULATIVE = no source basis, purely atmospheric. Writer may use or discard.
Do NOT invent specific sensory facts (exact sounds, exact quotes, personal quirks) unless source-backed.

Format the full brief as clean headings with bullet points.
Be specific: names, dates, numbers when known. Avoid vague generalities.`,
    temperature: 0.4,
  };
}

// ============================================================================
// 1b. Draft — v2 (ear-first + urgency without hallucination)
// ============================================================================

export function getDraftPrompt(topic: string, research: string, length: EpisodeLength, style?: string) {
  const config = EPISODE_LENGTHS[length];

  const styleInstruction = style ? `\n\nIMPORTANT STYLE DIRECTION: ${style}` : '';

  return {
    system: `You are a world-class documentary scriptwriter for audio. Your job is to make advanced knowledge accessible, memorable, and emotionally alive, while staying faithful to the research brief.${styleInstruction}`,
    user: `Topic: "${topic}"

Research brief (use specific details from this, do not add unsupported claims):
${research}

Write a ${config.minutes}-minute documentary script (approx. ${config.wordsMin}–${config.wordsMax} words).

NON-NEGOTIABLE AUDIO RULES:
- Ear-first: prefer short to medium sentences. Avoid long nested clauses.
- Signposting: every 60–90 seconds, re-ground the listener ("So here's the turn…", "Back to the key problem…", "Why this matters is…").
- Concrete density: every 3–5 sentences include at least one specific detail from the brief (name, date, study finding, mechanism, place).
- Scene moments: include 2–3 short "scene" beats using the Scene Seeds, without inventing specifics.

OPENING (8-second rule):
Start mid-revelation with a specific detail that creates tension.

BANNED OPENINGS:
- "Have you ever wondered…"
- "In this episode…"
- "Picture this:" followed by generic scene-setting
- A dictionary definition
- A rhetorical question without an immediate twist

TONE:
Smart, warm, human. Confident voice, evidence-bound. Do not hedge academically, but do acknowledge uncertainty when the brief is uncertain.

AVOID:
- Generic praise words ("fascinating", "incredible") unless you show why.
- Listy structure ("firstly, secondly") and lecture vibes.
- Claims not supported by the research brief.

Output:
- Script only, continuous narration prose, no headers, no commentary.`,
    temperature: 0.7,
  };
}

// ============================================================================
// 1c. Judge — v2 (scored rubric + graft paragraph)
// ============================================================================

export const JUDGE_PROMPT = {
  system: `You are an expert judge of audio documentary scripts. You score, then decide. You are decisive, practical, and specific.`,
  userTemplate: `Topic: "{topic}"

Compare two drafts and choose the better one.

--- DRAFT A ---
{draftA}

--- DRAFT B ---
{draftB}

Step 1) Score each draft 1–10 on:
- Hook Quality (first 30 seconds)
- Complexity Management (clarity without losing accuracy)
- Audio Flow (rhythm, breath, cadence)
- Specificity (concrete details vs generalities)
- Human Voice (natural, non-generic)
- Overall Impact (memorability)

Step 2) Pick the winner.

Step 3) Identify the single best PARAGRAPH from the loser that should be grafted into the winner.
Quote it exactly.

Return in this format:
SCORES:
A: {hook:x, complexity:x, flow:x, specificity:x, voice:x, impact:x}
B: {hook:x, complexity:x, flow:x, specificity:x, voice:x, impact:x}
WINNER: A or B
GRAFT_FROM_LOSER: "<exact paragraph>"
WHY_WINNER_WINS: 3–6 bullet points`,
  temperature: 0.4,
};

// ============================================================================
// Support Check (drift prevention — runs after judge, before enhancement)
// ============================================================================

export const SUPPORT_CHECK_PROMPT = {
  system: `You are a strict support checker. Your job is to ensure the script does not make claims that are unsupported by the provided research brief.`,
  userTemplate: `Research brief:
{research}

Script:
{script}

List any statements in the script that are not supported by the brief.
For each unsupported claim:
- claim: "..."
- severity: BLOCKER | SHOULD_FIX | MINOR
- issue: "unsupported" | "overstated" | "too specific"
- fix: "suggested rewrite"

BLOCKER = factually invented, must fix before publish
SHOULD_FIX = stretched beyond brief, fix if time permits
MINOR = stylistic overreach, optional

If everything is supported, output: OK`,
  temperature: 0.3,
};

// ============================================================================
// Pronunciation extraction (runs after final polish, metadata for TTS)
// ============================================================================

export const PRONUNCIATION_PROMPT = {
  system: `You extract pronunciation guidance for TTS. Return a JSON object only.`,
  userTemplate: `From the script below, extract any names or terms that are likely to be mispronounced.
Return JSON:
{
  "pronunciations": [
    { "term": "...", "phonetic": "...", "note": "optional context" }
  ]
}

Script:
{script}`,
  temperature: 0.2,
};

// ============================================================================
// Enhancement stages (2 passes)
// ============================================================================

// OPTIMIZED: Reduced from 4 stages to 2 for faster generation
export const ENHANCEMENT_STAGES = [
  {
    name: 'Stage 2: Enhancement & Voice',
    description: 'Deep enhancement with authentic human voice',
    system: `You are an elite documentary editor who transforms good scripts into exceptional ones. You add intellectual depth while ensuring the voice sounds completely human - not AI-generated. Every sentence must earn its place and sound natural when spoken aloud.`,
    userTemplate: `Topic: '{topic}'

Current script to enhance:
{previousOutput}

---

Transform this script in ONE pass:

CONTENT ENHANCEMENT:
- Add specific examples, studies, or data points from the research
- Deepen metaphors and make abstract concepts more vivid
- Add moments of intellectual surprise or revelation

HUMAN VOICE:
- Remove any "firstly/secondly" structures or obvious AI patterns
- Vary sentence rhythm - mix long flowing sentences with short punchy ones
- Replace generic transitions with natural thought connections
- Make the opening distinctive - avoid cliché hooks

Output only the enhanced script, preserving length. No commentary.`,
    temperature: 0.7,
  },
  {
    name: 'Stage 3: Audio Polish',
    description: 'Optimizes for spoken delivery and final refinement',
    system: `You are a speech coach and perfectionist editor. You optimize scripts for the human voice while making final refinements. Every word must flow naturally and sound great through headphones.`,
    userTemplate: `Topic: '{topic}'

Script to polish for audio:
{previousOutput}

---

Make final optimizations in ONE pass:

AUDIO DELIVERY:
- Ensure natural breathing points every 15-20 words
- Avoid tongue-twisters and awkward consonant clusters
- Create rhythmic variety - the script should have musicality

FINAL POLISH:
- Ensure the opening line is absolutely captivating
- Check every transition is smooth and logical
- Verify the conclusion resonates and lingers
- Make it memorable

Output only the final polished script.`,
    temperature: 0.6,
  },
] as const;

// ============================================================================
// Learning Add-ons
// ============================================================================

export const LEARNING_ADDONS = {
  quiz: {
    name: 'Knowledge Quiz',
    system: `You create engaging, thought-provoking quizzes that test comprehension and encourage deeper thinking about documentary content.`,
    userTemplate: `Based on this episode transcript about '{topic}':

{transcript}

Create a 5-question quiz with:
- Mix of recall and application questions
- Multiple choice format (4 options each)
- Brief explanations for correct answers
- Questions that test understanding, not just memorization
- Incorrect options must be plausible to someone generally educated who did not listen. No silly options, no giveaways, no obvious "joke answers."

Format as JSON array with objects containing: question, options (array), correctIndex, explanation`,
    temperature: 0.5,
  },
  journal: {
    name: 'Reflection Journal',
    system: `You create thoughtful journaling prompts that help listeners process and apply what they've learned.`,
    userTemplate: `Based on this episode about '{topic}':

{transcript}

Create 5 journaling prompts that:
- Encourage personal reflection and application
- Connect the content to the listener's own life
- Promote deeper thinking about key concepts
- Range from introspective to action-oriented

Format as a numbered list with brief context for each prompt.`,
    temperature: 0.7,
  },
  takeaways: {
    name: 'Key Takeaways',
    system: `You distill complex content into memorable, actionable takeaways.`,
    userTemplate: `Based on this episode about '{topic}':

{transcript}

Create:
1. A one-sentence "big idea" summary
2. 5 key takeaways (specific and actionable)
3. 3 surprising facts worth remembering
4. 1 question to keep thinking about

Be specific and reference exact concepts from the episode.`,
    temperature: 0.5,
  },
} as const;
