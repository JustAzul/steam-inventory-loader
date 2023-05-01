import HttpException, { HttpExceptionProps } from './http.exception';

type RateLimitedExceptionProps = Omit<HttpExceptionProps, 'message'>;

export default class RateLimitedException extends HttpException {
  public constructor(props: RateLimitedExceptionProps) {
    super({
      message: 'Rate Limited',
      request: props.request,
      response: props.response,
    });
  }
}
