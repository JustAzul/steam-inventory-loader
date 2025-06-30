import { injectable } from 'tsyringe';

import { InventoryPageResult } from '@domain/types/inventory-page-result.type';

import { HttpProcessingContext } from './chain/handler';
import { HttpExceptionHandler } from './chain/http-exception.handler';
import { HttpResponseValidationHandler } from './chain/http-response-validation.handler';
import { SteamBodyValidationHandler } from './chain/steam-body-validation.handler';

@injectable()
export class HttpResponseProcessor {
  private readonly chain: HttpExceptionHandler;

  constructor(
    private readonly httpExceptionHandler: HttpExceptionHandler,
    private readonly httpResponseValidationHandler: HttpResponseValidationHandler,
    private readonly steamBodyValidationHandler: SteamBodyValidationHandler,
  ) {
    this.chain = this.httpExceptionHandler;
    this.httpExceptionHandler
      .setNext(this.httpResponseValidationHandler)
      .setNext(this.steamBodyValidationHandler);
  }

  public execute(context: HttpProcessingContext): InventoryPageResult {
    return this.chain.handle(context);
  }
}
