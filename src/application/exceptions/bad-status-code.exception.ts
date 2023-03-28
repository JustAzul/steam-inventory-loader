import HttpException, { HttpExceptionProps } from './http.exception';

type BadHttpStatusCodeExceptionProps = Pick<
  HttpExceptionProps,
  'statusCode' | 'headers'
>;

export default class BadStatusCodeException extends HttpException {
  public constructor(props: BadHttpStatusCodeExceptionProps) {
    super({
      headers: props.headers,
      message: 'bad status code',
      statusCode: props.statusCode,
    });
  }
}
