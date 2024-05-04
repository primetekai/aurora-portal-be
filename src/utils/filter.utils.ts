type orderType = 'ASC' | 'DESC';

interface IOrder {
  [key: string]: orderType;
}

export enum Quantity {
  ALL_INVENTORY,
  LOW_OF_STOCK,
  OUT_OF_STOCK,
}

export const formatSelect = (
  select: string[],
  table: string,
): string[] | null => {
  if (!select || !Array.isArray(select) || !select.length) return null;
  const newSelect = select.map((fieldName) => `${table}.${fieldName}`);
  return newSelect;
};

export const formatOrder = (order: IOrder, table: string): IOrder => {
  const newOrder = {};
  if (!order) return newOrder;
  for (const propertyName in order) {
    newOrder[`${table}.${propertyName}`] = order[`${propertyName}`];
  }
  return newOrder;
};
