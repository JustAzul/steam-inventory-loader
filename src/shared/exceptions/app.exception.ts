export abstract class AppException extends Error {
  protected constructor(
    public readonly layer: string,
    public readonly message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
