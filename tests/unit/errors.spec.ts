import { describe, it, expect } from 'vitest';
import { SteamError, SteamErrorType } from '../../src/index.js';

describe('SteamError', () => {
  it('has type and message', () => {
    const err = new SteamError(SteamErrorType.RateLimited, 'Too many requests');
    expect(err.type).toBe(SteamErrorType.RateLimited);
    expect(err.message).toBe('Too many requests');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SteamError);
    expect(err.eresult).toBeUndefined();
  });

  it('accepts optional eresult', () => {
    const err = new SteamError(SteamErrorType.BadStatus, 'Failure', 2);
    expect(err.eresult).toBe(2);
  });

  it('uses default message when none provided', () => {
    const err = new SteamError(SteamErrorType.RateLimited);
    expect(err.message).toBe('Rate limited by Steam');
  });

  it('each type has a default message', () => {
    const types: [SteamErrorType, string][] = [
      [SteamErrorType.RateLimited, 'Rate limited by Steam'],
      [SteamErrorType.PrivateProfile, 'This profile is private.'],
      [SteamErrorType.AuthFailed, 'Authentication failed'],
      [SteamErrorType.InsufficientBalance, 'Insufficient balance'],
      [SteamErrorType.InvalidResponse, 'Invalid response from Steam'],
      [SteamErrorType.MalformedData, 'Malformed data in response'],
      [SteamErrorType.NetworkError, 'Network error'],
      [SteamErrorType.BadStatus, 'Bad status'],
      [SteamErrorType.ValidationError, 'Validation error'],
    ];

    for (const [type, expected] of types) {
      expect(new SteamError(type).message).toBe(expected);
    }
  });

  it('custom message overrides default', () => {
    const err = new SteamError(SteamErrorType.PrivateProfile, 'This profile is private or you have issues with your steam.supply api key');
    expect(err.message).toContain('steam.supply');
  });

  it('toErrorInfo() returns plain object', () => {
    const err = new SteamError(SteamErrorType.RateLimited, 'slow down', 84);
    const info = err.toErrorInfo();
    expect(info).toEqual({ type: 'rate_limited', message: 'slow down', eresult: 84 });
  });

  it('toErrorInfo() omits eresult when undefined', () => {
    const err = new SteamError(SteamErrorType.NetworkError, 'timeout');
    const info = err.toErrorInfo();
    expect(info).toEqual({ type: 'network_error', message: 'timeout' });
    expect('eresult' in info).toBe(false);
  });

  it('badStatus factory sets statusCode and message', () => {
    const err = SteamError.badStatus(502);
    expect(err.type).toBe(SteamErrorType.BadStatus);
    expect(err.message).toContain('502');
    expect(err.statusCode).toBe(502);
    expect(err).toBeInstanceOf(SteamError);
  });

  it('badStatus factory accepts custom message and eresult', () => {
    const err = SteamError.badStatus(500, 'Internal failure', 2);
    expect(err.message).toBe('Internal failure');
    expect(err.eresult).toBe(2);
    expect(err.statusCode).toBe(500);
  });
});
