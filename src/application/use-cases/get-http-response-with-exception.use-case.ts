import {
  DEFAULT_REQUEST_MAX_RETRIES,
  DEFAULT_REQUEST_RETRY_DELAY,
} from '../../shared/constants';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../ports/http-client.interface';

import BadStatusCodeException from '../exceptions/bad-status-code.exception';
import FetchUrlUseCase from './fetch-url.use-case';
import FetchWithDelayUseCase from './fetch-with-delay.use-case';
import HttpException from '../exceptions/http.exception';
import { InventoryPageResult } from '../types/inventory-page-result.type';
import ThrownResponseExceptionUseCase from './thrown-response-exceptions.use-case';
import UseCaseException from '../exceptions/use-case.exception';
import sleep from '../../shared/helpers/sleep.helper';

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

    let httpClientResponse: HttpClientResponse<InventoryPageResult>;

    try {
      httpClientResponse = await fetchUrlUseCase.execute<InventoryPageResult>(
        httpClientProps,
      );
    } catch (e) {
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

    try {
      const thrownResponseException = new ThrownResponseExceptionUseCase({
        httpClientResponse,
      });

      const response = thrownResponseException.execute();
      return response;
    } catch (e) {
      if (this.canRetry() && e instanceof BadStatusCodeException) {
        await sleep(DEFAULT_REQUEST_RETRY_DELAY);
        return this.execute(httpClientProps);
      }

      throw e;
    }
  }

  private canRetry(): boolean {
    const { maxRetries = DEFAULT_REQUEST_MAX_RETRIES } = this.props;
    return this.executeCount <= maxRetries;
  }
}
