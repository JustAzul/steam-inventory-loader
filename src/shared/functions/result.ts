export function error<const E>(err: E): [E, undefined] {
  return [err, undefined];
}

export function result<const T = undefined>(
  res?: T,
): [undefined, T | undefined] {
  return [undefined, res];
}
