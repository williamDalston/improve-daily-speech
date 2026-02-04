/**
 * Growth Loop Agent
 * Identifies shareable moments and generates share assets
 */

export interface ShareableMoment {
  type: 'quote' | 'insight' | 'myth_busted' | 'statistic' | 'analogy';
  text: string;
  startTime?: number; // seconds into episode
  endTime?: number;
  shareScore: number; // 0-100, higher = more shareable
  suggestedCaption?: string;
  hashtags?: string[];
}

export interface ShareAsset {
  type: 'quote_card' | 'audiogram' | 'thread' | 'summary';
  content: string;
  metadata?: Record<string, unknown>;
}

// Patterns that indicate highly shareable content
const SHAREABLE_PATTERNS = {
  myth_busted: [
    /contrary to (popular belief|what you might think)/gi,
    /actually,?\s+(the opposite is true|it's not|this is a myth)/gi,
    /you've been told.*but/gi,
    /the truth is/gi,
    /this is wrong/gi,
    /debunk/gi,
    /myth:/gi,
  ],
  insight: [
    /the key (insight|takeaway|lesson) (is|here)/gi,
    /what (this|we) really means/gi,
    /the (real|actual|true) reason/gi,
    /here's (what|the thing)/gi,
    /the secret (is|to)/gi,
    /this changes everything/gi,
  ],
  statistic: [
    /\d{1,3}%\s+of/gi,
    /\d+\s+(times|percent|x)\s+(more|less|higher|lower)/gi,
    /studies show/gi,
    /research (found|shows|indicates)/gi,
    /according to.*\d+/gi,
  ],
  analogy: [
    /think of it (like|as)/gi,
    /it's (like|similar to)/gi,
    /imagine\s+/gi,
    /picture this/gi,
    /in other words/gi,
  ],
  quote: [
    /"[^"]{20,150}"/g, // Quoted text 20-150 chars
    /as .+ (said|wrote|put it)/gi,
  ],
};

/**
 * Extract shareable moments from transcript
 */
export function extractShareableMoments(
  transcript: string,
  maxMoments = 10
): ShareableMoment[] {
  const moments: ShareableMoment[] = [];
  const sentences = transcript.split(/(?<=[.!?])\s+/);

  // Track positions for timing estimation
  let charPosition = 0;
  const charsPerSecond = 15; // Approximate speaking rate

  sentences.forEach((sentence, _index) => {
    const startTime = Math.floor(charPosition / charsPerSecond);
    const endTime = Math.floor((charPosition + sentence.length) / charsPerSecond);
    charPosition += sentence.length + 1;

    // Skip very short or very long sentences
    if (sentence.length < 30 || sentence.length > 300) return;

    // Check each pattern type
    Object.entries(SHAREABLE_PATTERNS).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(sentence)) {
          // Calculate share score based on factors
          let shareScore = 50;

          // Length bonus (sweet spot: 50-150 chars)
          if (sentence.length >= 50 && sentence.length <= 150) {
            shareScore += 15;
          }

          // Has numbers = more credible
          if (/\d+/.test(sentence)) {
            shareScore += 10;
          }

          // Surprising/contrarian = more shareable
          if (/actually|surprising|contrary|unexpected|secret/.test(sentence.toLowerCase())) {
            shareScore += 15;
          }

          // Questions are engaging
          if (sentence.includes('?')) {
            shareScore += 5;
          }

          // Actionable = shareable
          if (/you (can|should|could|might)/i.test(sentence)) {
            shareScore += 10;
          }

          moments.push({
            type: type as ShareableMoment['type'],
            text: sentence.trim(),
            startTime,
            endTime,
            shareScore: Math.min(100, shareScore),
            suggestedCaption: generateCaption(sentence, type as ShareableMoment['type']),
            hashtags: generateHashtags(sentence),
          });
        }
      });
    });
  });

  // Sort by share score and deduplicate similar moments
  const uniqueMoments = deduplicateMoments(moments);
  return uniqueMoments
    .sort((a, b) => b.shareScore - a.shareScore)
    .slice(0, maxMoments);
}

/**
 * Remove similar moments (same sentence or overlapping times)
 */
function deduplicateMoments(moments: ShareableMoment[]): ShareableMoment[] {
  const seen = new Set<string>();
  return moments.filter(moment => {
    // Normalize text for comparison
    const key = moment.text.toLowerCase().replace(/\s+/g, ' ').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Generate a social caption for a moment
 */
function generateCaption(text: string, type: ShareableMoment['type']): string {
  const prefixes: Record<ShareableMoment['type'], string[]> = {
    myth_busted: ['🤯 Mind = blown:', 'Wait, WHAT?', '💡 Plot twist:'],
    insight: ['💎 Key insight:', '🎯 This:', '📌 Worth remembering:'],
    statistic: ['📊 The numbers:', '🔢 Did you know?', '📈 Fascinating:'],
    analogy: ['🧠 Great way to think about it:', '💡 Perfect analogy:', '🎯 This comparison:'],
    quote: ['💬 Well said:', '📝 Quote of the day:', '🗣️'],
  };

  const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];

  // Truncate if needed
  const maxLength = 250;
  const truncatedText = text.length > maxLength
    ? text.slice(0, maxLength - 3) + '...'
    : text;

  return `${prefix}\n\n"${truncatedText}"`;
}

/**
 * Generate relevant hashtags from content
 */
function generateHashtags(text: string): string[] {
  const hashtags = new Set<string>();

  // Topic-based hashtags
  const topicPatterns: Record<string, RegExp[]> = {
    '#science': [/scientific|research|study|experiment/i],
    '#psychology': [/psychological|mental|cognitive|brain|mind/i],
    '#history': [/historical|century|ancient|war|civilization/i],
    '#business': [/company|market|profit|invest|startup/i],
    '#technology': [/technology|digital|AI|computer|software/i],
    '#health': [/health|medical|body|disease|treatment/i],
    '#philosophy': [/philosophical|moral|ethical|existence/i],
    '#productivity': [/productive|efficiency|habit|focus|routine/i],
  };

  Object.entries(topicPatterns).forEach(([hashtag, patterns]) => {
    if (patterns.some(p => p.test(text))) {
      hashtags.add(hashtag);
    }
  });

  // Always add these general hashtags
  hashtags.add('#learning');
  hashtags.add('#podcast');

  return Array.from(hashtags).slice(0, 5);
}

/**
 * Generate a Twitter/X thread from transcript
 */
export function generateThread(
  transcript: string,
  episodeTitle: string,
  maxTweets = 7
): string[] {
  const moments = extractShareableMoments(transcript, maxTweets - 2);
  const thread: string[] = [];

  // Opening tweet
  thread.push(`🎧 Just listened to: "${episodeTitle}"\n\nHere are the key insights 🧵👇`);

  // Content tweets
  moments.slice(0, maxTweets - 2).forEach((moment, i) => {
    const emoji = moment.type === 'myth_busted' ? '🤯' :
                  moment.type === 'statistic' ? '📊' :
                  moment.type === 'insight' ? '💡' :
                  moment.type === 'analogy' ? '🎯' : '💬';

    let text = `${i + 1}. ${emoji} ${moment.text}`;

    // Truncate if over Twitter limit
    if (text.length > 280) {
      text = text.slice(0, 277) + '...';
    }

    thread.push(text);
  });

  // Closing tweet
  thread.push(`🎙️ Listen to the full episode on MindCast\n\n${moments[0]?.hashtags?.slice(0, 3).join(' ') || '#podcast #learning'}`);

  return thread;
}

/**
 * Generate a summary card for social sharing
 */
export function generateSummaryCard(
  transcript: string,
  episodeTitle: string
): ShareAsset {
  const moments = extractShareableMoments(transcript, 5);

  const content = `📚 ${episodeTitle}

Key Takeaways:

${moments.slice(0, 3).map((m, i) => `${i + 1}. ${m.text.slice(0, 100)}${m.text.length > 100 ? '...' : ''}`).join('\n\n')}

${moments[0]?.hashtags?.join(' ') || '#MindCast #learning'}`;

  return {
    type: 'summary',
    content,
    metadata: {
      momentCount: moments.length,
      topMomentType: moments[0]?.type,
    },
  };
}

/**
 * Calculate share potential score for an episode
 */
export function calculateSharePotential(transcript: string): {
  score: number;
  topMoments: ShareableMoment[];
  recommendation: string;
} {
  const moments = extractShareableMoments(transcript, 20);

  // Score based on quantity and quality of shareable moments
  const avgScore = moments.reduce((sum, m) => sum + m.shareScore, 0) / Math.max(moments.length, 1);
  const quantityBonus = Math.min(moments.length * 3, 30);
  const diversityBonus = new Set(moments.map(m => m.type)).size * 5;

  const score = Math.min(100, Math.round(avgScore * 0.5 + quantityBonus + diversityBonus));

  let recommendation: string;
  if (score >= 80) {
    recommendation = 'High share potential! Suggest creating quote cards and audiograms.';
  } else if (score >= 60) {
    recommendation = 'Good share potential. Focus on the top 2-3 moments for social.';
  } else if (score >= 40) {
    recommendation = 'Moderate share potential. May need to highlight key insights manually.';
  } else {
    recommendation = 'Low share potential. Consider adding more surprising facts or quotable insights.';
  }

  return {
    score,
    topMoments: moments.slice(0, 5),
    recommendation,
  };
}
