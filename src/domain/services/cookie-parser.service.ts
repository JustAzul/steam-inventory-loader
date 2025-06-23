import { Cookie } from '@domain/types/cookie.type';
import {
  Cookie as ToughCookie,
  CookieJar as ToughCookieJar,
} from 'tough-cookie';
import { injectable } from 'tsyringe';

export type CookieJar = Record<string, { value: string }>;

@injectable()
export default class CookieParserService {
  public parseCookie(cookie: string | undefined): CookieJar {
    const jar: CookieJar = {};
    if (!cookie) {
      return jar;
    }
    const cookies = cookie.split('; ');
    for (const currentCookie of cookies) {
      const [key, value] = currentCookie.split(/=(.*)/s) as [string, string];
      if (key && value) {
        jar[key] = { value };
      }
    }
    return jar;
  }

  public formatCookie(cookie: Cookie | CookieJar): string {
    if (this.isCookieJar(cookie)) {
      return Object.entries(cookie)
        .map(
          ([key, cookieValue]) =>
            `${key}=${(cookieValue as { value: string }).value}`,
        )
        .join('; ');
    }
    return this.formatSingleCookie(cookie.key, cookie);
  }

  private isCookieJar(cookie: Cookie | CookieJar): cookie is CookieJar {
    return !Object.prototype.hasOwnProperty.call(cookie, 'key');
  }

  private formatSingleCookie(
    key: string,
    cookieValue: { value: string },
  ): string {
    return `${key}=${cookieValue.value}`;
  }

  public buildSteamInventoryContextCookie(
    appID: string,
    contextID: string,
  ): string {
    return `strInventoryLastContext=${appID}_${contextID}`;
  }

  public getSteamCommunityCookies(
    toughCookieJar: ToughCookieJar,
  ): Promise<Cookie[]> {
    return new Promise((resolve, reject) => {
      toughCookieJar.getCookies(
        'https://steamcommunity.com',
        (err, cookies) => {
          if (err) {
            return reject(err);
          }
          if (!cookies) {
            return resolve([]);
          }
          const parsedCookies = cookies.map((cookie) =>
            this.parseToughCookie(cookie),
          );
          resolve(parsedCookies);
        },
      );
    });
  }

  private parseToughCookie(cookie: ToughCookie): Cookie {
    return {
      creation: cookie.creation,
      domain: cookie.domain,
      expires: cookie.expires,
      hostOnly: cookie.hostOnly,
      key: cookie.key,
      lastAccessed: cookie.lastAccessed,
      path: cookie.path,
      pathIsDefault: true,
      value: cookie.value,
    };
  }
} 