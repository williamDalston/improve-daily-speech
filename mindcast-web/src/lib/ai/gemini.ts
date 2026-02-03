/**
 * Gemini Flash - Ultra-fast responses for immediate feedback
 * Used to generate quick hooks/teasers while full pipeline runs
 */

export interface QuickHookResponse {
  hook: string;        // Compelling opening line
  preview: string;     // 2-3 sentence preview of what's coming
  funFact: string;     // One surprising fact to hook interest
}

/**
 * Generate an instant "hook" while the full episode generates
 * Gemini Flash responds in ~1-2 seconds
 */
export async function generateQuickHook(topic: string): Promise<QuickHookResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `You are creating a quick teaser for a documentary episode about: "${topic}"

Generate exactly this JSON (no markdown, just raw JSON):
{
  "hook": "A compelling one-sentence hook that grabs attention (max 20 words)",
  "preview": "2-3 sentences previewing what the listener will learn (max 50 words)",
  "funFact": "One surprising or counterintuitive fact about this topic (max 25 words)"
}

Be specific, intriguing, and make the reader want to learn more. Use vivid language.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 256,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse JSON from response (handle markdown code blocks if present)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback if parsing fails
    return {
      hook: `Discover the fascinating world of ${topic}.`,
      preview: `We're crafting an in-depth exploration that will change how you think about this subject.`,
      funFact: `This topic has surprising connections you've never considered.`,
    };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      hook: `Discover the fascinating world of ${topic}.`,
      preview: `We're crafting an in-depth exploration that will change how you think about this subject.`,
      funFact: `This topic has surprising connections you've never considered.`,
    };
  }
}

/**
 * Generate a quick summary/outline while episode generates
 */
export async function generateQuickOutline(topic: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `List 4-5 key aspects that would be covered in a documentary about "${topic}".
Just bullet points, no explanations. Be specific and intriguing.
Format: Return only a JSON array of strings, e.g. ["point 1", "point 2"]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      }),
    }
  );

  if (!response.ok) {
    return ['Exploring the history', 'Key discoveries', 'Modern applications', 'Future implications'];
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
  } catch {}

  return ['Exploring the history', 'Key discoveries', 'Modern applications', 'Future implications'];
}
