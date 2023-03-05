import { CookieJar as ToughCookieJar } from 'tough-cookie';

export type CookieJar = ToughCookieJar;

export type JarLike = {
  _jar: CookieJar;
};
