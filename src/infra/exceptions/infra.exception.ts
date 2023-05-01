export default class InfraException extends Error {
  public constructor(sourceName: string, message: string) {
    const errorMessage = `${sourceName}: ${message}`;
    super(errorMessage);
  }
}
