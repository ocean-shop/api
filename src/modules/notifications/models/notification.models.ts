import type { ListResponse } from '../../../core/response/models/response.models';
import type { Notification } from '../entities/notification.entity';

export type OrderCreatedPayload = {
  orderId: string;
  orderNumber: string | null;
  totalAmount: string;
  firstName: string | null;
  lastName: string | null;
};

export type CustomerRegisteredPayload = {
  userId: string;
  email: string | null;
  mobileNumber: string | null;
};

export type NotificationPayload =
  | OrderCreatedPayload
  | CustomerRegisteredPayload;

/** Emitted under `NOTIFICATION_EVENTS.ORDER_CREATED`. */
export type OrderCreatedEvent = { shopId: string } & OrderCreatedPayload;

/** Emitted under `NOTIFICATION_EVENTS.CUSTOMER_REGISTERED`. */
export type CustomerRegisteredEvent = {
  shopId: string;
} & CustomerRegisteredPayload;

/** A notification as it travels through the live stream and Redis. */
export type StreamedNotification = Pick<
  Notification,
  'id' | 'shopId' | 'type' | 'payload' | 'createdAt'
>;

/** A notification as the current admin sees it, with their own read state. */
export type NotificationResponse = StreamedNotification & {
  isRead: boolean;
  readAt: Date | null;
};

export type NotificationsListResponse = ListResponse<NotificationResponse>;

export type UnreadCountResponse = {
  count: number;
};

export type NotificationFilters = {
  shopId: string;
  userId: string;
  unreadOnly: boolean;
};
