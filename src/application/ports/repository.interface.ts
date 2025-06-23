export type EntityId = string | number;

export interface IRepository<T = unknown> {
  insert(item: T): Promise<T>;
  delete(id: EntityId): Promise<boolean>;
  findAny(): Promise<T>;
}
