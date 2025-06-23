import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../types/http-response.type';

export interface IFetcher {
  execute<FetchUrlResult>(
    httpClientGetProps: Readonly<HttpClientGetProps>,
  ): Promise<HttpClientResponse<FetchUrlResult>>;
}
