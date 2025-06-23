export class ErrorCode<const TCode = string> {
  constructor(readonly code: TCode) {}
}

export type ErrorPayloadProps<TCode, TPayload> = {
  code: TCode;
  payload: TPayload;
};

export class ErrorPayload<
  const TCode = string,
  const TPayload = Record<string, unknown>,
> {
  readonly code: TCode;
  readonly payload: TPayload;

  constructor(props: ErrorPayloadProps<TCode, TPayload>) {
    this.code = props.code;
    this.payload = props.payload;
  }

  public toString(): string {
    return `ErrorPayload: { code: ${this.code}, payload: ${JSON.stringify(
      this.payload,
      null,
      2,
    )} }`;
  }
}
