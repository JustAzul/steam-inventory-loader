import ApplicationException from './application.exception';

export class UseCaseException extends ApplicationException {
  public constructor(
    public readonly useCaseName: string,
    public readonly message: string,
  ) {
    super(useCaseName, message);
  }
}
