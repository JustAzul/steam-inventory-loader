export function error<const T>(error: T) {
  return [error] as [T];
}

export function result<const T = undefined>(result?: T) {
  return [undefined, result] as [undefined, T];
} 