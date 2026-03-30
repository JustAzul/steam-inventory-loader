import { AxiosRequestConfig } from 'axios';

export type RequestQueueItem = {
  id: symbol;
  url: string;
  options: AxiosRequestConfig<never>;
};
