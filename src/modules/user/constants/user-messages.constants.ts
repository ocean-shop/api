export const USER_MESSAGES = {
  NOT_FOUND: 'Користувача не знайдено',
  ADMIN_NOT_FOUND: 'Адміністратора не знайдено',
  ADMIN_REMOVED: 'Адміністратора успішно видалено',
  EMAIL_TAKEN: 'Email вже використовується',
  PHONE_TAKEN: 'Номер телефону вже використовується',
  CANNOT_REMOVE_SELF: 'Ви не можете видалити власний акаунт',
  CANNOT_DEMOTE_SELF: 'Ви не можете понизити власний суперакаунт',
  LAST_SUPER_USER: 'Неможливо змінити останнього суперкористувача',
  SHIPPING_NOT_FOUND: 'Спосіб доставки не знайдено',
  missingShops: (shopIds: string[]): string =>
    `Деякі магазини не існують: ${shopIds.join(', ')}`,
} as const;
