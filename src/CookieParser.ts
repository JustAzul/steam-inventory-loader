// eslint-disable-next-line import/no-extraneous-dependencies
import { CookieJar } from 'tough-cookie';

const Parse = async (Objects: any, cookieJar: CookieJar): Promise<void> => {
  let keys: string[] | null = Object.keys(Objects);

  const Iterate = (): Promise<void> => new Promise((resolve) => {
    const Execute = (i = 0) => {
      // @ts-expect-error var keys will always be string[] here
      if (i === keys.length) {
        resolve();
        return;
      }

      // @ts-expect-error var keys will always be string[] here
      const CookieObject = Objects[keys[i]];

      const now = new Date(CookieObject.creation);
      const o = {
        now,
      };

      cookieJar.setCookieSync(`${CookieObject.key}=${CookieObject.value}`, CookieObject.domain, o);
      setImmediate(Execute.bind(null, i + 1));
    };

    Execute();
  });

  await Iterate();

  keys = null;
};

async function CookieParser(RequestJar: any): Promise<CookieJar> {
  const cookieJar = new CookieJar();

  let keys: string[] | null = Object.keys(RequestJar);
  {
    const Workload = [];

    for (let i = 0; i < keys.length; i += 1) {
      Workload.push(Parse(RequestJar[keys[i]]['/'], cookieJar));
    }

    await Promise.all(Workload);
  }

  keys = null;

  return cookieJar;
}

export default CookieParser;
