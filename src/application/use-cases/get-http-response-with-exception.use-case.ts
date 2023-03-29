import {
  DEFAULT_REQUEST_MAX_RETRIES,
  DEFAULT_REQUEST_RETRY_DELAY,
} from '../../shared/constants';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../ports/http-client.interface';

import BadStatusCodeException from '../exceptions/bad-status-code.exception';
import EmptyHttpResponseException from '../exceptions/empty-http-response.exception';
import FetchUrlUseCase from './fetch-url.use-case';
import FetchWithDelayUseCase from './fetch-with-delay.use-case';
import HttpException from '../exceptions/http.exception';
import { InventoryPageResult } from '../types/inventory-page-result.type';
import PrivateProfileException from '../exceptions/private-profile.exception';
import RateLimitedException from '../exceptions/rate-limited.exception';
import SteamErrorResultException from '../exceptions/steam-error-result.exception';
import UseCaseException from '../exceptions/use-case.exception';
import WaitForItUseCase from './wait-for-it.use-case';

export type GetHttpResponseWithExceptionProps = {
  maxRetries?: number;
};

export type GetHttpResponseWithExceptionInterfaces = {
  fetchUrlUseCase: FetchUrlUseCase | FetchWithDelayUseCase;
};

export type GetHttpResponseWithExceptionConstructor = {
  interfaces: GetHttpResponseWithExceptionInterfaces;
  props: GetHttpResponseWithExceptionProps;
};

export default class GetHttpResponseWithExceptionUseCase {
  private executeCount: number;

  private readonly interfaces: GetHttpResponseWithExceptionInterfaces;

  private readonly props: GetHttpResponseWithExceptionProps;

  public constructor({
    interfaces,
    props,
  }: GetHttpResponseWithExceptionConstructor) {
    this.executeCount = 0;

    this.interfaces = interfaces;
    this.props = props;
  }

  public async execute(
    httpClientProps: HttpClientGetProps,
  ): Promise<HttpClientResponse<InventoryPageResult>> {
    this.executeCount += 1;

    const { fetchUrlUseCase } = this.interfaces;

    try {
      const httpClientResponse =
        await fetchUrlUseCase.execute<InventoryPageResult>(httpClientProps);

      const { statusCode } = httpClientResponse;

      const dataHasError = Boolean(httpClientResponse?.data?.error);
      const hasReceivedData = Boolean(httpClientResponse?.data);

      if (statusCode === 403) {
        throw new PrivateProfileException(httpClientResponse);
      }

      if (statusCode === 429) {
        throw new RateLimitedException(httpClientResponse);
      }

      if (statusCode !== 200) {
        if (dataHasError) {
          const error = String(httpClientResponse?.data?.error);

          const match = /^(.+) \((\d+)\)$/.exec(error);
          const hasMatch = Boolean(match);

          if (hasMatch) {
            const [, resErr, eResult] = match as RegExpExecArray;
            throw new SteamErrorResultException(eResult, resErr);
          }
        }

        if (this.canRetry()) {
          await WaitForItUseCase.execute(DEFAULT_REQUEST_RETRY_DELAY);
          return this.execute(httpClientProps);
        }

        throw new BadStatusCodeException(httpClientResponse);
      }

      if (hasReceivedData) {
        return httpClientResponse;
      }

      throw new EmptyHttpResponseException(httpClientResponse);
    } catch (e) {
      if (
        e instanceof BadStatusCodeException ||
        e instanceof EmptyHttpResponseException ||
        e instanceof PrivateProfileException ||
        e instanceof RateLimitedException ||
        e instanceof SteamErrorResultException
      ) {
        throw e;
      }

      if (e instanceof HttpException) {
        throw new UseCaseException(
          GetHttpResponseWithExceptionUseCase.name,
          `HTTP Error: ${e.message}`,
        );
      }

      if (Object.prototype.hasOwnProperty.call(e, 'message')) {
        const { message } = e as Error;

        throw new UseCaseException(
          GetHttpResponseWithExceptionUseCase.name,
          `${typeof e}: ${message}`,
        );
      }

      throw new UseCaseException(
        GetHttpResponseWithExceptionUseCase.name,
        `Unknown Error: ${String(e)}`,
      );
    }
  }

  private canRetry(): boolean {
    const { maxRetries = DEFAULT_REQUEST_MAX_RETRIES } = this.props;
    return this.executeCount <= maxRetries;
  }
}
