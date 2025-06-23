import { DEFAULT_REQUEST_RETRY_DELAY } from '@application/constants';

export function parseRetryAfter(
  retryAfter: string | number | string[] | undefined,
): number {
  if (typeof retryAfter === 'number') {
    return retryAfter * 1000;
  }

  if (typeof retryAfter === 'string') {
    const seconds = Number(retryAfter);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }

    const date = new Date(retryAfter);
    // Check if the date is valid
    if (!isNaN(date.getTime())) {
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      return Math.max(0, diff);
    }
  }

  return DEFAULT_REQUEST_RETRY_DELAY;
}
