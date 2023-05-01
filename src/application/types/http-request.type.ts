import { HttpClientGetProps } from '../ports/http-client.interface';

export type HttpRequest = Pick<HttpClientGetProps, 'url' | 'headers'>;
