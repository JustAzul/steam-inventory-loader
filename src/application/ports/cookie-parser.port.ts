import { Cookie } from 'tough-cookie';

export interface ICookieParser {
  parse(cookie: string): { [key: string]: string };
  fromTough(cookies: Cookie[]): string;
}
