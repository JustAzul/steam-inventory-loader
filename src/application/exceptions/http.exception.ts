import { HttpClientResponse } from '../ports/http-client.interface';
import { HttpRequest } from '../types/http-request.type';

export type HttpExceptionProps<T = unknown> = Pick<Error, 'message'> & {
  request: HttpRequest;
  response: Partial<HttpClientResponse<T>>;
};

export default class HttpException extends Error {
  public readonly props: HttpExceptionProps;

  public constructor(props: HttpExceptionProps) {
    super(props.message);
    this.props = props;
  }
}
