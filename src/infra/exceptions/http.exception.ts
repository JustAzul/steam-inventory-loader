import { HttpRequest } from '@domain/types/http-request.type';
import { HttpClientResponse } from '@domain/types/http-response.type';

import InfraException from './infra.exception';

export type HttpExceptionProps<T = unknown> = Pick<Error, 'message'> & {
  request: HttpRequest;
  response: Partial<HttpClientResponse<T>>;
};

export class HttpException extends InfraException {
  public readonly props: HttpExceptionProps;

  public constructor(props: HttpExceptionProps) {
    super('HttpClient', props.message);
    this.props = props;
  }
}
