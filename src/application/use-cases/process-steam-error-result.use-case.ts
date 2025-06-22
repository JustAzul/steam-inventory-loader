import { injectable } from 'tsyringe';
import SteamErrorResultException from '../exceptions/steam-error-result.exception';
import { HttpResponse } from '../types/http-response.type';
import { STEAM_MARKET_PATTERNS } from '@shared/constants';

@injectable()
export default class ProcessSteamErrorResultUseCase {
  public execute(response: HttpResponse): void {
    const dataError = response?.data?.error;
    const dataHasError = Boolean(dataError);

    if (dataHasError) {
      const error = String(dataError);

      const match = STEAM_MARKET_PATTERNS.STEAM_ERROR_FORMAT.exec(error);
      const hasMatch = Boolean(match);

      if (hasMatch && match) {
        const [, resErr, eResult] = match;
        if (resErr && eResult) {
          throw new SteamErrorResultException(eResult, resErr);
        }
      }
    }
  }
}
