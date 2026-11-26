import { PERCENT, REPORT_PERIOD_LIMITS } from './finance-report.constants';

export const FINANCE_REPORT_MESSAGES = {
  INVALID_DATE: 'Некоректна дата. Очікується формат РРРР-ММ-ДД',
  FROM_AFTER_TO: 'Дата початку періоду не може бути пізніше дати завершення',
  PERIOD_TOO_LONG: `Період звіту не може перевищувати ${REPORT_PERIOD_LIMITS.MAX_DAYS} днів`,
} as const;

/** Digits after the dot in percents shown inside insight texts. */
const INSIGHT_PERCENT_DIGITS = 1;

const formatPercent = (value: number): string =>
  `${value > 0 ? '+' : ''}${value.toFixed(INSIGHT_PERCENT_DIGITS)}%`;

const formatShare = (ratio: number): string =>
  `${(ratio * PERCENT).toFixed(INSIGHT_PERCENT_DIGITS)}%`;

/** User-facing insight texts (Ukrainian). Builders keep numbers out of the rule code. */
export const FINANCE_INSIGHT_MESSAGES = {
  NET_SALES_GROWTH: (change: number): string =>
    `Чисті продажі зросли на ${formatPercent(change)} порівняно з попереднім періодом`,
  NET_SALES_DECLINE: (change: number): string =>
    `Чисті продажі змінилися на ${formatPercent(change)} порівняно з попереднім періодом`,
  DISCOUNTS_OUTPACE_SALES: (
    discountChange: number,
    grossChange: number,
  ): string =>
    `Знижки змінилися на ${formatPercent(discountChange)}, а валові продажі лише на ${formatPercent(grossChange)}: перевірте акції`,
  HIGH_CANCELLATION_RATE: (rate: number): string =>
    `Висока частка скасованих замовлень: ${formatShare(rate)}`,
  HIGH_COD_IN_TRANSIT: (share: number): string =>
    `${formatShare(share)} чистих продажів ще в дорозі з накладеним платежем і не оплачені`,
  AOV_DECLINE: (change: number): string =>
    `Середній чек змінився на ${formatPercent(change)}`,
  TOP_PRODUCT_DEPENDENCY: (name: string, share: number): string =>
    `Товар «${name}» дає ${formatShare(share)} виручки: висока залежність від одного товару`,
  DEAD_STOCK: (count: number, days: number): string =>
    `${count} активних товарів не продавалися понад ${days} днів`,
  LOW_REPEAT_RATE: (rate: number): string =>
    `Лише ${formatShare(rate)} клієнтів купували повторно`,
  AT_RISK_CUSTOMERS: (count: number): string =>
    `${count} постійних клієнтів давно не купували: варто запустити реактивацію`,
} as const;
