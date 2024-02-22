export class ErrorCode<const TCode = string> {
  constructor(readonly code: TCode) {}
}

export class ErrorPayload<
  const TCode = string,
  const TPayload = Record<string, any>,
> {
  readonly code: TCode;
  readonly payload: TPayload;

  constructor(props: ErrorPayloadProps<TCode, TPayload>) {
    this.code = props.code;
    this.payload = props.payload;
  }
}

type ErrorPayloadProps<TCode = string, TPayload = Record<string, any>> = {
  code: TCode;
  payload: TPayload;
};
