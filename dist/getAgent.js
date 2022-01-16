"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agentkeepalive_1 = require("agentkeepalive");
const hpagent_1 = require("hpagent");
const DefaultAgent = new agentkeepalive_1.HttpsAgent();
function getAgent(proxyAddress) {
    if (proxyAddress !== 'false') {
        const ProxyAgent = new hpagent_1.HttpsProxyAgent({
            proxy: proxyAddress,
        });
        return ProxyAgent;
    }
    return DefaultAgent;
}
exports.default = getAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0QWdlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZ2V0QWdlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtREFBNEM7QUFDNUMscUNBQTBDO0FBRTFDLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVUsRUFBRSxDQUFDO0FBRXRDLFNBQVMsUUFBUSxDQUFDLFlBQW9CO0lBQ3BDLElBQUksWUFBWSxLQUFLLE9BQU8sRUFBRTtRQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLHlCQUFlLENBQUM7WUFDckMsS0FBSyxFQUFFLFlBQVk7U0FDcEIsQ0FBQyxDQUFDO1FBRUgsT0FBTyxVQUFVLENBQUM7S0FDbkI7SUFFRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBRUQsa0JBQWUsUUFBUSxDQUFDIn0=