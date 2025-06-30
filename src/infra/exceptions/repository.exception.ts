import InfraException from './infra.exception';

export class RepositoryException extends InfraException {
  public constructor(
    public readonly repositoryName: string,
    public readonly message: string,
    public readonly options?: { cause?: Error },
  ) {
    super(repositoryName, message);
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}
