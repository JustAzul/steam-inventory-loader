import { HttpException, HttpExceptionProps } from './http.exception';

type SteamBodyErrorExceptionProps = Omit<HttpExceptionProps, 'message'>;

export class SteamBodyErrorException extends HttpException {
  public constructor(props: SteamBodyErrorExceptionProps) {
    super({
      message: 'Steam returned an error in the response body',
      request: props.request,
      response: props.response,
    });
  }
}
