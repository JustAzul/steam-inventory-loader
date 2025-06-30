import { AppException } from '@shared/exceptions/app.exception';

export default class DomainException extends AppException {
  public constructor(
    public readonly domainName: string,
    public readonly message: string,
  ) {
    super('Domain', `${domainName}: ${message}`);
  }
}
