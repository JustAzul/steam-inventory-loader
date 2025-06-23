import { ErrorCode, ErrorPayload } from '../errors';

export type PrettifySoft<T extends object> = { [K in keyof T]: T[K] } & unknown;

export type Mutable<T extends object> = {
  -readonly [P in keyof T]: T[P] extends object ? Mutable<T[P]> : T[P];
};

export type PrettifyMutable<T extends object> = PrettifySoft<{
  -readonly [P in keyof T]: T[P] extends object
    ? PrettifySoft<Mutable<T[P]>>
    : T[P];
}>;

export type Only<T> = T | undefined;

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

export type DataOrError<TError = ErrorPayload | ErrorCode, TData = unknown> =
  | [error: TError]
  | [error: undefined, data: TData]; 