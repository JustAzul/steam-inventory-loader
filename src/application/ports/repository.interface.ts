import { ErrorCode } from '@shared/errors';
import { DataOrError } from '@shared/utils';

type InsertErrorCodes = 'REPOSITORY_INSERT_UNKNOWN_ERROR';
type DeleteErrorCodes = 'REPOSITORY_DELETE_ERROR_ITEM_NOT_FOUND';
type FindAnyErrorCodes = 'REPOSITORY_FIND_ANY_ERROR_REPOSITORY_EMPTY';

export abstract class IRepository<T = unknown> {
  abstract insert(item: T): DataOrError<ErrorCode<InsertErrorCodes>, T>;

  abstract delete(
    id: unknown,
  ): DataOrError<ErrorCode<DeleteErrorCodes>, boolean>;

  abstract findAny(): DataOrError<ErrorCode<FindAnyErrorCodes>, T>;
}
