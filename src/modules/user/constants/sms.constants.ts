export const TURBOSMS_DEFAULT_URL = 'https://api.turbosms.ua/message/send.json';

/** Statuses TurboSMS reports for a message it took. */
export const TURBOSMS_SUCCESS_STATUS_REGEX = /accepted|queued|ok|success/i;
export const TURBOSMS_SUCCESS_CODE = 0;

export const SMS_MESSAGES = {
  NOT_CONFIGURED: 'Налаштування TurboSMS відсутні',
  SEND_FAILED: 'Не вдалося надіслати OTP SMS',
  INVALID_PHONE: 'Некоректний український номер телефону',
  UNKNOWN_ERROR: 'Невідома помилка TurboSMS',
  otpText: (code: string): string => `Ваш код підтвердження: ${code}`,
} as const;
