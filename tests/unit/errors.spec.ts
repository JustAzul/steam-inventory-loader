import { describe, it, expect } from 'vitest';
import {
  SteamError,
  RateLimitError,
  PrivateProfileError,
  AuthFailedError,
  InsufficientBalanceError,
  InvalidResponseError,
  MalformedDataError,
  NetworkError,
  BadStatusError,
} from '../../src/errors/errors.js';

describe('SteamError hierarchy', () => {
  it('SteamError base class has type and message', () => {
    const err = new SteamError('rate_limited', 'Too many requests');
    expect(err.type).toBe('rate_limited');
    expect(err.message).toBe('Too many requests');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SteamError);
    expect(err.eresult).toBeUndefined();
  });

  it('SteamError accepts optional eresult', () => {
    const err = new SteamError('bad_status', 'Failure', 2);
    expect(err.eresult).toBe(2);
  });

  it('SteamError.toErrorInfo() returns plain object', () => {
    const err = new SteamError('rate_limited', 'slow down', 84);
    const info = err.toErrorInfo();
    expect(info).toEqual({ type: 'rate_limited', message: 'slow down', eresult: 84 });
  });

  it('SteamError.toErrorInfo() omits eresult when undefined', () => {
    const err = new SteamError('network_error', 'timeout');
    const info = err.toErrorInfo();
    expect(info).toEqual({ type: 'network_error', message: 'timeout' });
    expect('eresult' in info).toBe(false);
  });

  describe('RateLimitError', () => {
    it('has type rate_limited and default message', () => {
      const err = new RateLimitError();
      expect(err.type).toBe('rate_limited');
      expect(err.message).toBe('Rate limited by Steam');
      expect(err).toBeInstanceOf(SteamError);
    });

    it('accepts custom message', () => {
      const err = new RateLimitError('custom msg');
      expect(err.message).toBe('custom msg');
    });
  });

  describe('PrivateProfileError', () => {
    it('has type private_profile and default message', () => {
      const err = new PrivateProfileError();
      expect(err.type).toBe('private_profile');
      expect(err.message).toBe('This profile is private.');
    });

    it('accepts custom message for steam.supply', () => {
      const err = new PrivateProfileError('This profile is private or you have issues with your steam.supply api key');
      expect(err.message).toContain('steam.supply');
    });
  });

  describe('AuthFailedError', () => {
    it('has type auth_failed', () => {
      const err = new AuthFailedError();
      expect(err.type).toBe('auth_failed');
      expect(err).toBeInstanceOf(SteamError);
    });
  });

  describe('InsufficientBalanceError', () => {
    it('has type insufficient_balance', () => {
      const err = new InsufficientBalanceError();
      expect(err.type).toBe('insufficient_balance');
    });
  });

  describe('InvalidResponseError', () => {
    it('has type invalid_response', () => {
      const err = new InvalidResponseError();
      expect(err.type).toBe('invalid_response');
      expect(err.message).toBe('Invalid response from Steam');
    });
  });

  describe('MalformedDataError', () => {
    it('has type malformed_data', () => {
      const err = new MalformedDataError();
      expect(err.type).toBe('malformed_data');
    });
  });

  describe('NetworkError', () => {
    it('has type network_error', () => {
      const err = new NetworkError('Connection refused');
      expect(err.type).toBe('network_error');
      expect(err.message).toBe('Connection refused');
    });
  });

  describe('BadStatusError', () => {
    it('has type bad_status with status code in message', () => {
      const err = new BadStatusError(502);
      expect(err.type).toBe('bad_status');
      expect(err.message).toContain('502');
      expect(err.statusCode).toBe(502);
    });
  });

  it('all error subclasses are instanceof SteamError and Error', () => {
    const errors = [
      new RateLimitError(),
      new PrivateProfileError(),
      new AuthFailedError(),
      new InsufficientBalanceError(),
      new InvalidResponseError(),
      new MalformedDataError(),
      new NetworkError('test'),
      new BadStatusError(500),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(SteamError);
      expect(err).toBeInstanceOf(Error);
    }
  });
});
