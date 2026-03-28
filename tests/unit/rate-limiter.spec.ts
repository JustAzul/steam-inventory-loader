import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderRateLimiter, getRateLimiter, resetRateLimiters } from '../../src/http/rate-limiter.js';

describe('ProviderRateLimiter', () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetRateLimiters();
  });

  it('single acquire resolves immediately with minInterval=0', async () => {
    const limiter = new ProviderRateLimiter(0);
    const start = Date.now();
    await limiter.acquire();
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('sequential acquires with minInterval=0 are instant', async () => {
    const limiter = new ProviderRateLimiter(0);
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      await limiter.acquire();
    }
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('sequential acquires respect minInterval', async () => {
    const limiter = new ProviderRateLimiter(100);
    await limiter.acquire(); // first is instant
    const start = Date.now();
    await limiter.acquire(); // second waits minInterval
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(200);
  });

  it('concurrent acquires serialize in FIFO order', async () => {
    const limiter = new ProviderRateLimiter(50);
    const order: number[] = [];

    const start = Date.now();
    await Promise.all([
      limiter.acquire().then(() => order.push(1)),
      limiter.acquire().then(() => order.push(2)),
      limiter.acquire().then(() => order.push(3)),
    ]);
    const elapsed = Date.now() - start;

    expect(order).toEqual([1, 2, 3]);
    // 3 acquires at 50ms interval = ~100ms minimum (first is instant)
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });

  it('reportRateLimit sets cooldown for queued acquires', async () => {
    const limiter = new ProviderRateLimiter(0, 5000);

    await limiter.acquire(); // instant
    limiter.reportRateLimit(200); // 200ms cooldown

    const start = Date.now();
    await limiter.acquire(); // must wait for cooldown
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(180);
    expect(elapsed).toBeLessThan(400);
  });

  it('reportRateLimit uses Retry-After when provided', async () => {
    const limiter = new ProviderRateLimiter(0, 30_000);

    await limiter.acquire();
    limiter.reportRateLimit(150); // 150ms, not the 30s default

    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(130);
    expect(elapsed).toBeLessThan(300);
  });

  it('reportRateLimit without retryAfter uses defaultCooldown', async () => {
    const limiter = new ProviderRateLimiter(0, 200);

    await limiter.acquire();
    limiter.reportRateLimit(); // no arg → 200ms default

    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(180);
    expect(elapsed).toBeLessThan(400);
  });

  it('cooldown only extends, never shortens', async () => {
    const limiter = new ProviderRateLimiter(0, 1000);

    await limiter.acquire();
    limiter.reportRateLimit(300); // 300ms
    limiter.reportRateLimit(100); // 100ms — should NOT shorten to 100ms

    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(280);
  });

  it('updateInterval changes future acquire timing', async () => {
    const limiter = new ProviderRateLimiter(200);

    await limiter.acquire();
    limiter.updateInterval(50); // reduce to 50ms

    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(150);
  });
});

describe('getRateLimiter registry', () => {
  beforeEach(() => resetRateLimiters());

  it('returns same instance for same provider name', () => {
    const a = getRateLimiter('community', 100);
    const b = getRateLimiter('community', 100);
    expect(a).toBe(b);
  });

  it('returns different instances for different providers', () => {
    const a = getRateLimiter('community', 100);
    const b = getRateLimiter('steamApis', 100);
    expect(a).not.toBe(b);
  });

  it('different providers are independent (no cross-blocking)', async () => {
    const community = getRateLimiter('community', 0, 200);
    const steamApis = getRateLimiter('steamApis', 0);

    await community.acquire();
    community.reportRateLimit(200); // community is in cooldown

    // steamApis should still be instant
    const start = Date.now();
    await steamApis.acquire();
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('resetRateLimiters clears all instances', () => {
    const a = getRateLimiter('community', 100);
    resetRateLimiters();
    const b = getRateLimiter('community', 100);
    expect(a).not.toBe(b);
  });

  it('updates interval on existing limiter', async () => {
    const limiter = getRateLimiter('community', 200);
    await limiter.acquire();

    // Re-get with different interval
    getRateLimiter('community', 50);

    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(150);
  });
});
