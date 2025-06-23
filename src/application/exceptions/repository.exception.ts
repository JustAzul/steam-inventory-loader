export class RepositoryException extends Error {
  public constructor(message: string, options?: { cause?: Error }) {
    super(message, options);
    this.name = 'RepositoryException';
  }
} 