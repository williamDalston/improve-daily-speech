/**
 * Voice & Audio Studio Agent
 * Maintains narration standards, pronunciation dictionary, and audio quality
 */

export interface PronunciationEntry {
  word: string;
  phonetic: string; // IPA or phonetic spelling
  context?: string; // When to use this pronunciation
  source?: string; // Where this was verified
}

export interface NarrationRule {
  id: string;
  category: 'pacing' | 'emphasis' | 'numbers' | 'acronyms' | 'citations' | 'pauses';
  rule: string;
  examples: { before: string; after: string }[];
}

export interface AudioIssue {
  type: 'pronunciation' | 'pacing' | 'clarity' | 'volume' | 'breath' | 'silence';
  severity: 'low' | 'medium' | 'high';
  timestamp?: number;
  description: string;
  suggestion?: string;
}

// ============ PRONUNCIATION DICTIONARY ============

export const PRONUNCIATION_DICTIONARY: PronunciationEntry[] = [
  // Tech terms
  { word: 'API', phonetic: 'A-P-I', context: 'Always spell out' },
  { word: 'SQL', phonetic: 'S-Q-L or sequel', context: 'Both acceptable' },
  { word: 'GIF', phonetic: 'gif (hard G)', context: 'Like "gift" without the t' },
  { word: 'GUI', phonetic: 'gooey', context: 'Graphical user interface' },
  { word: 'IEEE', phonetic: 'I-triple-E', context: 'Institute of Electrical and Electronics Engineers' },
  { word: 'OAuth', phonetic: 'oh-auth', context: 'Open Authorization' },
  { word: 'JSON', phonetic: 'jay-son', context: 'JavaScript Object Notation' },
  { word: 'AJAX', phonetic: 'ay-jax', context: 'Asynchronous JavaScript' },
  { word: 'nginx', phonetic: 'engine-x', context: 'Web server' },
  { word: 'kubectl', phonetic: 'kube-control or kube-C-T-L', context: 'Kubernetes CLI' },

  // Scientific terms
  { word: 'CRISPR', phonetic: 'crisper', context: 'Gene editing technology' },
  { word: 'mRNA', phonetic: 'messenger R-N-A', context: 'Expand on first use' },
  { word: 'COVID', phonetic: 'co-vid', context: 'Not C-O-V-I-D' },
  { word: 'genome', phonetic: 'jee-nome', context: 'Not geh-nome' },
  { word: 'quasar', phonetic: 'kway-zar', context: 'Quasi-stellar object' },
  { word: 'neuron', phonetic: 'noor-on', context: 'Brain cell' },
  { word: 'mitochondria', phonetic: 'my-toh-kon-dree-uh', context: 'Cell powerhouse' },

  // Historical/Cultural
  { word: 'Versailles', phonetic: 'ver-sigh', context: 'French palace' },
  { word: 'Machiavelli', phonetic: 'mak-ee-uh-vel-ee', context: 'Italian philosopher' },
  { word: 'Nietzsche', phonetic: 'nee-chuh', context: 'German philosopher' },
  { word: 'Goethe', phonetic: 'gur-tuh', context: 'German writer' },
  { word: 'Descartes', phonetic: 'day-cart', context: 'French philosopher' },
  { word: 'Socrates', phonetic: 'sok-ruh-teez', context: 'Greek philosopher' },
  { word: 'Confucius', phonetic: 'kon-few-shus', context: 'Chinese philosopher' },
  { word: 'Beijing', phonetic: 'bay-jing', context: 'Not "beige-ing"' },
  { word: 'Qatar', phonetic: 'kuh-tar', context: 'Middle Eastern country' },

  // Economics/Business
  { word: 'NASDAQ', phonetic: 'naz-dak', context: 'Stock exchange' },
  { word: 'LIBOR', phonetic: 'lie-bor', context: 'Interest rate benchmark' },
  { word: 'GDP', phonetic: 'G-D-P', context: 'Always spell out' },
  { word: 'IPO', phonetic: 'I-P-O', context: 'Initial public offering' },
  { word: 'EBITDA', phonetic: 'ee-bit-dah', context: 'Financial metric' },

  // Common mispronunciations
  { word: 'often', phonetic: 'off-en', context: 'Silent T is traditional' },
  { word: 'nuclear', phonetic: 'noo-klee-er', context: 'Not "noo-kyoo-ler"' },
  { word: 'et cetera', phonetic: 'et set-er-uh', context: 'Not "ek cetera"' },
  { word: 'espresso', phonetic: 'es-press-oh', context: 'Not "ex-presso"' },
  { word: 'prescription', phonetic: 'pre-skrip-shun', context: 'Not "per-scription"' },
];

// ============ NARRATION RULES ============

export const NARRATION_RULES: NarrationRule[] = [
  // Numbers
  {
    id: 'numbers-small',
    category: 'numbers',
    rule: 'Spell out numbers one through ten; use digits for 11+',
    examples: [
      { before: 'There are 3 key points', after: 'There are three key points' },
      { before: 'Over twelve million people', after: 'Over 12 million people' },
    ],
  },
  {
    id: 'numbers-large',
    category: 'numbers',
    rule: 'Round large numbers and use words (million, billion) for clarity',
    examples: [
      { before: '7,432,891 users', after: 'about 7.4 million users' },
      { before: '$1,234,567,890', after: 'roughly 1.2 billion dollars' },
    ],
  },
  {
    id: 'numbers-years',
    category: 'numbers',
    rule: 'Say years naturally: "nineteen eighty-four" not "one thousand nine hundred eighty-four"',
    examples: [
      { before: 'In the year 1984', after: 'In nineteen eighty-four' },
      { before: 'By the year 2050', after: 'By twenty-fifty' },
    ],
  },
  {
    id: 'numbers-percentages',
    category: 'numbers',
    rule: 'Round percentages for audio; say "percent" not "%"',
    examples: [
      { before: '47.3%', after: 'about 47 percent' },
      { before: '99.9%', after: 'nearly 100 percent' },
    ],
  },

  // Acronyms
  {
    id: 'acronyms-expand',
    category: 'acronyms',
    rule: 'Expand acronyms on first use, then use short form',
    examples: [
      {
        before: 'The CDC recommends...',
        after: 'The Centers for Disease Control, or CDC, recommends...',
      },
      {
        before: 'NASA launched...',
        after: 'NASA—the National Aeronautics and Space Administration—launched...',
      },
    ],
  },
  {
    id: 'acronyms-common',
    category: 'acronyms',
    rule: 'Very common acronyms (USA, TV, DNA) can be used without expansion',
    examples: [
      { before: 'The United States of America economy', after: 'The U.S. economy' },
    ],
  },

  // Citations
  {
    id: 'citations-natural',
    category: 'citations',
    rule: 'Weave citations naturally; avoid academic formatting',
    examples: [
      {
        before: 'According to Smith et al. (2023)',
        after: 'A 2023 study from Stanford found that',
      },
      {
        before: 'Research by Dr. Jane Smith, PhD',
        after: 'Research by cognitive scientist Jane Smith shows',
      },
    ],
  },

  // Pacing
  {
    id: 'pacing-lists',
    category: 'pacing',
    rule: 'Add brief pauses between list items using dashes or ellipses',
    examples: [
      {
        before: 'First, second, and third',
        after: 'First... second... and third',
      },
    ],
  },
  {
    id: 'pacing-emphasis',
    category: 'pacing',
    rule: 'Use punctuation to create natural emphasis and rhythm',
    examples: [
      {
        before: 'This is important because it changes everything',
        after: 'This is important—because it changes everything.',
      },
    ],
  },

  // Pauses
  {
    id: 'pauses-sections',
    category: 'pauses',
    rule: 'Insert clear transitions between major sections',
    examples: [
      {
        before: 'Now let\'s talk about the second point.',
        after: 'Now... let\'s turn to the second key insight.',
      },
    ],
  },
];

// ============ TEXT PREPROCESSING ============

/**
 * Apply narration rules to text before TTS
 */
export function preprocessForTTS(text: string): string {
  let processed = text;

  // Apply number formatting
  processed = formatNumbersForSpeech(processed);

  // Apply acronym handling
  processed = formatAcronymsForSpeech(processed);

  // Add pronunciation hints
  processed = addPronunciationHints(processed);

  // Improve pacing
  processed = improvePacing(processed);

  return processed;
}

function formatNumbersForSpeech(text: string): string {
  let result = text;

  // Convert small numbers to words
  const smallNumbers: Record<string, string> = {
    '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
    '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
  };

  Object.entries(smallNumbers).forEach(([digit, word]) => {
    // Only replace standalone numbers, not parts of larger numbers
    result = result.replace(new RegExp(`\\b${digit}\\b(?!\\d)`, 'g'), word);
  });

  // Round large numbers
  result = result.replace(/(\d{1,3}),(\d{3}),(\d{3})\b/g, (match, millions) => {
    const num = parseInt(millions);
    return `about ${num} million`;
  });

  // Format percentages
  result = result.replace(/(\d+(?:\.\d+)?)\s*%/g, (match, num) => {
    const rounded = Math.round(parseFloat(num));
    return `${rounded} percent`;
  });

  return result;
}

function formatAcronymsForSpeech(text: string): string {
  let result = text;

  // Known acronyms that should be spelled out
  const spellOut = ['API', 'GDP', 'IPO', 'CEO', 'CFO', 'CTO'];
  spellOut.forEach(acronym => {
    result = result.replace(
      new RegExp(`\\b${acronym}\\b`, 'g'),
      acronym.split('').join('-')
    );
  });

  return result;
}

function addPronunciationHints(text: string): string {
  let result = text;

  // Add SSML-style hints for difficult words (if TTS supports it)
  PRONUNCIATION_DICTIONARY.forEach(entry => {
    // Simple replacement for now - could be expanded with SSML
    const regex = new RegExp(`\\b${entry.word}\\b`, 'gi');
    // Most TTS will handle these better with the phonetic in brackets
    // result = result.replace(regex, `${entry.word} [${entry.phonetic}]`);
  });

  return result;
}

function improvePacing(text: string): string {
  let result = text;

  // Add pauses before "but", "however", "yet" for contrast
  result = result.replace(/([.!?])\s+(But|However|Yet)\b/g, '$1 ... $2');

  // Add pauses in lists
  result = result.replace(/,\s+(and|or)\s+/g, '... $1 ');

  // Ensure paragraph breaks become pauses
  result = result.replace(/\n\n+/g, '\n\n... ');

  return result;
}

// ============ AUDIO QUALITY CHECKS ============

/**
 * Analyze transcript for potential audio issues
 */
export function analyzeForAudioIssues(transcript: string): AudioIssue[] {
  const issues: AudioIssue[] = [];

  // Check for difficult pronunciations
  const words = transcript.split(/\s+/);
  const difficultPatterns = [
    /[bcdfghjklmnpqrstvwxyz]{4,}/i, // Consonant clusters
    /(?:ough|tion|sion|ious)/i, // Tricky English patterns
  ];

  words.forEach(word => {
    difficultPatterns.forEach(pattern => {
      if (pattern.test(word) && word.length > 6) {
        // Check if it's in our dictionary
        const inDict = PRONUNCIATION_DICTIONARY.some(
          e => e.word.toLowerCase() === word.toLowerCase()
        );
        if (!inDict) {
          issues.push({
            type: 'pronunciation',
            severity: 'low',
            description: `Potentially difficult word: "${word}"`,
            suggestion: 'Consider adding to pronunciation dictionary',
          });
        }
      }
    });
  });

  // Check for URLs (hard to read aloud)
  const urls = transcript.match(/https?:\/\/\S+/g);
  if (urls) {
    issues.push({
      type: 'clarity',
      severity: 'medium',
      description: `${urls.length} URL(s) found - hard to convey in audio`,
      suggestion: 'Replace URLs with "visit our website" or similar',
    });
  }

  // Check for very long sentences
  const sentences = transcript.split(/[.!?]+/);
  sentences.forEach((sentence, i) => {
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount > 40) {
      issues.push({
        type: 'pacing',
        severity: 'medium',
        description: `Sentence ${i + 1} has ${wordCount} words (40+ is too long)`,
        suggestion: 'Break into shorter sentences for better listening',
      });
    }
  });

  // Check for repeated words (sounds awkward)
  const wordPairs = transcript.toLowerCase().match(/\b(\w+)\s+\1\b/g);
  if (wordPairs) {
    issues.push({
      type: 'clarity',
      severity: 'low',
      description: `Repeated word patterns found: ${wordPairs.slice(0, 3).join(', ')}`,
      suggestion: 'Vary word choice to avoid stuttering effect',
    });
  }

  // Check for parentheses (awkward in speech)
  const parentheses = transcript.match(/\([^)]+\)/g);
  if (parentheses && parentheses.length > 2) {
    issues.push({
      type: 'clarity',
      severity: 'low',
      description: `${parentheses.length} parenthetical asides found`,
      suggestion: 'Convert parentheses to dashes or separate sentences',
    });
  }

  return issues;
}

// ============ VARIANT GENERATION ============

export interface AudioVariant {
  id: string;
  name: string;
  description: string;
  modifications: {
    speedMultiplier: number;
    pauseMultiplier: number;
    toneHints?: string;
  };
}

export const AUDIO_VARIANTS: AudioVariant[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Normal pacing for focused listening',
    modifications: {
      speedMultiplier: 1.0,
      pauseMultiplier: 1.0,
    },
  },
  {
    id: 'commute',
    name: 'Commute Cut',
    description: 'Faster pacing, punchier delivery',
    modifications: {
      speedMultiplier: 1.15,
      pauseMultiplier: 0.7,
      toneHints: 'More energetic, less dramatic pauses',
    },
  },
  {
    id: 'sleep',
    name: 'Sleep Mode',
    description: 'Slower, calmer for winding down',
    modifications: {
      speedMultiplier: 0.9,
      pauseMultiplier: 1.3,
      toneHints: 'Softer, more soothing delivery',
    },
  },
  {
    id: 'study',
    name: 'Study Mode',
    description: 'Clear enunciation, extra pauses for notes',
    modifications: {
      speedMultiplier: 0.95,
      pauseMultiplier: 1.5,
      toneHints: 'Clear, methodical, with natural breaks',
    },
  },
];
