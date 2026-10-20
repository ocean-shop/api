/** A Ukrainian number as users type it: +380XXXXXXXXX, 380XXXXXXXXX or 0XXXXXXXXX. */
export const UKRAINIAN_PHONE_REGEX = /^(\+380|380|0)\d{9}$/;

/** The only form TurboSMS accepts: 380XXXXXXXXX. */
export const NORMALIZED_UKRAINIAN_PHONE_REGEX = /^380\d{9}$/;
export const UKRAINIAN_COUNTRY_CODE_PREFIX = '38';

export const CONTACT_REGEX =
  /^(?:(?:\+380|380|0)\d{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/;

export const BIRTHDAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const VALIDATION_MESSAGES = {
  PHONE:
    'Phone must be a valid Ukrainian number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  CONTACT:
    'Contact must be a valid email or Ukrainian phone number in +380XXXXXXXXX, 380XXXXXXXXX, or 0XXXXXXXXX format',
  BIRTHDAY: 'birthday must be in YYYY-MM-DD format',
} as const;
