import { HttpsAgent } from 'agentkeepalive';
import { HttpsProxyAgent } from 'hpagent';

const DefaultAgent = new HttpsAgent();

function getAgent(proxyAddress: string): HttpsProxyAgent | HttpsAgent {
  if (proxyAddress !== 'false') {
    const ProxyAgent = new HttpsProxyAgent({
      proxy: proxyAddress,
    });

    return ProxyAgent;
  }

  return DefaultAgent;
}

export default getAgent;
