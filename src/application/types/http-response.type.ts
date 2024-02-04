import { HttpClientResponse } from '../ports/http-client.interface';

import { InventoryPageResult } from './inventory-page-result.type';

export type HttpResponse<T = InventoryPageResult> = HttpClientResponse<T>;
