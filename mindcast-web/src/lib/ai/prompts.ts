/**
 * MindCast AI Pipeline Prompts
 * Ported from Python prompts.py
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

export function getResearchPrompt(topic: string, length: EpisodeLength) {
  const config = EPISODE_LENGTHS[length];

  return {
    system: `You are a meticulous research assistant with expertise across all academic disciplines. You produce structured research briefs that give a writer everything they need to create authoritative, specific, and deeply grounded documentary content. You always cite your sources.`,
    user: `I need to write a ${config.minutes}-minute documentary-style audio episode on the topic: '${topic}'

Please produce a comprehensive research brief covering:

1. **Key Historical Milestones**: The 5-10 most important moments, discoveries, or turning points in this field. Include dates, names, and what specifically happened.

2. **Foundational Theories & Frameworks**: The major theoretical models that ground the field. Who developed them, when, and what do they explain?

3. **Landmark Studies & Experiments**: Specific experiments or studies that changed understanding. Include methodology, key findings, and sample sizes where relevant.

4. **Surprising Statistics & Counterintuitive Facts**: Data points that would shock or intrigue a general audience.

5. **Key Figures & Their Contributions**: The people behind the breakthroughs — not just names, but what they specifically did and said.

6. **Current Debates & Open Questions**: Where does the field disagree? What remains unresolved?

7. **Recent Advances (last 5 years)**: The cutting edge — what's new and exciting?

8. **Cross-Disciplinary Connections**: How does this topic connect to other fields in unexpected ways?

9. **Memorable Quotes**: Powerful quotes from practitioners or thinkers in the field.

10. **Common Misconceptions**: What does the public get wrong about this topic?

11. **SOURCES**: At the end, provide a numbered list of sources referenced in this brief. For each source include:
    - Title of the work/paper/book
    - Author(s)
    - Year of publication
    - Type (book, journal article, report, study, etc.)

    Format sources as:
    [1] "Title" by Author(s) (Year) - Type

    IMPORTANT: Only cite sources you are confident actually exist. If you are unsure whether a specific paper, book, or study is real, describe the finding without attributing it to a fabricated citation. It is better to have fewer real sources than many plausible-sounding but fictional ones.

Be specific. Use names, dates, numbers. No vague generalities. Format as organized bullet points under each heading.`,
    temperature: 0.4,
  };
}

export function getDraftPrompt(topic: string, research: string, length: EpisodeLength, style?: string) {
  const config = EPISODE_LENGTHS[length];

  // Build style instruction if provided
  const styleInstruction = style ? `\n\nIMPORTANT STYLE DIRECTION: ${style}` : '';

  return {
    system: `You are a world-class documentary scriptwriter for audio content. Your goal is to make advanced knowledge accessible, memorable, and intellectually stimulating. Write like the narrator of the best BBC or PBS documentaries - authoritative yet warm, making complex ideas feel fascinating and approachable. Your scripts make knowledge stick.${styleInstruction}`,
    user: `Topic: '${topic}'

Research brief to draw from (use specific details from this):
${research}

---

Create an eloquent, intellectually sophisticated, and deeply engaging documentary script on the topic of '${topic}'.

The script should not only inform but also captivate, inspire, and challenge listeners, leaving them with lasting intellectual growth. It should feel like the best documentary narration - authoritative yet inviting, making the listener feel they're discovering profound truths.

Target: ${config.minutes}-minute audio episode (approximately ${config.wordsMin} to ${config.wordsMax} words).

Guidelines:
- Begin with a compelling hook (provocative quote, existential question, counterintuitive statistic, or personal narrative)
- Challenge popular perceptions with evidence-based clarifications
- Balance rigor and accessibility with relatable metaphors
- Include cutting-edge research and open questions
- Create a narrative arc with intellectual tension and release
- End with synthesis, a final thought-provoking question, and an inspirational close

Do not use headers. The script should be ready to read aloud immediately as continuous narrative prose.`,
    temperature: 0.7,
  };
}

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

export const JUDGE_PROMPT = {
  system: `You are an expert judge evaluating documentary scripts. You assess intellectual depth, narrative engagement, authenticity of voice, and overall impact. You make decisive calls and explain your reasoning clearly.`,
  userTemplate: `Topic: '{topic}'

Compare these two draft scripts and select the better one.

--- DRAFT A ---
{draftA}

--- DRAFT B ---
{draftB}

---

Evaluate both drafts on:
1. Intellectual depth and specificity
2. Narrative engagement and flow
3. Authenticity of voice (does it sound human?)
4. Overall impact and memorability

Provide your judgment in this format:
ANALYSIS: [Your comparative analysis]
WINNER: [A or B]
BORROW FROM LOSER: [What elements from the losing draft should be incorporated]`,
  temperature: 0.4,
};

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
