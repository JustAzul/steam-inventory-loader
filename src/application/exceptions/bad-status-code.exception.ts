import HttpException, { HttpExceptionProps } from './http.exception';

type BadHttpStatusCodeExceptionProps = Omit<HttpExceptionProps, 'message'>;

export default class BadStatusCodeException extends HttpException {
  public constructor(props: BadHttpStatusCodeExceptionProps) {
    super({
      message: 'Bad Status Code',
      request: props.request,
      response: props.response,
    });
  }
}
