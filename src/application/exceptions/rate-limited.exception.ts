import HttpException, { HttpExceptionProps } from './http.exception';

type RateLimitedExceptionProps = Pick<
  HttpExceptionProps,
  'statusCode' | 'headers'
>;

export default class RateLimitedException extends HttpException {
  public constructor(props: RateLimitedExceptionProps) {
    super({
      headers: props.headers,
      message: 'rate limited',
      statusCode: props.statusCode,
    });
  }
}
