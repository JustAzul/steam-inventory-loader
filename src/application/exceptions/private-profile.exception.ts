import HttpException, { HttpExceptionProps } from './http.exception';

type PrivateProfileExceptionProps = Omit<HttpExceptionProps, 'message'>;

export default class PrivateProfileException extends HttpException {
  public constructor(props: PrivateProfileExceptionProps) {
    super({
      message: 'Private profile',
      request: props.request,
      response: props.response,
    });
  }
}
