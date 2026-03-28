interface RetryPolicyOptions {
  maxRetries?: number;
}

interface RetryContext {
  fakeRedirect?: boolean;
}

/**
 * Retry policy with exponential backoff (FR25, FR31, FR32).
 * Pure logic — no HTTP calls or timers.
 */
export class RetryPolicy {
  readonly maxRetries: number;

  constructor(options: RetryPolicyOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
  }

  /**
   * Whether another retry is allowed given the current attempt count.
   * FR31: always increment before retry.
   */
  shouldRetry(retryCount: number): boolean {
    return retryCount < this.maxRetries;
  }

  /**
   * Calculate delay for exponential backoff: 2^attempt * 1000ms + jitter.
   */
  getDelay(retryCount: number): number {
    const base = Math.pow(2, retryCount) * 1000;
    const jitter = Math.random() * 1000;
    return base + jitter;
  }

  /**
   * Parse Retry-After header (seconds or HTTP-date) into milliseconds.
   * Returns null if header is missing or unparseable.
   */
  getDelayFromRetryAfter(header: string | undefined): number | null {
    if (!header) return null;

    // Try as integer seconds first
    const seconds = parseInt(header, 10);
    if (!isNaN(seconds) && String(seconds) === header.trim()) {
      return seconds * 1000;
    }

    // Try as HTTP-date
    const date = new Date(header);
    if (!isNaN(date.getTime())) {
      const delay = date.getTime() - Date.now();
      return delay > 0 ? delay : null;
    }

    return null;
  }

  /**
   * Whether a response condition is retryable (FR30: fake_redirect).
   */
  isRetryable(context: RetryContext): boolean {
    if (context.fakeRedirect) return true;
    return false;
  }
}
