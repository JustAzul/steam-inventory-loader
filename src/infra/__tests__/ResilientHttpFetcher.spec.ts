import { ErrorPayload } from '@shared/errors';
import * as sleepHelper from '@infra/helpers/sleep.helper';
import { DataOrError } from '@shared/utils';
import { StatusCode } from 'status-code-enum';

import { IFetcher } from '@application/ports/fetcher.port';
import {
  HttpClientErrorCodes,
  HttpClientGetProps,
  HttpClientResponse,
} from '../../application/types/http-response.type';
import { ResilientHttpFetcher } from '../ResilientHttpFetcher';

jest.mock('@infra/helpers/sleep.helper');
jest.mock('@application/ports/fetcher.port');

const sleepMock = jest.spyOn(sleepHelper, 'default');

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
    const successResponse: HttpClientResponse<{ message: string }> = {
      data: { message: 'success' },
      headers: {},
      statusCode: 200,
    };
    const successResult: DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      HttpClientResponse<{ message: string }>
    > = [undefined, successResponse];
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
    const errorResult: DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      never
    > = [errorResponse];
    const successResponse: HttpClientResponse<{ message: string }> = {
      data: { message: 'success' },
      headers: {},
      statusCode: 200,
    };
    const successResult: DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      HttpClientResponse<{ message: string }>
    > = [undefined, successResponse];
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
    const errorResult: DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      never
    > = [errorResponse];
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
          headers: { 'retry-after': '3' },
          statusCode: StatusCode.ClientErrorTooManyRequests,
        },
      },
    });
    const errorResult: DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      never
    > = [errorResponse];
    const successResponse: HttpClientResponse<{ message: string }> = {
      data: { message: 'success' },
      headers: {},
      statusCode: 200,
    };
    const successResult: DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      HttpClientResponse<{ message: string }>
    > = [undefined, successResponse];
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
