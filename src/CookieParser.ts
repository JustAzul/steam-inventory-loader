/* eslint-disable @typescript-eslint/no-explicit-any */
import { CookieJar } from 'tough-cookie';

const Parse = (Objects: any, cookieJar: CookieJar) => {
  for (let i = 0, keys = Object.keys(Objects); i < keys.length; i += 1) {
    const CookieObject = Objects[keys[i]];

    const now = new Date(CookieObject.creation);
    const o = {
      now,
    };

    cookieJar.setCookieSync(`${CookieObject.key}=${CookieObject.value}`, CookieObject.domain, o);
  }
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function CookieParser(RequestJar: any): CookieJar {
  const cookieJar = new CookieJar();

  for (let i = 0, keys = Object.keys(RequestJar); i < keys.length; i += 1) {
    Parse(RequestJar[keys[i]]['/'], cookieJar);
  }

  return cookieJar;
}

export default CookieParser;
