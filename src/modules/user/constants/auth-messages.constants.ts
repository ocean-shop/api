export const AUTH_MESSAGES = {
  OTP_SENT: 'OTP-код успішно надіслано',
  OTP_REQUEST_PENDING:
    'Ви вже надіслали запит. Будь ласка, зачекайте, доки він завершиться.',
  OTP_NOT_FOUND: 'Активний OTP-код не знайдено',
  OTP_EXPIRED: 'Термін дії OTP-коду минув',
  OTP_INVALID: 'Неправильний OTP-код',
  OTP_BLOCKED: 'Забагато спроб. Спробуйте знову через 5 хвилин.',
  CONTACT_REQUIRED: 'Потрібно вказати email або телефон',
  INVALID_LOGIN: 'Вкажіть коректний email або номер телефону',
  ACCESS_DENIED: 'Доступ заборонено',
  USER_BLOCKED: 'Користувача заблоковано',
  ACCESS_TOKEN_REQUIRED: 'Потрібен токен доступу',
  ACCESS_TOKEN_INVALID: 'Недійсний або прострочений токен доступу',
  REFRESH_TOKEN_REQUIRED: 'Потрібен refresh-токен',
  REFRESH_TOKEN_INVALID: 'Недійсний refresh-токен',
  LOGGED_OUT: 'Ви успішно вийшли з системи',
  ROLE_INFO_MISSING: 'Інформацію про роль користувача не знайдено',
  roleRequired: (roles: readonly string[]): string =>
    `Для цієї дії потрібна одна з ролей: ${roles.join(', ')}`,
  roleNotConfigured: (role: string): string => `Роль ${role} не налаштована`,
} as const;
