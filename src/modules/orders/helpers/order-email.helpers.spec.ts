import { PAYMENT_LABELS } from '../constants/order-email.constants';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
} from '../entities/enums/order.enum';
import {
  formatMoney,
  formatOrderDate,
  getPaymentLabel,
  toKopecks,
} from './order-email.helpers';

describe('order-email.helpers', () => {
  describe('toKopecks', () => {
    it.each([
      ['1299.99', 129999],
      [10, 1000],
      ['0.1', 10],
    ])('should convert %p to %p kopecks', (amount, expected) => {
      expect(toKopecks(amount)).toBe(expected);
    });
  });

  describe('formatMoney', () => {
    it('should format kopecks as hryvnias with the currency sign', () => {
      expect(formatMoney(129950).replace(/\s/g, ' ')).toBe('1 299,5 ₴');
    });
  });

  describe('formatOrderDate', () => {
    it('should format the date in Kyiv time without the year suffix', () => {
      // 22:30 UTC on Oct 7 is already Oct 8 in Kyiv.
      expect(formatOrderDate(new Date('2026-10-07T22:30:00Z'))).toBe(
        '8 жовтня 2026',
      );
    });
  });

  describe('getPaymentLabel', () => {
    it('should label cash on delivery', () => {
      expect(
        getPaymentLabel({
          paymentMethod: OrderPaymentMethod.COD,
          paymentStatus: OrderPaymentStatus.UNPAID,
        }),
      ).toBe(PAYMENT_LABELS.CASH_ON_DELIVERY);
    });

    it('should label manual payment', () => {
      expect(
        getPaymentLabel({
          paymentMethod: OrderPaymentMethod.MANUAL,
          paymentStatus: OrderPaymentStatus.UNPAID,
        }),
      ).toBe(PAYMENT_LABELS.MANUAL);
    });

    it.each([
      [OrderPaymentStatus.PAID, PAYMENT_LABELS.CARD_PAID],
      [OrderPaymentStatus.UNPAID, PAYMENT_LABELS.CARD_UNPAID],
    ])('should label a card payment that is %s', (paymentStatus, label) => {
      const cardMethod = Object.values(OrderPaymentMethod).find(
        (method) => method !== OrderPaymentMethod.COD,
      ) as OrderPaymentMethod;

      expect(
        getPaymentLabel({ paymentMethod: cardMethod, paymentStatus }),
      ).toBe(label);
    });
  });
});
