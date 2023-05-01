import BadStatusCodeException from '../exceptions/bad-status-code.exception';
import EmptyHttpResponseException from '../exceptions/empty-http-response.exception';
import { HttpClientResponse } from '../ports/http-client.interface';
import { InventoryPageResult } from '../types/inventory-page-result.type';
import PrivateProfileException from '../exceptions/private-profile.exception';
import RateLimitedException from '../exceptions/rate-limited.exception';
import { StatusCode } from 'status-code-enum';
import SteamErrorResultException from '../exceptions/steam-error-result.exception';

export type ThrownResponseExceptionProps = {
  httpClientResponse: HttpClientResponse<InventoryPageResult>;
};

export default class ThrownResponseExceptionUseCase {
  private readonly props: ThrownResponseExceptionProps;

  public constructor(props: Readonly<ThrownResponseExceptionProps>) {
    this.props = props;
  }

  public execute(): HttpClientResponse<InventoryPageResult> {
    const { httpClientResponse } = this.props;
    const { statusCode } = httpClientResponse;

    const dataHasError = Boolean(httpClientResponse?.data?.error);
    const hasReceivedData = Boolean(httpClientResponse?.data);

    if (statusCode === StatusCode.ClientErrorForbidden) {
      throw new PrivateProfileException(httpClientResponse);
    }

    if (statusCode === StatusCode.ClientErrorTooManyRequests) {
      throw new RateLimitedException(httpClientResponse);
    }

    if (statusCode !== StatusCode.SuccessOK) {
      if (dataHasError) {
        const error = String(httpClientResponse?.data?.error);

        const match = /^(.+) \((\d+)\)$/.exec(error);
        const hasMatch = Boolean(match);

        if (hasMatch) {
          const [, resErr, eResult] = match as RegExpExecArray;
          throw new SteamErrorResultException(eResult, resErr);
        }
      }

      throw new BadStatusCodeException(httpClientResponse);
    }

    if (hasReceivedData) {
      return httpClientResponse;
    }

    throw new EmptyHttpResponseException(httpClientResponse);
  }
}
