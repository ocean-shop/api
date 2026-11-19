import { NotificationType } from '../../entities/enums/notification.enum';
import {
  toNotificationResponse,
  toStreamedNotification,
} from './notification.helpers';

describe('notification helpers', () => {
  const createdAt = new Date('2026-11-13T10:00:00Z');
  const base = {
    id: 'n-1',
    shopId: 'shop-1',
    type: NotificationType.ORDER_CREATED,
    payload: {
      orderId: 'order-1',
      orderNumber: '1001',
      totalAmount: '95.00',
      firstName: null,
      lastName: null,
    },
    createdAt,
  };

  describe('toNotificationResponse', () => {
    it('should mark a notification with a read row as read', () => {
      const readAt = new Date('2026-11-13T11:00:00Z');

      const result = toNotificationResponse({
        ...base,
        reads: [{ readAt }],
        shop: { id: 'shop-1' },
      } as any);

      expect(result).toEqual({ ...base, isRead: true, readAt });
    });

    it('should mark a notification without a read row as unread', () => {
      const result = toNotificationResponse({ ...base, reads: [] } as any);

      expect(result).toEqual({ ...base, isRead: false, readAt: null });
    });

    it('should treat missing reads relation as unread', () => {
      const result = toNotificationResponse({ ...base } as any);

      expect(result).toEqual({ ...base, isRead: false, readAt: null });
    });
  });

  describe('toStreamedNotification', () => {
    it('should keep only plain notification fields', () => {
      const result = toStreamedNotification({
        ...base,
        reads: [],
        shop: { id: 'shop-1' },
      } as any);

      expect(result).toEqual(base);
    });
  });
});
