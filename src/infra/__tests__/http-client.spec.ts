import 'reflect-metadata';
import axios from 'axios';
import { StatusCode } from 'status-code-enum';
import { container } from 'tsyringe';

import { HttpException } from '@domain/exceptions';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import { PROXY_ADDRESS } from '@infra/constants';

import { HttpClient } from '../http-client';
import { HttpResponseProcessor } from '../http-processing/http-response-processor';


jest.mock('axios');
jest.mock('../http-processing/http-response-processor');

describe('Infra :: HttpClient', () => {
  let client: HttpClient;
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  let responseProcessor: jest.Mocked<HttpResponseProcessor>;

  const mockInventoryPageResult: InventoryPageResult = {
    assets: [],
    descriptions: [],
    total_inventory_count: 0,
    success: 1,
    rwgrsn: -2,
  };

  beforeEach(() => {
    container.register(PROXY_ADDRESS, { useValue: '' });
    container.register('AxiosInstance', { useValue: mockedAxios });

    responseProcessor = new (HttpResponseProcessor as jest.Mock<HttpResponseProcessor>)() as jest.Mocked<HttpResponseProcessor>;
    responseProcessor.execute = jest.fn().mockReturnValue(mockInventoryPageResult);
    container.registerInstance(HttpResponseProcessor, responseProcessor);

    client = container.resolve(HttpClient);
  });

  afterEach(() => {
    container.clearInstances();
    jest.clearAllMocks();
  });

  it('should make a successful GET request and return processed data', async () => {
    const rawAxiosResponse = {
      data: { message: 'success' },
      headers: {},
      status: StatusCode.SuccessOK,
    };
    mockedAxios.get.mockResolvedValue(rawAxiosResponse);

    const result = await client.execute({ url: 'http://test.com' });

    expect(result).toEqual(mockInventoryPageResult);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test.com',
      expect.any(Object),
    );
    expect(responseProcessor.execute).toHaveBeenCalledWith({
      response: {
        data: rawAxiosResponse.data,
        headers: rawAxiosResponse.headers,
        statusCode: rawAxiosResponse.status,
      },
      request: {
        url: 'http://test.com',
        headers: expect.any(Object),
        params: undefined,
      }
    });
  });

  it('should process an error on failed GET request', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: StatusCode.ClientErrorBadRequest, data: {}, headers: {} },
      message: 'Request failed',
    };
    mockedAxios.get.mockRejectedValue(axiosError);

    responseProcessor.execute = jest.fn().mockImplementation(() => {
      throw new HttpException({
        message: 'processed error',
        request: { url: 'http://test.com' },
        response: { statusCode: StatusCode.ClientErrorBadRequest },
      });
    });

    await expect(client.execute({ url: 'http://test.com' })).rejects.toThrow(
      HttpException,
    );
    expect(responseProcessor.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(HttpException),
      })
    );
  });

  it('should handle proxy errors', async () => {
    const proxyError = {
      isAxiosError: true,
      code: 'ECONNRESET',
      message: 'socket hang up',
    };
    mockedAxios.get.mockRejectedValue(proxyError);

    responseProcessor.execute = jest.fn().mockImplementation(() => {
      throw new HttpException({
        message: 'processed proxy error',
        request: { url: 'http://test.com' },
        response: {},
      });
    });

    await expect(client.execute({ url: 'http://test.com' })).rejects.toThrow(
      HttpException,
    );
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
