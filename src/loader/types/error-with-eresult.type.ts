export type ErrorWithEResult = Error & {
  eresult?: number | string;
};
