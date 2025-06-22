import SteamErrorResultException from '../exceptions/steam-error-result.exception';
import { HttpResponse } from '../types/http-response.type';

export default class ProcessSteamErrorResultUseCase {
  public execute(httpResponse: HttpResponse): void {
    const dataError = httpResponse?.data?.error;
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
