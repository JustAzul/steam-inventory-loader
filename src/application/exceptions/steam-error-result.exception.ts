export default class SteamErrorResultException extends Error {
  public readonly eresult: number;

  public readonly message: string;

  public constructor(eresult: string | number, message: string) {
    super(message);

    this.eresult = Number(eresult);
    this.message = message;
  }
}
