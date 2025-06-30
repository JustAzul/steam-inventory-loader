import 'reflect-metadata';
import * as cookie from 'cookie';
import { injectable } from 'inversify';
import { Cookie as ToughCookie } from 'tough-cookie';

import { ICookieParser } from '@application/ports/cookie-parser.port';

@injectable()
export class CookieParserService implements ICookieParser {
  parse(cookieString: string): { [key: string]: string } {
    if (!cookieString) {
      return {};
    }
    const parsed = cookie.parse(cookieString.trim());
    // Filter out undefined values if any
    return Object.entries(parsed).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as { [key: string]: string },
    );
  }

  fromTough(cookies: ToughCookie[]): string {
    return cookies.map((c) => c.cookieString()).join('; ');
  }
}
