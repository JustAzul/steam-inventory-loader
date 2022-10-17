import { Dispatcher } from 'undici';

export type RequestOptions = { dispatcher?: Dispatcher } & Omit<
  Dispatcher.RequestOptions,
  'origin' | 'path' | 'method'
> &
  Partial<Pick<Dispatcher.RequestOptions, 'method'>>;
