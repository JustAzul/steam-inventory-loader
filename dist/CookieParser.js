"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tough_cookie_1 = require("tough-cookie");
function CookieParser(RequestJar) {
    const cookieJar = new tough_cookie_1.CookieJar();
    const parse = (Objects) => {
        for (const i in Objects) {
            const CookieObject = Objects[i];
            const now = new Date(CookieObject.creation);
            const o = {
                now
            };
            cookieJar.setCookieSync(`${CookieObject.key}=${CookieObject.value}`, CookieObject.domain, o);
        }
    };
    for (const SiteUrl in RequestJar) {
        const CookiesObject = RequestJar[SiteUrl]["/"];
        parse(CookiesObject);
    }
    return cookieJar;
}
exports.default = CookieParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29va2llUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0Nvb2tpZVBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtDQUF1QztBQUV2QyxTQUFTLFlBQVksQ0FBQyxVQUFlO0lBRWpDLE1BQU0sU0FBUyxHQUFHLElBQUksd0JBQVMsRUFBRSxDQUFDO0lBRWxDLE1BQU0sS0FBSyxHQUFHLENBQUMsT0FBWSxFQUFFLEVBQUU7UUFDM0IsS0FBSyxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQUU7WUFDckIsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWhDLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsR0FBRztnQkFDTixHQUFHO2FBQ04sQ0FBQTtZQUVELFNBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxZQUFZLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUUsRUFBRSxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ2hHO0lBQ0wsQ0FBQyxDQUFBO0lBRUQsS0FBSyxNQUFNLE9BQU8sSUFBSSxVQUFVLEVBQUU7UUFDOUIsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9DLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztLQUN4QjtJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ3JCLENBQUM7QUFFRCxrQkFBZSxZQUFZLENBQUMifQ==