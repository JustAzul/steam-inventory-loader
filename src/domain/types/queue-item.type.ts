export type QueueItem<ItemType> = {
  item: ItemType;
  eventID: symbol;
};
