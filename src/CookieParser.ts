import {CookieJar} from 'tough-cookie';

function CookieParser(RequestJar: any) {

    const cookieJar = new CookieJar();

    const parse = (Objects: any) => {
        for (const i in Objects) {
            const CookieObject = Objects[i];

            const now = new Date(CookieObject.creation);
            const o = {
                now
            }

            cookieJar.setCookieSync(`${CookieObject.key}=${CookieObject.value}`, CookieObject.domain, o);
        }
    }

    for (const SiteUrl in RequestJar) {
        const CookiesObject = RequestJar[SiteUrl]["/"];
        parse(CookiesObject);
    }

    return cookieJar;
}

export default CookieParser;