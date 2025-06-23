import { HttpRequest } from '@domain/types/http-request.type';
import { HttpClientResponse } from '@domain/types/http-response.type';

export type HttpExceptionProps<T = unknown> = Pick<Error, 'message'> & {
  request: HttpRequest;
  response: Partial<HttpClientResponse<T>>;
};

export class HttpException extends Error {
  public readonly props: HttpExceptionProps;

  public constructor(props: HttpExceptionProps) {
    super(props.message);
    this.props = props;
  }
}
