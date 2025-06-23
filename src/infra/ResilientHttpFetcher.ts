import { DEFAULT_REQUEST_MAX_RETRIES } from '@application/constants';
import { IFetcher } from '@application/ports/fetcher.port';
import {
  HttpClientErrorCodes,
  HttpClientGetProps,
  HttpClientResponse,
} from '@application/types/http-response.type';
import { parseRetryAfter } from '@infra/helpers/parse-retry-after.helper';
import sleep from '@infra/helpers/sleep.helper';
import { ErrorPayload } from '@shared/errors';
import { DataOrError } from '@shared/utils';
import { StatusCode } from 'status-code-enum';

export type ResilientHttpFetcherProps = {
  maxRetries?: number;
};

type HttpErrorPayload = {
  response?: {
    headers?: {
      'retry-after'?: string;
    };
    statusCode?: number;
  };
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
    DataOrError<ErrorPayload<HttpClientErrorCodes>, HttpClientResponse<T>>
  > {
    return this.tryExecute(props, 0);
  }

  private async tryExecute<T>(
    props: HttpClientGetProps,
    attempt: number,
  ): Promise<
    DataOrError<ErrorPayload<HttpClientErrorCodes>, HttpClientResponse<T>>
  > {
    const result = await this.decoratedFetcher.execute<T>(props);
    const [error] = result;

    if (!error) {
      return result;
    }

    const maxRetries = this.props.maxRetries ?? DEFAULT_REQUEST_MAX_RETRIES;
    if (attempt >= maxRetries) {
      return [error];
    }

    const payload = error.payload as HttpErrorPayload;
    const statusCode = payload?.response?.statusCode;
    if (statusCode === StatusCode.ClientErrorTooManyRequests) {
      const retryAfter = payload?.response?.headers?.['retry-after'];
      const delay = parseRetryAfter(retryAfter);
      await sleep(delay);
      return this.tryExecute(props, attempt + 1);
    }

    const jitter = Math.floor(Math.random() * 1000);
    const delay = 2 ** attempt * 1000 + jitter;
    await sleep(delay);
    return this.tryExecute(props, attempt + 1);
  }
}
