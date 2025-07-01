import 'reflect-metadata';
import { container } from 'tsyringe';

import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import {
  ItemDetails,
  LoaderResponse,
  OptionalConfig,
} from '@application/ports/dtos/steam-inventory-loader-dtos';
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

function toItemDetails(item: SteamItemEntity): ItemDetails {
  return {
    ...item,
    assetid: item.assetId,
    classid: item.classId,
    instanceid: item.instanceId,
    amount: item.amount,
    is_currency: item.isCurrency,
    tradable: item.isTradable,
    marketable: item.isMarketable,
    commodity: item.isCommodity,
    market_tradable_restriction: item.marketTradableRestriction,
    market_marketable_restriction: item.marketMarketableRestriction,
    actions: item.actions,
    owner_actions: item.ownerActions,
    descriptions: item.descriptions,
    owner_descriptions: item.ownerDescriptions,
    tags: item.tags,
    background_color: item.backgroundColor,
    icon_url: item.iconUrl,
    icon_url_large: item.iconUrlLarge,
    market_hash_name: item.marketHashName,
    market_name: item.marketName,
    name: item.name,
    type: item.type,
    item_expiration: item.itemExpiration,
    market_fee_app: item.marketFeeApp,
    cache_expiration: item.cacheExpiration,
    fraudwarnings: item.fraudWarnings,
    contextid: item.contextId,
    currency: item.currency,
    appid: item.appId,
    id: item.id,
  };
}

export class AzulSteamInventoryLoaderFacade {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static Loader(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SteamID64: string,
    appID: string | number,
    contextID: string | number,
    optionalConfig?: OptionalConfig,
  ): Promise<LoaderResponse> {
    const { SteamCommunity_Jar, ...restConfig } = optionalConfig || {};
    const loader = createInventoryLoader({
      ...restConfig,
      // @ts-expect-error this is a required property
      steamCommunityJar: SteamCommunity_Jar,
    });
    return loader
      .load({
        steamID64: SteamID64,
        appID: Number(appID),
        contextID: String(contextID),
      })
      .then((items) => ({
        count: items.length,
        inventory: items.map(toItemDetails),
        success: true,
      }));
  }
} 