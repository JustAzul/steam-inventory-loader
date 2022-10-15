export type ItemAsset = {
  amount: string;
  appid: number;
  assetid: string;
  classid: string;
  contextid: string;
  instanceid: string;
  // pos?: number,

  // eslint-disable-next-line camelcase
  is_currency?: unknown;
  currency?: unknown;
  currencyid?: string;
};
