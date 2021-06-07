"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tough_cookie_1 = require("tough-cookie");
const Parse = async (Objects, cookieJar) => {
    let keys = Object.keys(Objects);
    const Iterate = () => new Promise((resolve) => {
        const Execute = (i = 0) => {
            if (i === keys.length) {
                resolve();
                return;
            }
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
async function CookieParser(RequestJar) {
    const cookieJar = new tough_cookie_1.CookieJar();
    let keys = Object.keys(RequestJar);
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
exports.default = CookieParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29va2llUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0Nvb2tpZVBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLCtDQUF5QztBQUV6QyxNQUFNLEtBQUssR0FBRyxLQUFLLEVBQUUsT0FBWSxFQUFFLFNBQW9CLEVBQWlCLEVBQUU7SUFDeEUsSUFBSSxJQUFJLEdBQW9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFakQsTUFBTSxPQUFPLEdBQUcsR0FBa0IsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDM0QsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUU7WUFFeEIsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDckIsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsT0FBTzthQUNSO1lBR0QsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRDLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsR0FBRztnQkFDUixHQUFHO2FBQ0osQ0FBQztZQUVGLFNBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxZQUFZLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUUsRUFBRSxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdGLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUM7UUFFRixPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxPQUFPLEVBQUUsQ0FBQztJQUVoQixJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2QsQ0FBQyxDQUFDO0FBRUYsS0FBSyxVQUFVLFlBQVksQ0FBQyxVQUFlO0lBQ3pDLE1BQU0sU0FBUyxHQUFHLElBQUksd0JBQVMsRUFBRSxDQUFDO0lBRWxDLElBQUksSUFBSSxHQUFvQixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BEO1FBQ0UsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBRXBCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7U0FDM0Q7UUFFRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDN0I7SUFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBRVosT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVELGtCQUFlLFlBQVksQ0FBQyJ9