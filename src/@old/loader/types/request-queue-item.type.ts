import { AxiosRequestConfig } from 'axios';

export type RequestQueueItem = {
  id: symbol;
  options: AxiosRequestConfig<never>;
  url: string;
};
