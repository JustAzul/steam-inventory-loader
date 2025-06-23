import 'reflect-metadata';
import { PROXY_ADDRESS } from '@infra/constants';
import { ErrorPayload } from '@shared/errors';
import axios from 'axios';
import { StatusCode } from 'status-code-enum';
import { container } from 'tsyringe';

import { HttpClient } from '../http-client';


jest.mock('axios');

describe('Infra :: HttpClient', () => {
  let client: HttpClient;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    container.register(PROXY_ADDRESS, { useValue: '' });
    container.register('AxiosInstance', { useValue: mockedAxios });
    client = container.resolve(HttpClient);
  });

  afterEach(() => {
    container.clearInstances();
  });

  it('should make a successful GET request', async () => {
    const responseData = { message: 'success' };
    mockedAxios.get.mockResolvedValue({
      data: responseData,
      headers: {},
      status: StatusCode.SuccessOK,
    });

    const [, result] = await client.execute({ url: 'http://test.com' });

    expect(result?.data).toEqual(responseData);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test.com',
      expect.any(Object),
    );
  });

  it('should return an error on failed GET request', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: StatusCode.ClientErrorBadRequest },
      message: 'Request failed',
    };
    mockedAxios.get.mockRejectedValue(axiosError);

    const [error] = await client.execute({ url: 'http://test.com' });

    expect(error).toBeInstanceOf(ErrorPayload);
  });

  it('should handle proxy errors', async () => {
    const proxyError = {
      isAxiosError: true,
      code: 'ECONNRESET',
      message: 'socket hang up',
    };
    mockedAxios.get.mockRejectedValue(proxyError);

    const [error] = await client.execute({ url: 'http://test.com' });

    expect(error?.code).toEqual('PROXY_ERROR');
  });

  it('should set default headers for requests', async () => {
    client.setDefaultHeaders({ 'X-Test-Header': 'TestValue' });
    mockedAxios.get.mockResolvedValue({
      data: {},
      headers: {},
      status: StatusCode.SuccessOK,
    });

    await client.execute({ url: 'http://test.com' });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test.com',
      expect.objectContaining({
        headers: { 'X-Test-Header': 'TestValue' },
      }),
    );
  });

  it('should set default cookies for requests', async () => {
    const cookieString = 'key1=value1';
    client.setDefaultCookies(cookieString);
    mockedAxios.get.mockResolvedValue({
      data: {},
      headers: {},
      status: StatusCode.SuccessOK,
    });

    await client.execute({ url: 'http://test.com' });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test.com',
      expect.objectContaining({
        headers: { cookie: cookieString },
      }),
    );
  });
});
