import HttpException, { HttpExceptionProps } from './http.exception';

type EmptyHttpResponseExceptionProps = Pick<
  HttpExceptionProps,
  'statusCode' | 'headers'
>;

export default class EmptyHttpResponseException extends HttpException {
  public constructor(props: EmptyHttpResponseExceptionProps) {
    super({
      headers: props.headers,
      message: 'empty http response',
      statusCode: props.statusCode,
    });
  }
}
