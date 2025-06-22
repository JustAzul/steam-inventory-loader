import {
  DEFAULT_REQUEST_MAX_RETRIES,
  DEFAULT_REQUEST_RETRY_DELAY,
} from '@shared/constants';
import sleep from '@shared/helpers/sleep.helper';
import { StatusCode } from 'status-code-enum';
import { IFetcher } from '../application/ports/fetcher.port';
import {
  HttpClientErrorCodes,
  HttpClientGetProps,
  HttpClientResponse,
} from '../application/types/http-response.type';
import HttpException from '@application/exceptions/http.exception';
import { DataOrError } from '@shared/utils';
import { ErrorPayload } from '@shared/errors';

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

  public execute<T>(
    props: HttpClientGetProps,
  ): Promise<
    DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      HttpClientResponse<T>
    >
  > {
    return this.tryExecute(props, 0);
  }

  private async tryExecute<T>(
    props: HttpClientGetProps,
    attempt: number,
  ): Promise<
    DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      HttpClientResponse<T>
    >
  > {
    const result = await this.decoratedFetcher.execute<T>(props);
    const error = result[0];

    if (!error) {
      return result;
    }

    const maxRetries = this.props.maxRetries ?? DEFAULT_REQUEST_MAX_RETRIES;
    if (attempt >= maxRetries) {
      return [error];
    }

    // Check for specific retryable conditions
    const statusCode = (error.payload as any)?.response?.statusCode;
    if (statusCode === StatusCode.ClientErrorTooManyRequests) {
      const retryAfter = (error.payload as any)?.response?.headers?.[
        'retry-after'
      ];
      if (retryAfter) {
        const delay = this.parseRetryAfter(retryAfter);
        await sleep(delay);
        return this.tryExecute(props, attempt + 1);
      }
    }

    // Default exponential backoff with jitter
    const jitter = Math.floor(Math.random() * 1000);
    const delay = 2 ** attempt * 1000 + jitter;
    await sleep(delay);
    return this.tryExecute(props, attempt + 1);
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
} 