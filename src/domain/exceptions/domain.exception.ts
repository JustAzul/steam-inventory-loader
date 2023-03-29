export default class DomainException extends Error {
  public constructor(name: string, errorMessage: string) {
    const message = `${name}: ${errorMessage}`;
    super(message);
  }
}
