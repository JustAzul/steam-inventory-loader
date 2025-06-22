import 'reflect-metadata';
import { CookieJar } from 'tough-cookie';
import CookieParserService from '../cookie-parser.service';
import { Cookie } from '@domain/types/cookie.type';

describe('Domain :: Services :: CookieParserService', () => {
  let service: CookieParserService;

  beforeEach(() => {
    service = new CookieParserService();
  });

  describe('parseCookies', () => {
    it('should return empty array when jar is undefined', () => {
      const result = service.parseCookies();
      expect(result).toEqual([]);
    });

    it('should return empty array when jar is null', () => {
      const result = service.parseCookies(null as any);
      expect(result).toEqual([]);
    });

    it('should handle nested jar structure', () => {
      const mockNestedJar = {
        _jar: {
          serializeSync: () => ({
            cookies: [
              { domain: 'steamcommunity.com', key: 'sessionid', value: 'test123' },
              { domain: 'steamcommunity.com', key: 'steamLoginSecure', value: 'secure456' },
            ] as Cookie[],
          }),
        },
      } as any;

      const result = service.parseCookies(mockNestedJar);
      expect(result).toEqual(['sessionid=test123', 'steamLoginSecure=secure456']);
    });

    it('should filter cookies by steamcommunity.com domain', () => {
      const mockJar = {
        serializeSync: () => ({
          cookies: [
            { domain: 'steamcommunity.com', key: 'sessionid', value: 'test123' },
            { domain: 'store.steampowered.com', key: 'storeid', value: 'store456' },
            { domain: 'steamcommunity.com', key: 'steamLoginSecure', value: 'secure789' },
          ] as Cookie[],
        }),
      } as any;

      const result = service.parseCookies(mockJar);
      expect(result).toEqual(['sessionid=test123', 'steamLoginSecure=secure789']);
    });

    it('should format cookies correctly', () => {
      const mockJar = {
        serializeSync: () => ({
          cookies: [
            { domain: 'steamcommunity.com', key: 'sessionid', value: 'abc123' },
          ] as Cookie[],
        }),
      } as any;

      const result = service.parseCookies(mockJar);
      expect(result).toEqual(['sessionid=abc123']);
    });
  });

  describe('buildCookieString', () => {
    it('should return empty string when no parameters provided', () => {
      const result = service.buildCookieString();
      expect(result).toBe('');
    });

    it('should include inventory context cookie when appID and contextID provided', () => {
      const result = service.buildCookieString(undefined, '730', '2');
      expect(result).toBe('strInventoryLastContext=730_2');
    });

    it('should include Steam community cookies when jar provided', () => {
      const mockJar = {
        serializeSync: () => ({
          cookies: [
            { domain: 'steamcommunity.com', key: 'sessionid', value: 'test123' },
          ] as Cookie[],
        }),
      } as any;

      const result = service.buildCookieString(mockJar);
      expect(result).toBe('sessionid=test123');
    });

    it('should combine inventory context and Steam community cookies', () => {
      const mockJar = {
        serializeSync: () => ({
          cookies: [
            { domain: 'steamcommunity.com', key: 'sessionid', value: 'test123' },
            { domain: 'steamcommunity.com', key: 'steamLoginSecure', value: 'secure456' },
          ] as Cookie[],
        }),
      } as any;

      const result = service.buildCookieString(mockJar, '730', '2');
      expect(result).toBe('strInventoryLastContext=730_2; sessionid=test123; steamLoginSecure=secure456');
    });

    it('should handle missing appID but present contextID', () => {
      const result = service.buildCookieString(undefined, undefined, '2');
      expect(result).toBe('');
    });

    it('should handle missing contextID but present appID', () => {
      const result = service.buildCookieString(undefined, '730', undefined);
      expect(result).toBe('');
    });
  });
}); 