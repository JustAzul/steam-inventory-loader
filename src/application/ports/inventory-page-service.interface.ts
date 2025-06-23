import { InventoryPageResult } from '@application/types/inventory-page-result.type';
import { GetInventoryPageResultUseCaseProps } from '@application/types/get-inventory-page-result-use-case-props.type';

export interface IInventoryPageService {
  getInventoryPage(
    props: GetInventoryPageResultUseCaseProps,
  ): Promise<InventoryPageResult>;
} 