import { StatusCode } from 'status-code-enum';
import { injectable } from 'tsyringe';

import { BadStatusCodeException } from '@domain/exceptions/bad-status-code.exception';
import { EmptyHttpResponseException } from '@domain/exceptions/empty-http-response.exception';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';


import { AbstractHandler, HttpProcessingContext } from './handler';


@injectable()
export class HttpResponseValidationHandler extends AbstractHandler<unknown> {
  public handle(context: HttpProcessingContext<unknown>): InventoryPageResult {
    const { request, response } = context;

    if (!response) {
      throw new Error('HttpResponseValidationHandler received an empty response.');
    }

    const { statusCode, data } = response;

    if (statusCode !== StatusCode.SuccessOK) {
      throw new BadStatusCodeException({ request, response });
    }

    if (!data) {
      throw new EmptyHttpResponseException({
        request,
        response,
      });
    }

    return super.handle(context);
  }
} 