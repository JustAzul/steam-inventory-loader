import { ErrorPayload } from '@shared/errors';
import { IFetcher } from '../../application/ports/fetcher.port';
import {
  HttpClientErrorCodes,
  HttpClientGetProps,
  HttpClientResponse,
} from '../../application/ports/http-client.interface';
import { ResilientHttpFetcher } from '../ResilientHttpFetcher';
import * as sleepHelper from '@shared/helpers/sleep.helper';
import { StatusCode } from 'status-code-enum';
import { DataOrError } from '@shared/utils';

jest.mock('@shared/helpers/sleep.helper');

describe('Infrastructure :: ResilientHttpFetcher', () => {
  let mockFetcher: jest.Mocked<IFetcher>;
  const props: HttpClientGetProps = { url: 'http://test.com' };

  beforeEach(() => {
    mockFetcher = {
      execute: jest.fn(),
    };
    (sleepHelper.default as jest.Mock).mockClear();
  });

  it('should return data on the first successful attempt', async () => {
    const successResponse: HttpClientResponse<any> = {
      data: { message: 'success' },
      headers: {},
      statusCode: 200,
    };
    const successResult: DataOrError<any, any> = [undefined, successResponse];
    mockFetcher.execute.mockResolvedValueOnce(successResult);

    const fetcher = new ResilientHttpFetcher(mockFetcher);
    const [error, response] = await fetcher.execute(props);

    expect(error).toBeUndefined();
    expect(response).toEqual(successResponse);
    expect(mockFetcher.execute).toHaveBeenCalledTimes(1);
  });

  it('should retry on error and return data on second attempt', async () => {
    const errorResponse: ErrorPayload<HttpClientErrorCodes> = new ErrorPayload({
      code: 'HTTP_CLIENT_ERROR',
      payload: { message: 'failed' },
    });
    const errorResult: DataOrError<any, any> = [errorResponse];
    const successResponse: HttpClientResponse<any> = {
      data: { message: 'success' },
      headers: {},
      statusCode: 200,
    };
    const successResult: DataOrError<any, any> = [undefined, successResponse];
    mockFetcher.execute
      .mockResolvedValueOnce(errorResult)
      .mockResolvedValueOnce(successResult);

    const fetcher = new ResilientHttpFetcher(mockFetcher);
    const [error, response] = await fetcher.execute(props);

    expect(error).toBeUndefined();
    expect(response).toEqual(successResponse);
    expect(mockFetcher.execute).toHaveBeenCalledTimes(2);
    expect(sleepHelper.default).toHaveBeenCalledTimes(1);
  });

  it('should fail after max retries', async () => {
    const errorResponse: ErrorPayload<HttpClientErrorCodes> = new ErrorPayload({
      code: 'HTTP_CLIENT_ERROR',
      payload: { message: 'failed' },
    });
    const errorResult: DataOrError<any, any> = [errorResponse];
    mockFetcher.execute.mockResolvedValue(errorResult);

    const fetcher = new ResilientHttpFetcher(mockFetcher, { maxRetries: 2 });
    const [error, response] = await fetcher.execute(props);

    expect(response).toBeUndefined();
    expect(error).toEqual(errorResponse);
    expect(mockFetcher.execute).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    expect(sleepHelper.default).toHaveBeenCalledTimes(2);
  });

  it('should respect Retry-After header for 429 errors', async () => {
    const errorResponse: ErrorPayload<HttpClientErrorCodes> = new ErrorPayload({
      code: 'HTTP_CLIENT_ERROR',
      payload: {
        response: {
          statusCode: StatusCode.ClientErrorTooManyRequests,
          headers: { 'retry-after': '3' },
        },
      },
    });
    const errorResult: DataOrError<any, any> = [errorResponse];
    const successResponse: HttpClientResponse<any> = {
      data: { message: 'success' },
      headers: {},
      statusCode: 200,
    };
    const successResult: DataOrError<any, any> = [undefined, successResponse];
    mockFetcher.execute
      .mockResolvedValueOnce(errorResult)
      .mockResolvedValueOnce(successResult);

    const fetcher = new ResilientHttpFetcher(mockFetcher);
    await fetcher.execute(props);

    expect(mockFetcher.execute).toHaveBeenCalledTimes(2);
    expect(sleepHelper.default).toHaveBeenCalledTimes(1);
    expect(sleepHelper.default).toHaveBeenCalledWith(3000);
  });
}); 