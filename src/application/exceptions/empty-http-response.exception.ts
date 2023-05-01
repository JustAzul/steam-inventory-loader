import HttpException, { HttpExceptionProps } from './http.exception';

type EmptyHttpResponseExceptionProps = Omit<HttpExceptionProps, 'message'>;

export default class EmptyHttpResponseException extends HttpException {
  public constructor(props: EmptyHttpResponseExceptionProps) {
    super({
      message: 'Empty HTTP Response',
      request: props.request,
      response: props.response,
    });
  }
}
