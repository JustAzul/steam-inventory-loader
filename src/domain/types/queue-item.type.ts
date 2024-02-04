export type QueueItem<ItemType> = {
  eventID: symbol;
  item: ItemType;
};
