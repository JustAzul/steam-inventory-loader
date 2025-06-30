import 'reflect-metadata';

jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn((axios) => axios),
}));

import { HttpsProxyAgent } from 'hpagent';

import { HttpClientFactory } from '../http-client.factory';

describe('HttpClientFactory', () => {
  it('should create an axios instance with default configurations', () => {
    const axiosInstance = HttpClientFactory.create({});

    expect(axiosInstance).toBeDefined();
    expect(axiosInstance.defaults.timeout).toBe(30000);
    expect(axiosInstance.defaults.jar).toBeDefined();
  });

  it('should create an axios instance with a proxy agent when address is provided', () => {
    const proxyAddress = 'http://127.0.0.1:8888';
    const axiosInstance = HttpClientFactory.create({ proxyAddress });

    expect(axiosInstance.defaults.httpsAgent).toBeInstanceOf(HttpsProxyAgent);
  });
});
