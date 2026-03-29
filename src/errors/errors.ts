import { SteamErrorType } from '../types.js';
import type { SteamErrorInfo } from '../types.js';

const DEFAULT_MESSAGES: Record<SteamErrorType, string> = {
  [SteamErrorType.RateLimited]: 'Rate limited by Steam',
  [SteamErrorType.PrivateProfile]: 'This profile is private.',
  [SteamErrorType.AuthFailed]: 'Authentication failed',
  [SteamErrorType.InsufficientBalance]: 'Insufficient balance',
  [SteamErrorType.InvalidResponse]: 'Invalid response from Steam',
  [SteamErrorType.MalformedData]: 'Malformed data in response',
  [SteamErrorType.NetworkError]: 'Network error',
  [SteamErrorType.BadStatus]: 'Bad status',
  [SteamErrorType.ValidationError]: 'Validation error',
};

export class SteamError extends Error {
  readonly type: SteamErrorType;
  readonly eresult?: number;
  readonly statusCode?: number;

  constructor(type: SteamErrorType, message?: string, eresult?: number) {
    super(message ?? DEFAULT_MESSAGES[type]);
    this.type = type;
    this.eresult = eresult;
    this.name = 'SteamError';
  }

  toErrorInfo(): SteamErrorInfo {
    const info: SteamErrorInfo = { type: this.type, message: this.message };
    if (this.eresult !== undefined) {
      info.eresult = this.eresult;
    }
    return info;
  }

  /** Factory for bad_status with HTTP status code context. */
  static badStatus(statusCode: number, message?: string, eresult?: number): SteamError {
    const err = new SteamError(SteamErrorType.BadStatus, message ?? `Bad status code: ${statusCode}`, eresult);
    (err as { statusCode: number }).statusCode = statusCode;
    return err;
  }
}
