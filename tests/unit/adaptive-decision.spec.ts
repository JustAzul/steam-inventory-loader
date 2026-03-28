import { describe, it, expect } from 'vitest';
import {
  shouldUseWorker,
  ITEM_THRESHOLD,
  ACTIVE_LOAD_THRESHOLD,
} from '../../src/worker/adaptive-decision.js';

describe('shouldUseWorker', () => {
  it('exports threshold constants', () => {
    expect(ITEM_THRESHOLD).toBe(5000);
    expect(ACTIVE_LOAD_THRESHOLD).toBe(3);
  });

  it('returns false for small inventory even with many loads (FR60)', () => {
    expect(shouldUseWorker(4999, 10)).toBe(false);
  });

  it('returns false for large inventory with few concurrent loads', () => {
    expect(shouldUseWorker(50_000, 2)).toBe(false);
  });

  it('returns true when both thresholds met', () => {
    expect(shouldUseWorker(5000, 3)).toBe(true);
  });

  it('boundary: items = 4999, loads = 3 → false', () => {
    expect(shouldUseWorker(4999, 3)).toBe(false);
  });

  it('boundary: items = 5000, loads = 2 → false', () => {
    expect(shouldUseWorker(5000, 2)).toBe(false);
  });

  it('returns false for empty inventory regardless of loads', () => {
    expect(shouldUseWorker(0, 100)).toBe(false);
  });

  it('returns true for very large inventory with high concurrency', () => {
    expect(shouldUseWorker(500_000, 10)).toBe(true);
  });
});
