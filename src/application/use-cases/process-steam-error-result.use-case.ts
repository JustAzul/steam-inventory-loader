import { HttpResponse } from '../types/http-response.type';
import SteamErrorResultException from '../exceptions/steam-error-result.exception';

export default class ProcessSteamErrorResultUseCase {
  private httpResponse: HttpResponse;

  public constructor(httpResponse: HttpResponse) {
    this.httpResponse = httpResponse;
  }

  public execute(): void {
    const dataError = this.httpResponse?.data?.error;
    const dataHasError = Boolean(dataError);

    if (dataHasError) {
      const error = String(dataError);

      const match = /^(.+) \((\d+)\)$/.exec(error);
      const hasMatch = Boolean(match);

      if (hasMatch) {
        const [, resErr, eResult] = match as RegExpExecArray;
        throw new SteamErrorResultException(eResult, resErr);
      }
    }
  }
}
