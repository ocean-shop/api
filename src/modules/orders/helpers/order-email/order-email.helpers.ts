import {
  CURRENCY_SYMBOL,
  DATE_YEAR_SUFFIX_REGEX,
  EMAIL_LOCALE,
  EMAIL_TIME_ZONE,
  KOPECKS_PER_HRYVNIA,
  MONEY_FRACTION_DIGITS,
  PAYMENT_LABELS,
} from '../../constants/order-email.constants';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
} from '../../entities/enums/order.enum';
import { Order } from '../../entities/order.entity';

const moneyFormatter = new Intl.NumberFormat(EMAIL_LOCALE, {
  maximumFractionDigits: MONEY_FRACTION_DIGITS,
});

const dateFormatter = new Intl.DateTimeFormat(EMAIL_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: EMAIL_TIME_ZONE,
});

/** Amounts are summed in kopecks so the totals never pick up float noise. */
export function toKopecks(amount: string | number): number {
  return Math.round(Number(amount) * KOPECKS_PER_HRYVNIA);
}

export function formatMoney(kopecks: number): string {
  return `${moneyFormatter.format(kopecks / KOPECKS_PER_HRYVNIA)} ${CURRENCY_SYMBOL}`;
}

export function formatOrderDate(date: Date): string {
  return dateFormatter.format(date).replace(DATE_YEAR_SUFFIX_REGEX, '');
}

export function getPaymentLabel(
  order: Pick<Order, 'paymentMethod' | 'paymentStatus'>,
): string {
  if (order.paymentMethod === OrderPaymentMethod.COD) {
    return PAYMENT_LABELS.CASH_ON_DELIVERY;
  }

  if (order.paymentMethod === OrderPaymentMethod.MANUAL) {
    return PAYMENT_LABELS.MANUAL;
  }

  return order.paymentStatus === OrderPaymentStatus.PAID
    ? PAYMENT_LABELS.CARD_PAID
    : PAYMENT_LABELS.CARD_UNPAID;
}
