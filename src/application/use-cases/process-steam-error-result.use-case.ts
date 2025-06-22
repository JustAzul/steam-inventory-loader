import { injectable } from 'tsyringe';
import SteamErrorResultException from '../exceptions/steam-error-result.exception';
import { HttpResponse } from '../types/http-response.type';

@injectable()
export default class ProcessSteamErrorResultUseCase {
  public execute(response: HttpResponse): void {
    const dataError = response?.data?.error;
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
