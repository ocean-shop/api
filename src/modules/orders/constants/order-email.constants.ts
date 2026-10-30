import { OrderShippingMethod } from '../entities/enums/order.enum';

export const ORDER_CREATED_TEMPLATE = 'order-created';
export const orderCreatedSubject = (orderNumber: string): string =>
  `Замовлення #${orderNumber} прийнято`;

export const ORDER_MANUAL_PAYMENT_TEMPLATE = 'order-manual-payment';
export const orderManualPaymentSubject = (orderNumber: string): string =>
  `Оплата замовлення #${orderNumber}: реквізити`;

/** Env keys holding the shop's bank details for manual (bank transfer) orders. */
export const MANUAL_PAYMENT_CONFIG_KEYS = {
  RECIPIENT: 'MANUAL_PAYMENT_RECIPIENT',
  IBAN: 'MANUAL_PAYMENT_IBAN',
  CARD_NUMBER: 'MANUAL_PAYMENT_CARD_NUMBER',
  PHONE: 'MANUAL_PAYMENT_PHONE',
} as const;

export const SHIPPING_METHOD_LABELS: Readonly<
  Record<OrderShippingMethod, string>
> = {
  [OrderShippingMethod.NOVA]: 'Нова Пошта',
  [OrderShippingMethod.UKR]: 'Укрпошта',
};

export const PAYMENT_LABELS = {
  CASH_ON_DELIVERY: 'Оплата при отриманні',
  CARD_PAID: 'Оплачено банківською карткою',
  CARD_UNPAID: 'Оплата банківською карткою',
  MANUAL: 'Оплата за реквізитами',
} as const;

export const EMAIL_LOCALE = 'uk-UA';
export const EMAIL_TIME_ZONE = 'Europe/Kyiv';
export const CURRENCY_SYMBOL = '₴';
export const KOPECKS_PER_HRYVNIA = 100;
export const MONEY_FRACTION_DIGITS = 2;

/** `uk-UA` long dates end in "р." (рік); the email shows the bare date. */
export const DATE_YEAR_SUFFIX_REGEX = /\s*р\.$/;

/** Orders saved before numbering existed fall back to a short id. */
export const ORDER_ID_FALLBACK_LENGTH = 8;
