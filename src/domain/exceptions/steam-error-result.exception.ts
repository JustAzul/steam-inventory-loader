import DomainException from './domain.exception';

export class SteamErrorResultException extends DomainException {
  public readonly eresult: number;

  public constructor(eresult: string | number, message: string) {
    super('Steam', message);
    this.eresult = Number(eresult);
  }
}
