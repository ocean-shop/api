export const ORDER_MESSAGES = {
  NOT_FOUND: 'Замовлення не знайдено',
  REMOVED: 'Замовлення успішно видалено',
  unknownProducts: (productIds: string[]): string =>
    `Невідомі ID продуктів для цього магазину: ${productIds.join(', ')}`,
} as const;
