import { HttpClientGetProps } from './http-response.type';

export type HttpRequest = Pick<HttpClientGetProps, 'url'> & {
  headers?: HttpClientGetProps['headers'];
};
