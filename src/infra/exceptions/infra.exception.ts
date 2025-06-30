import { AppException } from '@shared/exceptions/app.exception';

export default class InfraException extends AppException {
  public constructor(
    public readonly sourceName: string,
    public readonly message: string,
  ) {
    super('Infrastructure', `${sourceName}: ${message}`);
  }
}
