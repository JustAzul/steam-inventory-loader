import { StatusCode } from 'status-code-enum';

import { DEFAULT_REQUEST_MAX_RETRIES } from '@application/constants';
import { IFetcher } from '@application/ports/fetcher.port';
import { HttpException } from '@domain/exceptions/http.exception';
import {
  HttpClientGetProps,
} from '@domain/types/http-response.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import { parseRetryAfter } from '@infra/helpers/parse-retry-after.helper';
import sleep from '@infra/helpers/sleep.helper';

export type ResilientHttpFetcherProps = {
  maxRetries?: number;
};

export class ResilientHttpFetcher implements IFetcher {
  private readonly decoratedFetcher: IFetcher;
  private readonly props: ResilientHttpFetcherProps;

  constructor(
    decoratedFetcher: IFetcher,
    props: ResilientHttpFetcherProps = {},
  ) {
    this.decoratedFetcher = decoratedFetcher;
    this.props = props;
  }

  public getFetcher(): IFetcher {
    return this.decoratedFetcher;
  }

  public execute(props: HttpClientGetProps): Promise<InventoryPageResult> {
    return this.tryExecute(props, 0);
  }

  private async tryExecute(
    props: HttpClientGetProps,
    attempt: number,
  ): Promise<InventoryPageResult> {
    try {
      const result = await this.decoratedFetcher.execute(props);
      return result;
    } catch (error) {
      const maxRetries = this.props.maxRetries ?? DEFAULT_REQUEST_MAX_RETRIES;
      if (attempt >= maxRetries) {
        throw error;
      }

      if (error instanceof HttpException) {
        const statusCode = error.props.response?.statusCode;
        if (statusCode === StatusCode.ClientErrorTooManyRequests) {
          const retryAfter = error.props.response?.headers?.['retry-after'];
          const delay = parseRetryAfter(retryAfter);
          await sleep(delay);
          return this.tryExecute(props, attempt + 1);
        }
      }

      // Apply exponential backoff for other errors
      const jitter = Math.floor(Math.random() * 1000);
      const delay = 2 ** attempt * 1000 + jitter;
      await sleep(delay);
      return this.tryExecute(props, attempt + 1);
    }
  }
}
