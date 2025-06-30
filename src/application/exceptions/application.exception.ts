import { AppException } from '@shared/exceptions/app.exception';

export default class ApplicationException extends AppException {
  public constructor(
    public readonly useCaseName: string,
    public readonly message: string,
  ) {
    super('Application', `${useCaseName}: ${message}`);
  }
}
