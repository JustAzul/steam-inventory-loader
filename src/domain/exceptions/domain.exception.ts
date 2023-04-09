export default class DomainException extends Error {
  public constructor(
    public readonly domainName: string,
    public readonly message: string,
  ) {
    super(`${domainName}: ${message}`);
  }
}
