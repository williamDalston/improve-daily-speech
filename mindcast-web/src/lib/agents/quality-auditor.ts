/**
 * Episode Quality Auditor Agent
 * Scores episodes on structure, clarity, novelty, factual risks, and listenability
 */

export interface QualityScore {
  overall: number; // 0-100
  structure: number;
  clarity: number;
  novelty: number;
  factualRisk: number; // Lower is better
  aiSmell: number; // Lower is better
  listenability: number;
  issues: QualityIssue[];
  suggestions: string[];
}

export interface QualityIssue {
  type: 'factual_risk' | 'ai_smell' | 'structure' | 'clarity' | 'listenability';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string; // Quote or section reference
}

// Patterns that indicate AI-generated text
const AI_SMELL_PATTERNS = [
  /in conclusion/gi,
  /it's worth noting that/gi,
  /it is important to note/gi,
  /delve into/gi,
  /dive deep into/gi,
  /embark on a journey/gi,
  /the realm of/gi,
  /a tapestry of/gi,
  /rich tapestry/gi,
  /myriad of/gi,
  /plethora of/gi,
  /in today's fast-paced world/gi,
  /in this day and age/gi,
  /at the end of the day/gi,
  /without further ado/gi,
  /let's explore/gi,
  /let's dive in/gi,
  /buckle up/gi,
  /game-changer/gi,
  /paradigm shift/gi,
  /synergy/gi,
  /leverage/gi,
  /unpack this/gi,
  /circle back/gi,
];

// Patterns that indicate potential factual claims that should be verified
const FACTUAL_RISK_PATTERNS = [
  /\d{1,2}%\s+of/gi, // Percentages
  /studies show/gi,
  /research indicates/gi,
  /scientists have proven/gi,
  /according to experts/gi,
  /it has been proven/gi,
  /in \d{4},/gi, // Specific years
  /\$[\d,]+\s+(billion|million|trillion)/gi, // Dollar amounts
  /first (person|company|country) to/gi,
  /invented in/gi,
  /discovered by/gi,
  /always|never|every|all|none/gi, // Absolute claims
];

// Repetitive phrase detection
const REPETITIVE_PATTERNS = [
  /\b(\w+)\b(?:\s+\w+){0,5}\s+\b\1\b/gi, // Same word within 5 words
];

/**
 * Analyze transcript for quality metrics
 */
export function analyzeTranscript(transcript: string): QualityScore {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];

  // Split into sentences and paragraphs
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = transcript.split(/\n\n+/).filter(p => p.trim().length > 0);
  const words = transcript.split(/\s+/);

  // --- Structure Analysis ---
  let structureScore = 100;

  // Check for introduction (first 10% should set context)
  const introLength = Math.floor(words.length * 0.1);
  const intro = words.slice(0, introLength).join(' ').toLowerCase();
  const hasIntroContext = /today|explore|learn|discover|look at|discuss|examine/.test(intro);
  if (!hasIntroContext) {
    structureScore -= 10;
    suggestions.push('Consider adding a clearer introduction that sets context');
  }

  // Check for conclusion (last 10% should summarize)
  const outroLength = Math.floor(words.length * 0.1);
  const outro = words.slice(-outroLength).join(' ').toLowerCase();
  const hasOutroSummary = /remember|takeaway|key point|in summary|conclusion|learned/.test(outro);
  if (!hasOutroSummary) {
    structureScore -= 10;
    suggestions.push('Consider adding a stronger conclusion with key takeaways');
  }

  // Check paragraph count (should have 5+ distinct sections for 10min+)
  if (paragraphs.length < 5) {
    structureScore -= 15;
    suggestions.push('Content could benefit from more distinct sections');
  }

  // --- Clarity Analysis ---
  let clarityScore = 100;

  // Average sentence length (ideal: 15-25 words)
  const avgSentenceLength = words.length / sentences.length;
  if (avgSentenceLength > 30) {
    clarityScore -= 20;
    issues.push({
      type: 'clarity',
      severity: 'medium',
      description: `Average sentence length is ${Math.round(avgSentenceLength)} words (ideal: 15-25)`,
    });
    suggestions.push('Break up longer sentences for better listenability');
  } else if (avgSentenceLength < 10) {
    clarityScore -= 10;
    suggestions.push('Sentences might be too choppy - consider varying length');
  }

  // Check for jargon without explanation
  const technicalTerms = transcript.match(/\b[A-Z]{2,}\b/g) || [];
  const uniqueAcronyms = Array.from(new Set(technicalTerms));
  if (uniqueAcronyms.length > 5) {
    clarityScore -= 10;
    suggestions.push(`Consider explaining acronyms: ${uniqueAcronyms.slice(0, 5).join(', ')}`);
  }

  // --- Novelty Analysis ---
  let noveltyScore = 70; // Start at 70, adjust based on content

  // Check for specific examples (good for novelty)
  const hasExamples = /for example|for instance|such as|like when|consider/.test(transcript.toLowerCase());
  if (hasExamples) {
    noveltyScore += 10;
  }

  // Check for surprising facts or counterintuitive points
  const hasSurprises = /surprisingly|counterintuitively|you might think|contrary to|actually/.test(transcript.toLowerCase());
  if (hasSurprises) {
    noveltyScore += 10;
  }

  // Check for analogies (great for understanding)
  const hasAnalogies = /like a|similar to|think of it as|imagine|picture this/.test(transcript.toLowerCase());
  if (hasAnalogies) {
    noveltyScore += 10;
  }

  // --- Factual Risk Analysis ---
  let factualRiskScore = 0; // Lower is better

  FACTUAL_RISK_PATTERNS.forEach(pattern => {
    const matches = transcript.match(pattern);
    if (matches) {
      factualRiskScore += matches.length * 5;
      if (matches.length > 3) {
        issues.push({
          type: 'factual_risk',
          severity: 'medium',
          description: `Multiple unverified claims detected (pattern: ${pattern.source})`,
          location: matches.slice(0, 2).join(', '),
        });
      }
    }
  });

  // Check for absolute claims
  const absoluteClaims = transcript.match(/\b(always|never|every|all|none|impossible|certain|definitely|undoubtedly)\b/gi);
  if (absoluteClaims && absoluteClaims.length > 3) {
    factualRiskScore += 15;
    issues.push({
      type: 'factual_risk',
      severity: 'high',
      description: `${absoluteClaims.length} absolute claims detected - consider softening language`,
    });
  }

  // --- AI Smell Analysis ---
  let aiSmellScore = 0; // Lower is better

  AI_SMELL_PATTERNS.forEach(pattern => {
    const matches = transcript.match(pattern);
    if (matches) {
      aiSmellScore += matches.length * 8;
      issues.push({
        type: 'ai_smell',
        severity: matches.length > 2 ? 'high' : 'low',
        description: `AI-typical phrase: "${matches[0]}"`,
        location: matches[0],
      });
    }
  });

  // Check for repetitive phrases
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.length > 4) { // Only count meaningful words
      wordFrequency[normalized] = (wordFrequency[normalized] || 0) + 1;
    }
  });

  const overusedWords = Object.entries(wordFrequency)
    .filter(([word, count]) => count > words.length / 100 && count > 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (overusedWords.length > 0) {
    aiSmellScore += overusedWords.length * 5;
    issues.push({
      type: 'ai_smell',
      severity: 'low',
      description: `Overused words: ${overusedWords.map(([w, c]) => `${w} (${c}x)`).join(', ')}`,
    });
  }

  // --- Listenability Analysis ---
  let listenabilityScore = 100;

  // Check for numbers that are hard to parse aurally
  const complexNumbers = transcript.match(/\d{5,}/g);
  if (complexNumbers) {
    listenabilityScore -= complexNumbers.length * 5;
    suggestions.push('Consider rounding or simplifying large numbers for audio');
  }

  // Check for URLs or technical syntax
  const hasUrls = /https?:\/\/\S+/.test(transcript);
  if (hasUrls) {
    listenabilityScore -= 10;
    issues.push({
      type: 'listenability',
      severity: 'medium',
      description: 'URLs detected - these are hard to convey in audio',
    });
  }

  // Check for good audio pacing markers
  const hasPauseMarkers = /\.\.\.|—|;/.test(transcript);
  if (hasPauseMarkers) {
    listenabilityScore += 5;
  }

  // Check for conversational elements
  const hasConversational = /\?|you|your|we|our|let's/.test(transcript.toLowerCase());
  if (hasConversational) {
    listenabilityScore += 5;
  }

  // Cap scores at 0-100
  structureScore = Math.max(0, Math.min(100, structureScore));
  clarityScore = Math.max(0, Math.min(100, clarityScore));
  noveltyScore = Math.max(0, Math.min(100, noveltyScore));
  factualRiskScore = Math.min(100, factualRiskScore);
  aiSmellScore = Math.min(100, aiSmellScore);
  listenabilityScore = Math.max(0, Math.min(100, listenabilityScore));

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (structureScore * 0.15) +
    (clarityScore * 0.2) +
    (noveltyScore * 0.15) +
    ((100 - factualRiskScore) * 0.15) +
    ((100 - aiSmellScore) * 0.2) +
    (listenabilityScore * 0.15)
  );

  return {
    overall,
    structure: structureScore,
    clarity: clarityScore,
    novelty: noveltyScore,
    factualRisk: factualRiskScore,
    aiSmell: aiSmellScore,
    listenability: listenabilityScore,
    issues,
    suggestions,
  };
}

/**
 * Generate a quality report summary
 */
export function generateQualityReport(score: QualityScore): string {
  const grade =
    score.overall >= 90 ? 'A' :
    score.overall >= 80 ? 'B' :
    score.overall >= 70 ? 'C' :
    score.overall >= 60 ? 'D' : 'F';

  const highSeverityIssues = score.issues.filter(i => i.severity === 'high');
  const mediumSeverityIssues = score.issues.filter(i => i.severity === 'medium');

  let report = `## Episode Quality Report\n\n`;
  report += `**Overall Grade: ${grade} (${score.overall}/100)**\n\n`;
  report += `| Metric | Score |\n|--------|-------|\n`;
  report += `| Structure | ${score.structure}/100 |\n`;
  report += `| Clarity | ${score.clarity}/100 |\n`;
  report += `| Novelty | ${score.novelty}/100 |\n`;
  report += `| Factual Risk | ${score.factualRisk}/100 (lower is better) |\n`;
  report += `| AI Smell | ${score.aiSmell}/100 (lower is better) |\n`;
  report += `| Listenability | ${score.listenability}/100 |\n\n`;

  if (highSeverityIssues.length > 0) {
    report += `### Critical Issues\n`;
    highSeverityIssues.forEach(issue => {
      report += `- ⚠️ ${issue.description}\n`;
    });
    report += '\n';
  }

  if (mediumSeverityIssues.length > 0) {
    report += `### Warnings\n`;
    mediumSeverityIssues.forEach(issue => {
      report += `- ⚡ ${issue.description}\n`;
    });
    report += '\n';
  }

  if (score.suggestions.length > 0) {
    report += `### Suggestions\n`;
    score.suggestions.forEach(suggestion => {
      report += `- 💡 ${suggestion}\n`;
    });
  }

  return report;
}

/**
 * Check if episode meets minimum quality bar
 */
export function meetsQualityBar(score: QualityScore, minScore = 65): boolean {
  return (
    score.overall >= minScore &&
    score.factualRisk < 50 &&
    score.aiSmell < 40
  );
}
