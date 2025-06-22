import { ErrorPayload } from '@shared/errors';
import { DataOrError } from '@shared/utils';

import {
  HttpClientErrorCodes,
  HttpClientGetProps,
  HttpClientResponse,
} from '../types/http-response.type';

export interface IFetcher {
  execute<FetchUrlResult>(
    httpClientGetProps: Readonly<HttpClientGetProps>,
  ): Promise<
    DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      HttpClientResponse<FetchUrlResult>
    >
  >;
} 