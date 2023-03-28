import { IncomingHttpHeaders } from 'http';

export type HttpExceptionProps = {
  headers: IncomingHttpHeaders;
  message: string;
  statusCode: number | string;
};

export default class HttpException extends Error {
  public readonly headers: IncomingHttpHeaders;

  public readonly statusCode: number;

  public constructor(props: HttpExceptionProps) {
    super(props.message);
    this.headers = props.headers;
    this.statusCode = Number(props.statusCode);
  }
}
