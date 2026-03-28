import type { SteamErrorInfo, SteamErrorType } from '../types.js';

export class SteamError extends Error {
  readonly type: SteamErrorType;
  readonly eresult?: number;

  constructor(type: SteamErrorType, message: string, eresult?: number) {
    super(message);
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
}

export class RateLimitError extends SteamError {
  constructor(message = 'Rate limited by Steam') {
    super('rate_limited', message);
    this.name = 'RateLimitError';
  }
}

export class PrivateProfileError extends SteamError {
  constructor(message = 'This profile is private.') {
    super('private_profile', message);
    this.name = 'PrivateProfileError';
  }
}

export class AuthFailedError extends SteamError {
  constructor(message = 'Authentication failed') {
    super('auth_failed', message);
    this.name = 'AuthFailedError';
  }
}

export class InsufficientBalanceError extends SteamError {
  constructor(message = 'Insufficient balance') {
    super('insufficient_balance', message);
    this.name = 'InsufficientBalanceError';
  }
}

export class InvalidResponseError extends SteamError {
  constructor(message = 'Invalid response from Steam') {
    super('invalid_response', message);
    this.name = 'InvalidResponseError';
  }
}

export class MalformedDataError extends SteamError {
  constructor(message = 'Malformed data in response') {
    super('malformed_data', message);
    this.name = 'MalformedDataError';
  }
}

export class NetworkError extends SteamError {
  constructor(message = 'Network error') {
    super('network_error', message);
    this.name = 'NetworkError';
  }
}

export class BadStatusError extends SteamError {
  readonly statusCode: number;

  constructor(statusCode: number, message?: string) {
    super('bad_status', message ?? `Bad status code: ${statusCode}`);
    this.statusCode = statusCode;
    this.name = 'BadStatusError';
  }
}
