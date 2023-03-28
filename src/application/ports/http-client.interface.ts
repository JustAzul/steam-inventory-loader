import { IncomingHttpHeaders, OutgoingHttpHeader } from 'http';

export type HttpClientResponse<T extends unknown> = {
  data: T | null;
  headers: IncomingHttpHeaders;
  statusCode: number;
};

export type HttpClientGetProps = {
  headers?: OutgoingHttpHeader;
  url: string;
};

export interface IHttpClient {
  get<T>(props: HttpClientGetProps): Promise<HttpClientResponse<T>>;
}
