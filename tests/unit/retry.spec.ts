import { describe, it, expect } from 'vitest';
import { RetryPolicy } from '../../src/http/retry.js';

describe('RetryPolicy', () => {
  it('calculates exponential backoff delay (FR25)', () => {
    const policy = new RetryPolicy({ maxRetries: 3 });
    // 2^0 * 1000 = 1000, 2^1 * 1000 = 2000, 2^2 * 1000 = 4000
    const d0 = policy.getDelay(0);
    const d1 = policy.getDelay(1);
    const d2 = policy.getDelay(2);

    expect(d0).toBeGreaterThanOrEqual(1000);
    expect(d0).toBeLessThan(2000); // base + jitter
    expect(d1).toBeGreaterThanOrEqual(2000);
    expect(d1).toBeLessThan(3000);
    expect(d2).toBeGreaterThanOrEqual(4000);
    expect(d2).toBeLessThan(5000);
  });

  it('shouldRetry returns true when under max retries (FR32)', () => {
    const policy = new RetryPolicy({ maxRetries: 3 });
    expect(policy.shouldRetry(1)).toBe(true);
    expect(policy.shouldRetry(2)).toBe(true);
    expect(policy.shouldRetry(3)).toBe(true);
  });

  it('shouldRetry returns false after max retries exhausted (FR32)', () => {
    const policy = new RetryPolicy({ maxRetries: 3 });
    expect(policy.shouldRetry(4)).toBe(false);
  });

  it('default maxRetries is 3', () => {
    const policy = new RetryPolicy();
    expect(policy.shouldRetry(3)).toBe(true);
    expect(policy.shouldRetry(4)).toBe(false);
  });

  it('respects Retry-After header in seconds (FR25)', () => {
    const policy = new RetryPolicy();
    const delay = policy.getDelayFromRetryAfter('30');
    expect(delay).toBe(30_000);
  });

  it('respects Retry-After header as HTTP-date (FR25)', () => {
    const policy = new RetryPolicy();
    const futureDate = new Date(Date.now() + 10_000).toUTCString();
    const delay = policy.getDelayFromRetryAfter(futureDate);
    expect(delay).toBeGreaterThan(5_000);
    expect(delay).toBeLessThanOrEqual(11_000);
  });

  it('returns null for invalid Retry-After', () => {
    const policy = new RetryPolicy();
    expect(policy.getDelayFromRetryAfter('')).toBeNull();
    expect(policy.getDelayFromRetryAfter(undefined)).toBeNull();
  });

  it('isFakeRedirect triggers retry (FR30)', () => {
    const policy = new RetryPolicy();
    expect(policy.isRetryable({ fakeRedirect: true })).toBe(true);
  });
});
