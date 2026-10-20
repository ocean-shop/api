export const DEFAULT_OTP_EXPIRE_MS = 5 * 60 * 1000;
export const MS_PER_MINUTE = 60 * 1000;

export const OTP_EMAIL_SUBJECT = 'Ваш код підтвердження';
export const OTP_EMAIL_TEMPLATE = 'otp-code';

export const CONTACT_EMAIL_TEMPLATE = 'contact-us';
export const contactEmailSubject = (username: string): string =>
  `Нове повідомлення від ${username}`;

export const CONTACT_MESSAGES = {
  UNAVAILABLE: 'Contact form is temporarily unavailable',
} as const;
