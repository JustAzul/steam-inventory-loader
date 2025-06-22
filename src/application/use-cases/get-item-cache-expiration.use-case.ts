import { injectable } from 'tsyringe';
import SteamItemEntity from '@domain/entities/steam-item.entity';

@injectable()
export default class GetItemCacheExpirationUseCase {
  public execute(item: SteamItemEntity): string | undefined {
    if (item.item_expiration) return item.item_expiration;

    if (
      item.getAppId() === 730 &&
      item.contextid === '2' &&
      item.owner_descriptions
    ) {
      const tradableDescription = item.owner_descriptions.find(
        (description) =>
          description.value &&
          description.value.indexOf('Tradable After ') === 0,
      );

      if (tradableDescription) {
        const date: Date = new Date(
          tradableDescription.value.substring(15).replace(/[,()]/g, ''),
        );

        return date.toISOString();
      }
    }

    return undefined;
  }
} 