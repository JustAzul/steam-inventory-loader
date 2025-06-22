import { parseRetryAfter } from '../parse-retry-after.helper';
import { DEFAULT_REQUEST_RETRY_DELAY } from '@shared/constants';

describe('Shared :: Helpers :: parseRetryAfter', () => {
  it('should parse a delay-seconds string', () => {
    const delay = parseRetryAfter('120');
    expect(delay).toBe(120000);
  });

  it('should parse a delay-seconds number', () => {
    const delay = parseRetryAfter(120);
    expect(delay).toBe(120000);
  });

  it('should parse an HTTP-date string', () => {
    const futureDate = new Date(Date.now() + 60000).toUTCString();
    const delay = parseRetryAfter(futureDate);
    // Allow for a small delta due to execution time
    expect(delay).toBeGreaterThan(58000);
    expect(delay).toBeLessThanOrEqual(60000);
  });

  it('should return the default delay for an invalid string', () => {
    const delay = parseRetryAfter('invalid-date-or-number');
    expect(delay).toBe(DEFAULT_REQUEST_RETRY_DELAY);
  });

  it('should return the default delay for an undefined value', () => {
    const delay = parseRetryAfter(undefined);
    expect(delay).toBe(DEFAULT_REQUEST_RETRY_DELAY);
  });

  it('should handle an array by returning the default delay', () => {
    const delay = parseRetryAfter(['some-value']);
    expect(delay).toBe(DEFAULT_REQUEST_RETRY_DELAY);
  });
}); 