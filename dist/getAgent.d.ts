import { HttpsAgent } from 'agentkeepalive';
import { HttpsProxyAgent } from 'hpagent';
declare function getAgent(proxyAddress: string): HttpsProxyAgent | HttpsAgent;
export default getAgent;
//# sourceMappingURL=getAgent.d.ts.map