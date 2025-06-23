import { StatusCode } from 'status-code-enum';
import { injectable } from 'tsyringe';

import BadStatusCodeException from '@application/exceptions/bad-status-code.exception';
import EmptyHttpResponseException from '@application/exceptions/empty-http-response.exception';
import { HttpResponse } from '@application/types/http-response.type';

import { AbstractHandler, HttpProcessingContext } from './handler';


@injectable()
export class HttpResponseValidationHandler extends AbstractHandler<unknown> {
  public handle(context: HttpProcessingContext<unknown>): HttpResponse<unknown> {
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