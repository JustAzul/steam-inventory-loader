import { ErrorCode, ErrorPayload } from './errors';

export function error<const T>(error: T) {
  return [error] as [T];
}

export function result<const T = undefined>(result?: T) {
  return [undefined, result] as [undefined, T];
}

export function only<const T = any>(result: T) {
  return result as Only<T>;
}

export type PrettifySoft<T extends object> = { [K in keyof T]: T[K] } & unknown;

export type Mutable<T extends object> = {
  -readonly [P in keyof T]: T[P] extends object ? Mutable<T[P]> : T[P];
};

export type PrettifyMutable<T extends object> = PrettifySoft<{
  -readonly [P in keyof T]: T[P] extends object
    ? PrettifySoft<Mutable<T[P]>>
    : T[P];
}>;

export type Only<T extends any> = T extends object ? PrettifyMutable<T> : T;

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

export type DataOrError<TError = ErrorPayload | ErrorCode, TData = any> =
  | [error: TError]
  | [error: undefined, data: TData];
