import 'reflect-metadata';
import { StatusCode } from 'status-code-enum';

import { IFetcher } from '@application/ports/fetcher.port';
import { HttpException } from '@domain/exceptions';
import { HttpClientGetProps } from '@domain/types/http-response.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import * as sleepHelper from '@infra/helpers/sleep.helper';

import { ResilientHttpFetcher } from '../ResilientHttpFetcher';

jest.mock('@infra/helpers/sleep.helper');
// jest.mock('@application/ports/fetcher.port');

describe('Infrastructure :: ResilientHttpFetcher', () => {
  let mockFetcher: jest.Mocked<IFetcher>;
  const props: HttpClientGetProps = { url: 'http://test.com' };
  const successResponse: InventoryPageResult = {
    assets: [],
    descriptions: [],
    total_inventory_count: 0,
    success: 1,
    rwgrsn: -2,
  };

  beforeEach(() => {
    mockFetcher = {
      execute: jest.fn(),
    };
    (sleepHelper.default as jest.Mock).mockClear();
  });

  it('should return data on the first successful attempt', async () => {
    mockFetcher.execute.mockResolvedValueOnce(successResponse);

    const fetcher = new ResilientHttpFetcher(mockFetcher);
    const response = await fetcher.execute(props);

    expect(response).toEqual(successResponse);
    expect(mockFetcher.execute).toHaveBeenCalledTimes(1);
  });

  it('should retry on error and return data on second attempt', async () => {
    const errorResponse = new HttpException({
      message: 'failed',
      request: props,
      response: {
        statusCode: StatusCode.ServerErrorInternal,
      },
    });
    mockFetcher.execute
      .mockRejectedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const fetcher = new ResilientHttpFetcher(mockFetcher);
    const response = await fetcher.execute(props);

    expect(response).toEqual(successResponse);
    expect(mockFetcher.execute).toHaveBeenCalledTimes(2);
    expect(sleepHelper.default).toHaveBeenCalledTimes(1);
  });

  it('should fail after max retries', async () => {
    const errorResponse = new HttpException({
      message: 'failed',
      request: props,
      response: {
        statusCode: StatusCode.ServerErrorInternal,
      },
    });
    mockFetcher.execute.mockRejectedValue(errorResponse);

    const fetcher = new ResilientHttpFetcher(mockFetcher, { maxRetries: 2 });
    await expect(fetcher.execute(props)).rejects.toThrow(HttpException);

    expect(mockFetcher.execute).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    expect(sleepHelper.default).toHaveBeenCalledTimes(2);
  });

  it('should respect Retry-After header for 429 errors', async () => {
    const errorResponse = new HttpException({
      message: 'Too Many Requests',
      request: props,
      response: {
        headers: { 'retry-after': '3' },
        statusCode: StatusCode.ClientErrorTooManyRequests,
      },
    });
    const successResponse: InventoryPageResult = {
      assets: [],
      descriptions: [],
      total_inventory_count: 0,
      success: 1,
      rwgrsn: -2,
    };
    mockFetcher.execute
      .mockRejectedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const fetcher = new ResilientHttpFetcher(mockFetcher);
    await fetcher.execute(props);

    expect(mockFetcher.execute).toHaveBeenCalledTimes(2);
    expect(sleepHelper.default).toHaveBeenCalledTimes(1);
    expect(sleepHelper.default).toHaveBeenCalledWith(3000);
  });
});
