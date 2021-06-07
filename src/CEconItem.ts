/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
export interface ItemAsset {
amount: string,
appid: number,
assetid: string,
classid: string,
contextid: string,
instanceid: string,
// pos?: number,

// eslint-disable-next-line camelcase
is_currency?: any,
currency?: any,
currencyid?: any,
}

export interface Tag {
// eslint-disable-next-line camelcase
internal_name: string,
name: string,
category: string,
color: string,
// eslint-disable-next-line camelcase
category_name: string
}

export interface rawTag {
category: string,
// eslint-disable-next-line camelcase
internal_name: string,
// eslint-disable-next-line camelcase
localized_category_name?: string,
// eslint-disable-next-line camelcase
localized_tag_name: string,
// eslint-disable-next-line camelcase
category_name: string,
color?: string,
name?: string
}

export interface InnerItemDescription {
value: string
}

export interface ItemActions {
link: string,
name: string
}

export interface ItemDescription {
actions: ItemActions[],
appid: number,
// eslint-disable-next-line camelcase
background_color: string,
classid: string,
commodity: number,
currency: number,
descriptions: InnerItemDescription[],
// eslint-disable-next-line camelcase
owner_descriptions?: InnerItemDescription[],
// eslint-disable-next-line camelcase
icon_url: string,
// eslint-disable-next-line camelcase
icon_url_large: string,
instanceid: string,
// eslint-disable-next-line camelcase
market_fee_app: number,
// eslint-disable-next-line camelcase
market_hash_name: string,
// eslint-disable-next-line camelcase
market_marketable_restriction: number,
// eslint-disable-next-line camelcase
market_name: string,
// eslint-disable-next-line camelcase
market_tradable_restriction: number,
marketable: number,
name: string,
tags: rawTag[],
tradable: number,
owner?: any,
type: string,
// eslint-disable-next-line camelcase
item_expiration?: string,
[ListingKey: string]: any
}

export interface ItemDetails {
id: string

// eslint-disable-next-line camelcase
is_currency: boolean,
instanceid: string,
amount: number,
contextid: string

appid: number,
assetid: string,
classid: string,
// pos: number,

tradable: boolean,
marketable: boolean,
commodity: boolean,

fraudwarnings: [],
descriptions: InnerItemDescription[],
// eslint-disable-next-line camelcase
owner_descriptions?: InnerItemDescription[],

// eslint-disable-next-line camelcase
market_hash_name: string,
// eslint-disable-next-line camelcase
market_tradable_restriction: number,
// eslint-disable-next-line camelcase
market_marketable_restriction: number
// eslint-disable-next-line camelcase
market_fee_app?: number,

// eslint-disable-next-line camelcase
cache_expiration?: string
// eslint-disable-next-line camelcase
item_expiration?: string

tags?: Tag[],
actions:ItemActions[],

// eslint-disable-next-line camelcase
owner_actions?: ItemActions[],

// descs

// eslint-disable-next-line camelcase
background_color: string,
currency: number,
// eslint-disable-next-line camelcase
icon_url: string,
// eslint-disable-next-line camelcase
icon_url_large: string,

// eslint-disable-next-line camelcase
market_name: string,
name: string,
type: string,
owner?: any,

}

async function ParseTags(tags: rawTag[]): Promise<Tag[]> {
  const ParsedTags:Tag[] = [];

  {
    const Iterate = ():Promise<void> => new Promise((resolve) => {
      const Execute = (i = 0) => {
        if (i === tags.length) {
          resolve();
          return;
        }

        const tag = tags[i];

        const o: Tag = {
          internal_name: tag.internal_name,
          name: tag?.localized_tag_name || tag.name || '',
          category: tag?.category,
          color: tag.color || '',
          category_name: tag?.localized_category_name || tag.category_name,
        };

        ParsedTags.push(o);
        setImmediate(Execute.bind(null, i + 1));
      };

      Execute();
    });

    await Iterate();
  }

  return ParsedTags;
}

async function ItemParser(item: ItemAsset, description: ItemDescription, contextID: string): Promise<ItemDetails> {
  // eslint-disable-next-line camelcase
  const is_currency = !!(item.is_currency || item.currency) || typeof item.currencyid !== 'undefined';
  // eslint-disable-next-line camelcase
  const id = is_currency ? item.currencyid : item.assetid;

  if (description) {
    // Is this a listing of descriptions?
    const ListingKey = `${item.classid}_${item.instanceid}`;
    // eslint-disable-next-line no-param-reassign
    if (Object.prototype.hasOwnProperty.call(description, ListingKey)) description = description[ListingKey];
  }

  const Details: ItemDetails = {
    is_currency,
    id,
    appid: item.appid,
    // pos: item.pos,
    classid: item.classid,
    assetid: item.assetid,
    instanceid: item.instanceid || '0',
    amount: parseInt(item.amount, 10),
    contextid: item.contextid || contextID,

    tradable: !!description?.tradable,
    marketable: !!description?.marketable,
    commodity: !!description?.commodity,

    owner_descriptions: description?.owner_descriptions || undefined,
    item_expiration: description?.item_expiration || undefined,

    fraudwarnings: description?.fraudwarnings || [],
    descriptions: description?.descriptions || [],

    market_tradable_restriction: description?.market_tradable_restriction ? parseInt(description.market_tradable_restriction.toString(), 10) : 0,
    market_marketable_restriction: description?.market_marketable_restriction ? parseInt(description.market_marketable_restriction.toString(), 10) : 0,
    market_hash_name: description?.market_hash_name,

    actions: description?.actions || [],
    background_color: description.background_color,
    currency: description.currency,
    icon_url: description.icon_url,
    icon_url_large: description.icon_url_large,
    market_name: description.market_name,
    name: description.name,
    type: description.type,

    // eslint-disable-next-line eqeqeq
    owner: (description.owner && JSON.stringify(description.owner) == '{}') ? undefined : description.owner,

  };

  if (description?.tags) Details.tags = await ParseTags(description.tags);

  // Restore market_fee_app, if applicable
  // eslint-disable-next-line eqeqeq
  if (Details.appid == 753 && Details.contextid == '6' && Details.market_hash_name) {
    // eslint-disable-next-line no-underscore-dangle
    const _match = Details.market_hash_name.match(/^(\d+)-/);
    if (_match) Details.market_fee_app = parseInt(_match[1], 10);
  }

  // If we have item_expiration, also set cache_expiration to the same value
  if (Details.item_expiration) Details.cache_expiration = Details.item_expiration;
  // eslint-disable-next-line eqeqeq
  else if (Details.appid == 730 && Details.contextid == '2' && Details.owner_descriptions) {
    const Desc = Details.owner_descriptions.find((d) => d.value && d.value.indexOf('Tradable After ') === 0);
    if (Desc) {
      const date = new Date(Desc.value.substring(15).replace(/[,()]/g, ''));
      if (date) Details.cache_expiration = date.toISOString();
    }
  }

  // eslint-disable-next-line no-param-reassign
  if (item.currency) item.currency = null;

  return Details;
}

export default ItemParser;
