import { StatusCode } from 'status-code-enum';

import BadStatusCodeException from '../exceptions/bad-status-code.exception';
import EmptyHttpResponseException from '../exceptions/empty-http-response.exception';
import { HttpRequest } from '../types/http-request.type';
import { HttpResponse } from '../types/http-response.type';

import ProcessSteamErrorResultUseCase from './process-steam-error-result.use-case';

export default class ValidateHttpResponseUseCase {
  private readonly processSteamErrorResultUseCase: ProcessSteamErrorResultUseCase;

  public constructor(
    processSteamErrorResultUseCase: ProcessSteamErrorResultUseCase,
  ) {
    this.processSteamErrorResultUseCase = processSteamErrorResultUseCase;
  }

  public execute(
    request: HttpRequest,
    response: HttpResponse,
  ): HttpResponse {
    const { statusCode } = response;

    this.processSteamErrorResultUseCase.execute(response);

    if (statusCode !== StatusCode.SuccessOK) {
      throw new BadStatusCodeException({ request, response });
    }

    const hasReceivedData = Boolean(response?.data);

    if (hasReceivedData) {
      return response;
    }

    throw new EmptyHttpResponseException({
      response,
      request,
    });
  }
}
