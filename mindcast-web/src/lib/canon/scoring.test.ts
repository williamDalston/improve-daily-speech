import { describe, it, expect } from 'vitest';
import {
  computeCanonScore,
  evaluatePromotion,
  PROMOTION_THRESHOLDS,
} from './scoring';

// ============================================================================
// computeCanonScore
// ============================================================================

describe('computeCanonScore', () => {
  it('returns 0 for zero signals', () => {
    expect(
      computeCanonScore({
        requestCount: 0,
        uniqueUsers: 0,
        completionRate: 0,
        saveRate: 0,
      })
    ).toBe(0);
  });

  it('returns 1.0 for max signals', () => {
    const score = computeCanonScore({
      requestCount: 100, // above cap of 50
      uniqueUsers: 50, // above cap of 20
      completionRate: 1.0,
      saveRate: 1.0,
    });
    expect(score).toBe(1.0);
  });

  it('caps requestCount normalization at 50', () => {
    const at50 = computeCanonScore({
      requestCount: 50,
      uniqueUsers: 0,
      completionRate: 0,
      saveRate: 0,
    });
    const at100 = computeCanonScore({
      requestCount: 100,
      uniqueUsers: 0,
      completionRate: 0,
      saveRate: 0,
    });
    expect(at50).toBe(at100);
    // 0.30 * 1.0 = 0.30
    expect(at50).toBeCloseTo(0.3, 5);
  });

  it('caps uniqueUsers normalization at 20', () => {
    const at20 = computeCanonScore({
      requestCount: 0,
      uniqueUsers: 20,
      completionRate: 0,
      saveRate: 0,
    });
    const at40 = computeCanonScore({
      requestCount: 0,
      uniqueUsers: 40,
      completionRate: 0,
      saveRate: 0,
    });
    expect(at20).toBe(at40);
    // 0.25 * 1.0 = 0.25
    expect(at20).toBeCloseTo(0.25, 5);
  });

  it('weights match the documented formula', () => {
    // Score = 0.30 * norm(requests) + 0.25 * norm(users) + 0.25 * completion + 0.20 * save
    const score = computeCanonScore({
      requestCount: 25, // 25/50 = 0.5
      uniqueUsers: 10, // 10/20 = 0.5
      completionRate: 0.8,
      saveRate: 0.5,
    });
    const expected = 0.3 * 0.5 + 0.25 * 0.5 + 0.25 * 0.8 + 0.2 * 0.5;
    expect(score).toBeCloseTo(expected, 5);
  });

  it('clamps completionRate to [0, 1]', () => {
    const withNegative = computeCanonScore({
      requestCount: 0,
      uniqueUsers: 0,
      completionRate: -0.5,
      saveRate: 0,
    });
    expect(withNegative).toBe(0);

    const withOver = computeCanonScore({
      requestCount: 0,
      uniqueUsers: 0,
      completionRate: 2.0,
      saveRate: 0,
    });
    const withMax = computeCanonScore({
      requestCount: 0,
      uniqueUsers: 0,
      completionRate: 1.0,
      saveRate: 0,
    });
    expect(withOver).toBe(withMax);
  });

  it('clamps saveRate to [0, 1]', () => {
    const withNegative = computeCanonScore({
      requestCount: 0,
      uniqueUsers: 0,
      completionRate: 0,
      saveRate: -1,
    });
    expect(withNegative).toBe(0);
  });

  it('produces a value between 0 and 1', () => {
    const score = computeCanonScore({
      requestCount: 15,
      uniqueUsers: 8,
      completionRate: 0.72,
      saveRate: 0.35,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// evaluatePromotion
// ============================================================================

describe('evaluatePromotion', () => {
  it('returns eligible=true when all thresholds are met', () => {
    const result = evaluatePromotion({
      requestCount: 10,
      uniqueUsers: 5,
      completionRate: 0.75,
      saveRate: 0.5,
    });
    expect(result.eligible).toBe(true);
    expect(result.blockers).toHaveLength(0);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('returns eligible=false when requestCount is below threshold', () => {
    const result = evaluatePromotion({
      requestCount: 2,
      uniqueUsers: 5,
      completionRate: 0.8,
      saveRate: 0.5,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('requests')])
    );
  });

  it('returns eligible=false when uniqueUsers is below threshold', () => {
    const result = evaluatePromotion({
      requestCount: 10,
      uniqueUsers: 1,
      completionRate: 0.8,
      saveRate: 0.5,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('unique users')])
    );
  });

  it('returns eligible=false when completionRate is below threshold', () => {
    const result = evaluatePromotion({
      requestCount: 10,
      uniqueUsers: 5,
      completionRate: 0.3,
      saveRate: 0.5,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('completion')])
    );
  });

  it('returns eligible=false when score is below threshold', () => {
    // Low enough signals to produce a score below 0.4
    const result = evaluatePromotion({
      requestCount: 5,
      uniqueUsers: 3,
      completionRate: 0.6,
      saveRate: 0.0, // zero save rate drags score down
    });
    // Score = 0.30*(5/50) + 0.25*(3/20) + 0.25*0.6 + 0.20*0
    //       = 0.03 + 0.0375 + 0.15 + 0 = 0.2175
    expect(result.eligible).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('Score')])
    );
  });

  it('reports multiple blockers simultaneously', () => {
    const result = evaluatePromotion({
      requestCount: 1,
      uniqueUsers: 1,
      completionRate: 0.1,
      saveRate: 0.0,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.length).toBeGreaterThanOrEqual(3);
  });

  it('includes score in the result', () => {
    const result = evaluatePromotion({
      requestCount: 10,
      uniqueUsers: 5,
      completionRate: 0.75,
      saveRate: 0.5,
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('exactly at threshold boundaries is eligible', () => {
    // Use exact threshold values but need a high enough score
    // minRequests=5, minUsers=3, minCompletion=0.6, minScore=0.4
    // Score = 0.30*(5/50) + 0.25*(3/20) + 0.25*0.6 + 0.20*saveRate
    // = 0.03 + 0.0375 + 0.15 + 0.20*saveRate
    // = 0.2175 + 0.20*saveRate
    // Need score >= 0.4: 0.20*saveRate >= 0.1825, saveRate >= 0.9125
    const result = evaluatePromotion({
      requestCount: PROMOTION_THRESHOLDS.minRequests,
      uniqueUsers: PROMOTION_THRESHOLDS.minUsers,
      completionRate: PROMOTION_THRESHOLDS.minCompletion,
      saveRate: 1.0, // max save rate to hit score threshold
    });
    expect(result.score).toBeGreaterThanOrEqual(PROMOTION_THRESHOLDS.minScore);
    expect(result.eligible).toBe(true);
  });
});

// ============================================================================
// PROMOTION_THRESHOLDS
// ============================================================================

describe('PROMOTION_THRESHOLDS', () => {
  it('has expected default values', () => {
    expect(PROMOTION_THRESHOLDS.minRequests).toBe(5);
    expect(PROMOTION_THRESHOLDS.minUsers).toBe(3);
    expect(PROMOTION_THRESHOLDS.minCompletion).toBe(0.6);
    expect(PROMOTION_THRESHOLDS.minScore).toBe(0.4);
  });
});
