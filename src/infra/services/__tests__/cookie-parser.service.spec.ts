import 'reflect-metadata';
import { Cookie as ToughCookie } from 'tough-cookie';

import { CookieParserService } from '../cookie-parser.service';

describe('Infra :: Services :: CookieParserService', () => {
  let service: CookieParserService;

  beforeEach(() => {
    service = new CookieParserService();
  });

  describe('parse', () => {
    it('should correctly parse a valid cookie string', () => {
      const cookieString = 'key1=value1; key2=value2';
      const expected = {
        key1: 'value1',
        key2: 'value2',
      };
      expect(service.parse(cookieString)).toEqual(expected);
    });

    it('should return an empty object for an empty or undefined cookie string', () => {
      expect(service.parse('')).toEqual({});
      expect(service.parse(undefined as any)).toEqual({});
    });
  });

  describe('fromTough', () => {
    it('should format an array of ToughCookie objects into a string', () => {
      const cookies = [
        new ToughCookie({ key: 'key1', value: 'value1' }),
        new ToughCookie({ key: 'key2', value: 'value2' }),
      ];
      const expectedString = 'key1=value1; key2=value2';
      expect(service.fromTough(cookies)).toBe(expectedString);
    });

    it('should return an empty string for an empty array', () => {
      expect(service.fromTough([])).toBe('');
    });
  });
});
