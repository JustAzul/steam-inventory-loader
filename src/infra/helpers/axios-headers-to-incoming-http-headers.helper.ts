import { IncomingHttpHeaders } from 'http';

import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

export function toIncomingHttpHeaders(
  headers: AxiosResponseHeaders | RawAxiosResponseHeaders,
): IncomingHttpHeaders {
  const result: IncomingHttpHeaders = {};
  for (const key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key)) {
      const value = headers[key];
      if (value !== null && value !== undefined) {
        result[key] = Array.isArray(value) ? value.map(String) : String(value);
      }
    }
  }
  return result;
}
