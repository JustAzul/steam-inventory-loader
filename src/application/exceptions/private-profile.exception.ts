import HttpException, { HttpExceptionProps } from './http.exception';

type PrivateProfileExceptionProps = Pick<
  HttpExceptionProps,
  'statusCode' | 'headers'
>;

export default class PrivateProfileException extends HttpException {
  public constructor(props: PrivateProfileExceptionProps) {
    super({
      headers: props.headers,
      message: 'private profile',
      statusCode: props.statusCode,
    });
  }
}
