import got from 'got';
import { duration } from 'moment';
import { HttpsAgent } from 'agentkeepalive';

const agent = {
  https: new HttpsAgent(),
};

const Options = {
  agent,
  timeout: duration(50, 'seconds').asMilliseconds(),
};

const ExtendedGot = got.extend(Options);

export default ExtendedGot;
