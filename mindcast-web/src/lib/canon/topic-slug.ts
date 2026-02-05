/**
 * Topic Slug Utility
 *
 * Normalizes topic strings into URL-safe, deterministic slugs
 * for deduplication and lookup in the Canon Protocol.
 *
 * "The Science of Sleep" → "the-science-of-sleep"
 * "  How AI Works!!  " → "how-ai-works"
 */

// Common filler words that don't change the topic's identity
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'it', 'its', 'this', 'that', 'from', 'as',
]);

/**
 * Normalize a topic string for display (trimmed, collapsed whitespace)
 */
export function normalizeTopic(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')        // collapse whitespace
    .slice(0, 500);               // match sanitizeTopic limit
}

/**
 * Generate a deterministic, URL-safe slug from a topic string.
 *
 * Designed to cluster near-identical topics onto the same slug:
 * - Lowercased
 * - Unicode normalized (NFD → strip diacritics)
 * - Punctuation and special chars removed
 * - Stop words removed (so "The Science of Sleep" = "science-sleep")
 * - Truncated to 80 chars on a word boundary
 */
export function slugifyTopic(raw: string): string {
  let s = raw
    .normalize('NFD')                       // decompose accents
    .replace(/[\u0300-\u036f]/g, '')        // strip diacritics
    .toLowerCase()
    .replace(/['']/g, '')                   // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, ' ')         // non-alphanumeric → space
    .replace(/\s+/g, ' ')                   // collapse whitespace
    .trim();

  // Remove stop words (only if more than 2 words remain)
  const words = s.split(' ');
  if (words.length > 2) {
    const filtered = words.filter(w => !STOP_WORDS.has(w));
    // Only use filtered if we didn't strip everything
    if (filtered.length > 0) {
      s = filtered.join(' ');
    }
  }

  // Convert spaces to hyphens
  s = s.replace(/\s+/g, '-').replace(/-+/g, '-');

  // Truncate on a word boundary at ~80 chars
  if (s.length > 80) {
    s = s.slice(0, 80);
    const lastDash = s.lastIndexOf('-');
    if (lastDash > 40) {
      s = s.slice(0, lastDash);
    }
  }

  // Remove leading/trailing hyphens
  s = s.replace(/^-+|-+$/g, '');

  // Fallback for empty result
  if (!s) {
    s = 'untitled-topic';
  }

  return s;
}
