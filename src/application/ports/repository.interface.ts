// import { ErrorCode } from '@shared/errors';
// import { DataOrError } from '@shared/utils';

// type InsertErrorCodes = 'REPOSITORY_INSERT_UNKNOWN_ERROR';
// type DeleteErrorCodes = 'REPOSITORY_DELETE_ERROR_ITEM_NOT_FOUND';
// type FindAnyErrorCodes = 'REPOSITORY_FIND_ANY_ERROR_REPOSITORY_EMPTY';

export type EntityId = string | number;

export interface IRepository<T = unknown> {
  insert(item: T): Promise<T>;
  delete(id: EntityId): Promise<boolean>;
  findAny(): Promise<T>;
}
