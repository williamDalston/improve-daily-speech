import { describe, it, expect } from 'vitest';
import { slugifyTopic, normalizeTopic } from './topic-slug';

// ============================================================================
// normalizeTopic
// ============================================================================

describe('normalizeTopic', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeTopic('  hello world  ')).toBe('hello world');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeTopic('hello    world')).toBe('hello world');
  });

  it('collapses tabs and newlines', () => {
    expect(normalizeTopic('hello\t\nworld')).toBe('hello world');
  });

  it('truncates to 500 characters', () => {
    const long = 'a'.repeat(600);
    expect(normalizeTopic(long).length).toBe(500);
  });

  it('handles empty string', () => {
    expect(normalizeTopic('')).toBe('');
  });
});

// ============================================================================
// slugifyTopic
// ============================================================================

describe('slugifyTopic', () => {
  describe('basic normalization', () => {
    it('lowercases input', () => {
      expect(slugifyTopic('Hello World')).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      expect(slugifyTopic('machine learning basics')).toBe('machine-learning-basics');
    });

    it('strips punctuation', () => {
      expect(slugifyTopic('How AI Works!!')).toBe('how-ai-works');
    });

    it('trims whitespace', () => {
      expect(slugifyTopic('  quantum physics  ')).toBe('quantum-physics');
    });

    it('collapses multiple spaces/hyphens', () => {
      expect(slugifyTopic('hello   ---  world')).toBe('hello-world');
    });
  });

  describe('unicode handling', () => {
    it('strips diacritics (accented characters)', () => {
      expect(slugifyTopic('café résumé')).toBe('cafe-resume');
    });

    it('strips non-latin characters', () => {
      expect(slugifyTopic('hello 世界')).toBe('hello');
    });

    it('handles curly apostrophes', () => {
      expect(slugifyTopic("don't stop")).toBe('dont-stop');
    });

    it('handles straight apostrophes', () => {
      // "it's" → apostrophe stripped by [^a-z0-9\s-] → "it s" → "its"
      // "its working" = 2 words, stop words not removed (only when >2)
      expect(slugifyTopic("it's working")).toBe('its-working');
    });
  });

  describe('stop word removal', () => {
    it('removes stop words when >2 words remain', () => {
      // "The Science of Sleep" → words: [the, science, of, sleep]
      // After removing stops (the, of): [science, sleep]
      expect(slugifyTopic('The Science of Sleep')).toBe('science-sleep');
    });

    it('keeps stop words when only 2 words total', () => {
      // "to be" has only 2 words — stop words NOT removed
      expect(slugifyTopic('to be')).toBe('to-be');
    });

    it('keeps content words intact', () => {
      expect(slugifyTopic('Introduction to Machine Learning')).toBe(
        'introduction-machine-learning'
      );
    });

    it('handles all-stop-word input gracefully', () => {
      // "the and or" → 3 words, all are stop words
      // Filtered would be empty, so falls back to unfiltered
      expect(slugifyTopic('the and or')).toBe('the-and-or');
    });
  });

  describe('truncation', () => {
    it('truncates long slugs to ~80 chars on a word boundary', () => {
      const long =
        'the comprehensive guide to understanding advanced theoretical quantum mechanics and its applications in modern computing';
      const slug = slugifyTopic(long);
      expect(slug.length).toBeLessThanOrEqual(80);
      expect(slug).not.toMatch(/-$/); // no trailing hyphen
    });

    it('does not truncate short slugs', () => {
      expect(slugifyTopic('short topic')).toBe('short-topic');
    });
  });

  describe('edge cases', () => {
    it('returns "untitled-topic" for empty string', () => {
      expect(slugifyTopic('')).toBe('untitled-topic');
    });

    it('returns "untitled-topic" for whitespace-only', () => {
      expect(slugifyTopic('   ')).toBe('untitled-topic');
    });

    it('returns "untitled-topic" for punctuation-only', () => {
      expect(slugifyTopic('!@#$%')).toBe('untitled-topic');
    });

    it('handles numbers', () => {
      expect(slugifyTopic('Top 10 Facts')).toBe('top-10-facts');
    });

    it('produces deterministic output', () => {
      const input = 'The Science of Sleep';
      expect(slugifyTopic(input)).toBe(slugifyTopic(input));
    });
  });

  describe('topic clustering (same slug)', () => {
    it('clusters case variations', () => {
      expect(slugifyTopic('machine learning')).toBe(
        slugifyTopic('Machine Learning')
      );
    });

    it('clusters with/without articles', () => {
      expect(slugifyTopic('The History of Rome')).toBe(
        slugifyTopic('History of Rome')
      );
    });

    it('clusters with/without punctuation', () => {
      expect(slugifyTopic('How AI Works')).toBe(
        slugifyTopic('How AI Works!!!')
      );
    });

    it('clusters accented vs non-accented', () => {
      expect(slugifyTopic('café culture')).toBe(
        slugifyTopic('cafe culture')
      );
    });
  });
});
