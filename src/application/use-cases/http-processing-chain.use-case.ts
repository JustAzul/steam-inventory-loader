import { injectable } from 'tsyringe';

import { HttpResponse } from '@application/types/http-response.type';

import {
  HttpProcessingContext,
} from './http-processing-chain/handler';
import { HttpExceptionHandler } from './http-processing-chain/http-exception.handler';
import { HttpResponseValidationHandler } from './http-processing-chain/http-response-validation.handler';
import { SteamBodyValidationHandler } from './http-processing-chain/steam-body-validation.handler';

@injectable()
export class HttpProcessingChainUseCase {
  private chain: HttpExceptionHandler;

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

  public execute(context: HttpProcessingContext): HttpResponse {
    return this.chain.handle(context) as HttpResponse;
  }
} 