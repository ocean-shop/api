import type { Notification } from '../../entities/notification.entity';
import type {
  NotificationResponse,
  StreamedNotification,
} from '../../models/notification.models';

/**
 * Strips an entity down to plain fields, so relations never leak into the
 * stream or the Redis message.
 */
export const toStreamedNotification = (
  notification: StreamedNotification,
): StreamedNotification => ({
  id: notification.id,
  shopId: notification.shopId,
  type: notification.type,
  payload: notification.payload,
  createdAt: notification.createdAt,
});

/**
 * Flattens the read row joined for the current admin into `isRead`/`readAt`
 * and drops the relation itself from the response.
 */
export const toNotificationResponse = (
  notification: Notification,
): NotificationResponse => {
  const readAt = notification.reads?.[0]?.readAt ?? null;

  return {
    ...toStreamedNotification(notification),
    isRead: readAt !== null,
    readAt,
  };
};
