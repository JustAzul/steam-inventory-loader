import 'reflect-metadata';
import axios, { AxiosHeaders } from 'axios';
import { Container } from 'inversify';
import { StatusCode } from 'status-code-enum';
import { CookieJar } from 'tough-cookie';

import { IHttpClient } from '@application/ports/http-client.port';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import { PROXY_ADDRESS } from '@infra/constants';
import { HttpException } from '@infra/exceptions';
import { toIncomingHttpHeaders } from '@infra/helpers/axios-headers-to-incoming-http-headers.helper';
import { CookieParserService } from '@infra/services/cookie-parser.service';

import { HttpClient } from '../http-client';
import { HttpResponseProcessor } from '../http-processing/http-response-processor';

jest.mock('axios');
jest.mock('@infra/services/cookie-parser.service');
jest.mock('../http-processing/http-response-processor');
jest.mock('@infra/helpers/axios-headers-to-incoming-http-headers.helper');

describe('Infra :: HttpClient', () => {
  let container: Container;
  let client: IHttpClient;
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  let responseProcessor: jest.Mocked<HttpResponseProcessor>;
  let cookieParser: jest.Mocked<CookieParserService>;

  const mockInventoryPageResult: InventoryPageResult = {
    assets: [],
    descriptions: [],
    rwgrsn: -2,
    success: 1,
    total_inventory_count: 0,
  };

  beforeEach(() => {
    container = new Container();
    responseProcessor =
      new (HttpResponseProcessor as jest.Mock<HttpResponseProcessor>)() as jest.Mocked<HttpResponseProcessor>;
    cookieParser =
      new (CookieParserService as jest.Mock<CookieParserService>)() as jest.Mocked<CookieParserService>;

    responseProcessor.execute.mockReturnValue(mockInventoryPageResult);

    container.bind(PROXY_ADDRESS).toConstantValue('');
    container.bind(HttpResponseProcessor).toConstantValue(responseProcessor);
    container.bind(CookieParserService).toConstantValue(cookieParser);
    container.bind<IHttpClient>(HttpClient).toSelf();

    const mockJar = new CookieJar();
    // @ts-expect-error we need to mock the jar
    mockedAxios.create.mockReturnValue({
      ...mockedAxios,
      defaults: {
        headers: {
          common: {},
        },
        jar: mockJar,
      },
      get: mockedAxios.get,
    });
    client = container.resolve(HttpClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should make a successful GET request and return processed data', async () => {
    const rawAxiosResponse = {
      data: { message: 'success' },
      headers: new AxiosHeaders({ 'x-test-header': 'true' }),
      status: StatusCode.SuccessOK,
    };
    (toIncomingHttpHeaders as jest.Mock).mockImplementation((h) => h);
    mockedAxios.get.mockResolvedValue(rawAxiosResponse);

    const result = await client.execute({ url: 'http://test.com' });

    expect(result).toEqual(mockInventoryPageResult);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://test.com',
      expect.any(Object),
    );
    expect(responseProcessor.execute).toHaveBeenCalledWith({
      request: {
        headers: expect.any(Object),
        params: undefined,
        url: 'http://test.com',
      },
      response: {
        data: rawAxiosResponse.data,
        headers: expect.any(Object),
        statusCode: rawAxiosResponse.status,
      },
    });
  });

  it('should process an error on failed GET request', async () => {
    const axiosError = {
      isAxiosError: true,
      message: 'Request failed',
      response: {
        data: {},
        headers: new AxiosHeaders(),
        status: StatusCode.ClientErrorBadRequest,
      },
    };
    mockedAxios.get.mockRejectedValue(axiosError);

    responseProcessor.execute.mockImplementation(() => {
      throw new HttpException({
        message: 'processed error',
        request: { url: 'http://test.com' },
        response: {},
      });
    });

    await expect(client.execute({ url: 'http://test.com' })).rejects.toThrow(
      HttpException,
    );
    expect(responseProcessor.execute).toHaveBeenCalledWith({
      error: expect.any(HttpException),
      request: {
        headers: expect.any(Object),
        params: undefined,
        url: 'http://test.com',
      },
    });
  });

  it('should handle proxy errors', async () => {
    const proxyError = {
      code: 'ECONNRESET',
      isAxiosError: true,
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
    client.setDefaultHeaders({ 'x-test-header': 'test-value' });
    mockedAxios.get.mockResolvedValue({
      data: {},
      headers: new AxiosHeaders(),
      status: StatusCode.SuccessOK,
    });

    await client.execute({ url: 'http://test.com' });
    const receivedHeaders = mockedAxios.get.mock.calls[0][1]
      ?.headers as AxiosHeaders;
    expect(receivedHeaders).toBeDefined();
    expect(receivedHeaders['x-test-header']).toBe('test-value');
  });

  it('should set default cookies for requests', async () => {
    const cookieString = 'key1=value1';
    const parsedCookies = { key1: 'value1' };

    cookieParser.parse.mockReturnValue(parsedCookies);

    client.setDefaultCookies(cookieString);

    const jar = mockedAxios.create().defaults.jar as CookieJar;
    // @ts-expect-error because it's a mock
    const { calls } = (jar.setCookieSync as jest.Mock).mock;
    expect(calls[0][0]).toBe('key1=value1');
  });
});
