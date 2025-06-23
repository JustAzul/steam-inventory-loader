import LoadInventoryUseCase, {
  LoadInventoryPageUseCaseProps,
} from '@application/use-cases/load-inventory.use-case';
import { inject, injectable } from 'tsyringe';

import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import SteamItemEntity from '@domain/entities/steam-item.entity';

@injectable()
export class AzulSteamInventoryLoader extends IAzulSteamInventoryLoader {
  constructor(
    @inject(LoadInventoryUseCase)
    private readonly loadInventoryUseCase: LoadInventoryUseCase,
  ) {
    super();
  }

  public async load(
    props: LoadInventoryPageUseCaseProps,
  ): Promise<SteamItemEntity[]> {
    return this.loadInventoryUseCase.execute(props);
  }
} 