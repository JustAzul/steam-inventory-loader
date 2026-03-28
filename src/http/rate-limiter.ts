/**
 * Per-provider rate limiter with FIFO ordering and adaptive 429 cooldown.
 *
 * Each provider (community, steamApis, etc.) gets its own limiter instance.
 * Concurrent loads to the same provider are serialized at `minInterval` spacing.
 * When a 429 is received, all queued requests wait for the cooldown to expire.
 *
 * Single loads have zero overhead — acquire() resolves immediately when no contention.
 */

export class ProviderRateLimiter {
  private lastRequestTime = 0;
  private cooldownUntil = 0;
  private minInterval: number;
  private defaultCooldown: number;

  /** Promise chain: each acquire() waits for the previous one to complete. */
  private tail: Promise<void> = Promise.resolve();
  private pending = 0;

  constructor(minInterval: number, defaultCooldown = 30_000) {
    this.minInterval = minInterval;
    this.defaultCooldown = defaultCooldown;
  }

  /**
   * Wait for a request slot. Resolves when it's safe to send a request.
   * FIFO ordering via promise chaining — each caller waits for the previous.
   */
  async acquire(): Promise<void> {
    this.pending++;
    const prev = this.tail;
    const slot = prev.then(() => this.waitForSlot());
    this.tail = slot.catch(() => {}); // chain never rejects, prevents permanent stall
    await slot;
    this.pending--;
  }

  /**
   * Report a 429 rate limit. Sets a cooldown that blocks subsequent acquires.
   * @param retryAfterMs - Delay from Retry-After header. Falls back to defaultCooldown.
   */
  reportRateLimit(retryAfterMs?: number): void {
    const cooldown = retryAfterMs ?? this.defaultCooldown;
    const until = Date.now() + cooldown;
    if (until > this.cooldownUntil) {
      this.cooldownUntil = until;
    }
  }

  /** Update the minimum interval between requests. */
  updateInterval(ms: number): void {
    this.minInterval = ms;
  }

  /** Update the default cooldown for 429 responses without Retry-After. */
  updateDefaultCooldown(ms: number): void {
    this.defaultCooldown = ms;
  }

  private async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Wait for cooldown if active
    if (this.cooldownUntil > now) {
      await sleep(this.cooldownUntil - now);
    }

    // Wait for minInterval since last request
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await sleep(this.minInterval - elapsed);
    }

    this.lastRequestTime = Date.now();
  }
}

// ─── Module-level registry (one limiter per provider) ────────────────────

const limiters = new Map<string, ProviderRateLimiter>();

/**
 * Get or create a rate limiter for a provider.
 * If the limiter already exists, updates its interval to match the config.
 */
export function getRateLimiter(
  providerName: string,
  minInterval: number,
  defaultCooldown?: number,
): ProviderRateLimiter {
  let limiter = limiters.get(providerName);
  if (!limiter) {
    limiter = new ProviderRateLimiter(minInterval, defaultCooldown);
    limiters.set(providerName, limiter);
  } else {
    limiter.updateInterval(minInterval);
    if (defaultCooldown !== undefined) limiter.updateDefaultCooldown(defaultCooldown);
  }
  return limiter;
}

/** Reset all rate limiters. For test isolation. */
export function resetRateLimiters(): void {
  limiters.clear();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
