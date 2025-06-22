import { StatusCode } from 'status-code-enum';

import {
  DEFAULT_REQUEST_MAX_RETRIES,
  DEFAULT_REQUEST_RETRY_DELAY,
} from '../../shared/constants';
import sleep from '../../shared/helpers/sleep.helper';
import PrivateProfileException from '../exceptions/private-profile.exception';
import RateLimitedException from '../exceptions/rate-limited.exception';
import SteamErrorResultException from '../exceptions/steam-error-result.exception';
import UseCaseException from '../exceptions/use-case.exception';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../ports/http-client.interface';
import { InventoryPageResult } from '../types/inventory-page-result.type';

import FetchWithDelayUseCase from './fetch-with-delay.use-case';
import ValidateHttpResponseUseCase from './validate-http-response.use-case';

export type GetHttpResponseWithExceptionProps = {
  maxRetries?: number;
};

export type GetHttpResponseWithExceptionInterfaces = {
  fetchUrlUseCase: FetchWithDelayUseCase;
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
  }: Readonly<GetHttpResponseWithExceptionConstructor>) {
    this.executeCount = 0;

    this.interfaces = interfaces;
    this.props = props;
  }

  public async execute(
    httpClientProps: Readonly<HttpClientGetProps>,
  ): Promise<HttpClientResponse<InventoryPageResult>> {
    this.executeCount += 1;

    const { fetchUrlUseCase } = this.interfaces;

    const [error, response] =
      await fetchUrlUseCase.execute<InventoryPageResult>(httpClientProps);

    if (error) {
      const statusCode = error.payload.response?.statusCode;

      if (statusCode === StatusCode.ClientErrorForbidden) {
        throw new PrivateProfileException({
          request: error.payload.request,
          response: error.payload.response,
        });
      }

      if (this.canRetry()) {
        return this.retry(httpClientProps, statusCode, error.payload.response);
      }

      if (statusCode === StatusCode.ClientErrorTooManyRequests) {
        throw new RateLimitedException({
          request: error.payload.request,
          response: error.payload.response,
        });
      }

      throw new UseCaseException(
        GetHttpResponseWithExceptionUseCase.name,
        `Failed after max retries: ${error.payload.message}`,
      );
    }

    try {
      const validateHttpResponseUseCase = new ValidateHttpResponseUseCase({
        request: httpClientProps,
        response,
      });

      const validatedResponse = validateHttpResponseUseCase.execute();
      return validatedResponse;
    } catch (e) {
      if (e instanceof SteamErrorResultException) {
        throw e;
      }

      if (this.canRetry()) {
        return this.retry(httpClientProps);
      }

      if (e instanceof Error) {
        throw new UseCaseException(
          GetHttpResponseWithExceptionUseCase.name,
          `Validation failed after max retries: ${e.message}`,
        );
      }

      throw new UseCaseException(
        GetHttpResponseWithExceptionUseCase.name,
        `Unknown validation error after max retries: ${String(e)}`,
      );
    }
  }

  private async retry(
    httpClientProps: Readonly<HttpClientGetProps>,
    statusCode?: number,
    response?: HttpClientResponse<InventoryPageResult>,
  ): Promise<HttpClientResponse<InventoryPageResult>> {
    if (statusCode === StatusCode.ClientErrorTooManyRequests) {
      const retryAfter = response?.headers?.['retry-after'];
      if (retryAfter) {
        const delay = this.parseRetryAfter(retryAfter);
        await sleep(delay);
        return this.execute(httpClientProps);
      }
    }

    const jitter = Math.floor(Math.random() * 1000);
    const delay = 2 ** (this.executeCount - 1) * 1000 + jitter;
    await sleep(delay);
    return this.execute(httpClientProps);
  }

  private parseRetryAfter(retryAfter: string | number | string[]): number {
    if (typeof retryAfter === 'number') {
      return retryAfter * 1000;
    }

    if (typeof retryAfter === 'string') {
      const seconds = Number(retryAfter);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }

      const date = new Date(retryAfter);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      return Math.max(0, diff);
    }

    return DEFAULT_REQUEST_RETRY_DELAY;
  }

  private canRetry(): boolean {
    const { maxRetries = DEFAULT_REQUEST_MAX_RETRIES } = this.props;
    return this.executeCount <= maxRetries;
  }
}
