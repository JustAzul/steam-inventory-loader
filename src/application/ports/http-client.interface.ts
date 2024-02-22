import { IncomingHttpHeaders } from 'http';

import { ErrorPayload } from '../../shared/errors';
import { DataOrError } from '../../shared/utils';

type HttpClientErrorCodes =
  | 'HTTP_CLIENT_ERROR'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

export type HttpClientResponse<T extends unknown> = {
  data: T | null;
  headers: IncomingHttpHeaders;
  statusCode: number;
};

export type HttpClientGetProps = {
  headers?: IncomingHttpHeaders;
  url: string;
};

export interface IHttpClient {
  get<T>(
    props: HttpClientGetProps,
  ): Promise<
    DataOrError<ErrorPayload<HttpClientErrorCodes>, HttpClientResponse<T>>
  >;
}
