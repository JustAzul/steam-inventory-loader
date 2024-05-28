import { StatusCode } from 'status-code-enum';

import BadStatusCodeException from '../exceptions/bad-status-code.exception';
import EmptyHttpResponseException from '../exceptions/empty-http-response.exception';
import { HttpRequest } from '../types/http-request.type';
import { HttpResponse } from '../types/http-response.type';

import ProcessSteamErrorResultUseCase from './process-steam-error-result.use-case';

export type ValidateHttpResponseProps = {
  request: HttpRequest;
  response: HttpResponse;
};

export default class ValidateHttpResponseUseCase {
  private props: ValidateHttpResponseProps;

  public constructor(props: ValidateHttpResponseProps) {
    this.props = props;
  }

  public execute(): HttpResponse {
    const { response } = this.props;
    const { statusCode } = response;

    const processSteamErrorResultUseCase = new ProcessSteamErrorResultUseCase(
      response,
    );

    processSteamErrorResultUseCase.execute();

    if (statusCode !== StatusCode.SuccessOK) {
      throw new BadStatusCodeException(this.props);
    }

    const hasReceivedData = Boolean(response?.data);

    if (hasReceivedData) {
      return response;
    }

    throw new EmptyHttpResponseException({
      response,
      request: this.props.request,
    });
  }
}
