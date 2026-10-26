export const PRODUCT_MESSAGES = {
  NOT_FOUND: 'Продукт не знайдено',
  MAIN_BANNER_NOT_FOUND: 'Продукт для головного банера не знайдено',
  REMOVED: 'Продукт успішно видалено',
  DUPLICATE_SKU: 'SKU продукту вже існує для цього магазину',
  DUPLICATE_SLUG: 'Слаг продукту вже існує для цього магазину',
  INVALID_OLD_PRICE: 'oldPrice має бути більшим або дорівнювати price',
  INVALID_PRICE_RANGE: 'priceFrom має бути меншим або дорівнювати priceTo',
  RELATED_ENTITY_NOT_FOUND: 'Повʼязана сутність не існує',
  CONSTRAINT_VIOLATION: 'Дані продукту порушують обмеження бази даних',
} as const;

export const PRODUCT_VARIATION_MESSAGES = {
  NOT_FOUND: 'Варіацію продукта не знайдено',
  OTHER_PRODUCT: 'Варіація не належить вказаному продукту',
  DUPLICATE_ATTRIBUTE: 'Дублювання призначення атрибутів варіації заборонено',
} as const;
