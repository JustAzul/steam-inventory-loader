import 'reflect-metadata';
import { container } from 'tsyringe';

import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import {
  ItemDetails,
  LoaderResponse,
  OptionalConfig,
  Tag,
} from '@application/ports/dtos/steam-inventory-loader-dtos';
import { LoadInventoryPageUseCaseProps } from '@application/use-cases/load-inventory.use-case';
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { LoaderConfig } from '@domain/types/loader-config.type';

import { registerAllDependencies } from './dependency-container';
import { AzulSteamInventoryLoader } from './presentation/azul-steam-inventory-loader';

function createInventoryLoader(
  config: LoaderConfig,
): IAzulSteamInventoryLoader {
  const requestContainer = container.createChildContainer();
  registerAllDependencies(requestContainer, config);
  return requestContainer.resolve(AzulSteamInventoryLoader);
}

function tagToObject(tag: SteamItemTag): Tag {
  return {
    category: tag.category ?? '',
    category_name: tag.category_name ?? '',
    color: tag.color ?? '',
    internal_name: tag.internal_name,
    name: tag.name ?? '',
  };
}

function toItemDetails(item: SteamItemEntity): ItemDetails {
  const { adapter } = item;
  return {
    actions: item.actions,
    amount: adapter.amount,
    appid: item.getAppId(),
    assetid: item.assetid,
    background_color: adapter.background_color,
    cache_expiration: item.item_expiration,
    classid: adapter.classid,
    commodity: adapter.commodity,
    contextid: adapter.contextid,
    currency: item.getCurrency(),
    descriptions: item.descriptions,
    fraudwarnings: item.fraudwarnings,
    icon_url: adapter.icon_url,
    icon_url_large: adapter.icon_url_large,
    id: item.id,
    instanceid: adapter.instanceid,
    is_currency: item.is_currency,
    item_expiration: item.item_expiration,
    market_fee_app: undefined,
    market_hash_name: adapter.market_hash_name,
    market_marketable_restriction: item.getMarketMarketableRestriction(),
    market_name: item.market_name,
    market_tradable_restriction: item.getMarketTradableRestriction(),
    marketable: adapter.marketable,
    name: adapter.name,
    owner: item.owner,
    owner_actions: [], // Not available in new entity
    owner_descriptions: item.owner_descriptions,
    tags: (item.tags ?? []).map(tagToObject),
    tradable: adapter.tradable,
    type: adapter.type,
  };
}

class AzulSteamInventoryLoaderFacade {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static Loader(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SteamID64: string,
    appID: string | number,
    contextID: string | number,
    optionalConfig?: OptionalConfig,
  ): Promise<LoaderResponse> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { SteamCommunity_Jar, ...restConfig } = optionalConfig ?? {};
    if (!SteamCommunity_Jar) {
      throw new Error(
        '[AzulSteamInventoryLoader] Breaking Change: `SteamCommunity_Jar` is now a required property in `optionalConfig`. Please provide a valid `tough-cookie` CookieJar.',
      );
    }
    const config = {
      ...restConfig,
      steamCommunityJar: SteamCommunity_Jar,
    };
    const loader = createInventoryLoader(config);

    const props: LoadInventoryPageUseCaseProps = {
      appID: Number(appID),
      config,
      contextID: String(contextID),
      steamID64: SteamID64,
    };

    return loader.load(props).then((items) => ({
      count: items.length,
      inventory: items.map(toItemDetails),
      success: true,
    }));
  }
}

export default AzulSteamInventoryLoaderFacade;

// Export key types and entities for consumers of the library
export type { LoaderConfig } from '@domain/types/loader-config.type';
export { default as SteamItem } from '@domain/entities/steam-item.entity';
export { default as SteamTag } from '@domain/entities/steam-item-tag.entity';
export type { CardType } from '@domain/types/card-type.type';
export type { RawTag } from '@domain/types/raw-tag.type';
export type { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
export { default as ILoader } from '@application/ports/azul-steam-inventory-loader.interface';
