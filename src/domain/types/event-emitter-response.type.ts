export type EventEmitterResponse<ResponseType, ErrorType = Error> = {
  error: ErrorType | null;
  result: ResponseType | null;
};
