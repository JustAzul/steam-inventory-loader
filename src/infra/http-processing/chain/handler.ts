import { HttpRequest } from '@domain/types/http-request.type';
import { HttpResponse } from '@domain/types/http-response.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import { HttpException } from '@infra/exceptions';

export interface IHandler<TRequest, TResponse> {
  setNext(
    handler: IHandler<TRequest, TResponse>,
  ): IHandler<TRequest, TResponse>;
  handle(request: TRequest): TResponse;
}

export type HttpProcessingContext<T = unknown> = {
  request: HttpRequest;
  response?: HttpResponse<T>;
  error?: HttpException;
};

export abstract class AbstractHandler<T = unknown>
  implements IHandler<HttpProcessingContext<T>, InventoryPageResult>
{
  private nextHandler: IHandler<
    HttpProcessingContext<T>,
    InventoryPageResult
  > | null = null;

  public setNext(
    handler: IHandler<HttpProcessingContext<T>, InventoryPageResult>,
  ): IHandler<HttpProcessingContext<T>, InventoryPageResult> {
    this.nextHandler = handler;
    return handler;
  }

  public handle(context: HttpProcessingContext<T>): InventoryPageResult {
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }
    throw new Error('HttpProcessingChain ended without a valid response.');
  }
}
