import { IncomingHttpHeaders } from 'http';

import { InventoryPageResult } from './inventory-page-result.type';

export type HttpClientErrorCodes =
  | 'HTTP_CLIENT_ERROR'
  | 'INTERNAL_ERROR'
  | 'PROXY_ERROR'
  | 'UNKNOWN_ERROR';

export type HttpClientResponse<T> = {
  data: T | null;
  headers: Record<string, string | number | string[] | undefined>;
  statusCode: number;
};

export type HttpClientGetProps = {
  headers?: IncomingHttpHeaders;
  params?: Record<string, string | number>;
  url: string;
};

export type HttpResponse<T = InventoryPageResult> = HttpClientResponse<T>;

export type HttpErrorPayload = {
  message: string;
  request: HttpClientGetProps;
  response?: Partial<HttpClientResponse<any>>;
};
