/* eslint-disable @typescript-eslint/no-explicit-any */
import { CookieJar } from 'tough-cookie';

const Parse = (Objects: any, cookieJar: CookieJar) => {
  let keys: string[] | any = Object.keys(Objects);

  for (let i = 0; i < keys.length; i += 1) {
    const CookieObject = Objects[keys[i]];

    const now = new Date(CookieObject.creation);
    const o = {
      now,
    };

    cookieJar.setCookieSync(`${CookieObject.key}=${CookieObject.value}`, CookieObject.domain, o);
  }

  keys = null;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function CookieParser(RequestJar: any): CookieJar {
  const cookieJar = new CookieJar();

  let keys: string[] | any = Object.keys(RequestJar);
  for (let i = 0; i < keys.length; i += 1) {
    Parse(RequestJar[keys[i]]['/'], cookieJar);
  }
  keys = null;
  return cookieJar;
}

export default CookieParser;
