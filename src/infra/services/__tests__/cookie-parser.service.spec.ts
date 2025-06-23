import 'reflect-metadata';
import {
  CookieJar as ToughCookieJar,
  Cookie as ToughCookie,
} from 'tough-cookie';

import { Cookie } from '@domain/types/cookie.type';

import CookieParserService, { CookieJar } from '../cookie-parser.service';

describe('Infra :: Services :: CookieParserService', () => {
  let service: CookieParserService;

  beforeEach(() => {
    service = new CookieParserService();
  });

  describe('parseCookie', () => {
    it('should correctly parse a valid cookie string into a CookieJar', () => {
      const cookieString = 'key1=value1; key2=value2';
      const expectedJar: CookieJar = {
        key1: { value: 'value1' },
        key2: { value: 'value2' },
      };
      expect(service.parseCookie(cookieString)).toEqual(expectedJar);
    });

    it('should return an empty jar for an empty or undefined cookie string', () => {
      expect(service.parseCookie('')).toEqual({});
      expect(service.parseCookie(undefined)).toEqual({});
    });
  });

  describe('formatCookie', () => {
    it('should format a CookieJar into a cookie string', () => {
      const jar: CookieJar = {
        key1: { value: 'value1' },
        key2: { value: 'value2' },
      };
      expect(service.formatCookie(jar)).toBe('key1=value1; key2=value2');
    });

    it('should format a single Cookie entity into a string', () => {
      const cookie: Partial<Cookie> = { key: 'myKey', value: 'myValue' };
      expect(service.formatCookie(cookie as Cookie)).toBe('myKey=myValue');
    });
  });

  describe('buildSteamInventoryContextCookie', () => {
    it('should create the correct context cookie for Steam inventory requests', () => {
      const cookie = service.buildSteamInventoryContextCookie('730', '2');
      expect(cookie).toBe('strInventoryLastContext=730_2');
    });
  });

  describe('getSteamCommunityCookies', () => {
    it('should extract and parse cookies from a tough-cookie jar for the steamcommunity.com domain', async () => {
      const jar = new ToughCookieJar();
      const cookie = new ToughCookie({
        domain: 'steamcommunity.com',
        key: 'steamLoginSecure',
        value: 'testValue',
      });
      await jar.setCookie(cookie, 'https://steamcommunity.com');

      const result = await service.getSteamCommunityCookies(jar);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        key: 'steamLoginSecure',
        value: 'testValue',
      });
    });

    it('should reject with an error if the cookie jar fails', async () => {
      const jar = new ToughCookieJar();
      const testError = new Error('Cookie jar error');
      jest
        .spyOn(jar, 'getCookies')
        .mockImplementation((_url, callback) =>
          (callback as (err: Error | null, cookies: ToughCookie[]) => void)(
            testError,
            [],
          ),
        );

      await expect(service.getSteamCommunityCookies(jar)).rejects.toThrow(
        testError,
      );
    });
  });
}); 