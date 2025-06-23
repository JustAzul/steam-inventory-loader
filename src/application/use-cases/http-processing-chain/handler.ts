import HttpException from '@application/exceptions/http.exception';
import { HttpRequest } from '@application/types/http-request.type';
import { HttpResponse } from '@application/types/http-response.type';

export interface IHandler<TRequest, TResponse> {
  setNext(handler: IHandler<TRequest, TResponse>): IHandler<TRequest, TResponse>;
  handle(request: TRequest): TResponse;
}

export type HttpProcessingContext<T = unknown> = {
  request: HttpRequest;
  response?: HttpResponse<T>;
  error?: HttpException;
};

export abstract class AbstractHandler<T = unknown>
  implements IHandler<HttpProcessingContext<T>, HttpResponse<T>>
{
  private nextHandler: IHandler<HttpProcessingContext<T>, HttpResponse<T>> | null =
    null;

  public setNext(
    handler: IHandler<HttpProcessingContext<T>, HttpResponse<T>>,
  ): IHandler<HttpProcessingContext<T>, HttpResponse<T>> {
    this.nextHandler = handler;
    return handler;
  }

  public handle(context: HttpProcessingContext<T>): HttpResponse<T> {
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }
    if (context.response) {
      return context.response;
    }
    throw new Error('HttpProcessingChain ended without a valid response.');
  }
} 