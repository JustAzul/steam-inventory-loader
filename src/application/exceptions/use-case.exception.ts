export default class UseCaseException extends Error {
  public constructor(useCaseName: string, message: string) {
    const errorMessage = `${useCaseName}: ${message}`;
    super(errorMessage);
  }
}
