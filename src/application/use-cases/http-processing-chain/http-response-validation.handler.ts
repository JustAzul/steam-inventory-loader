import { injectable } from 'tsyringe';
import { StatusCode } from 'status-code-enum';

import { AbstractHandler, HttpProcessingContext } from './handler';
import BadStatusCodeException from '@application/exceptions/bad-status-code.exception';
import EmptyHttpResponseException from '@application/exceptions/empty-http-response.exception';

@injectable()
export class HttpResponseValidationHandler extends AbstractHandler {
  public handle(context: HttpProcessingContext): any {
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