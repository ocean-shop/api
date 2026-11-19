/**
 * Domain events other modules emit through `EventEmitter2`. The emitters do
 * not know notifications exist; `NotificationsListener` turns events into rows.
 */
export const NOTIFICATION_EVENTS = {
  ORDER_CREATED: 'order.created',
  CUSTOMER_REGISTERED: 'customer.registered',
} as const;

/** DI tokens for the optional Redis connections that fan notifications out. */
export const NOTIFICATION_PUBLISHER = 'NOTIFICATION_PUBLISHER';
export const NOTIFICATION_SUBSCRIBER = 'NOTIFICATION_SUBSCRIBER';

/**
 * Redis pub/sub channel. Every API instance subscribes to it, so a
 * notification created on one instance reaches admins connected to another.
 */
export const NOTIFICATION_CHANNEL = 'notifications';

/** SSE `event:` names the admin panel listens for. */
export const NOTIFICATION_SSE_EVENTS = {
  NOTIFICATION: 'notification',
  HEARTBEAT: 'heartbeat',
} as const;

/**
 * Proxies (Railway included) close HTTP connections that stay silent for too
 * long, so the stream sends a heartbeat well inside that window.
 */
export const NOTIFICATION_HEARTBEAT_INTERVAL_MS = 25_000;
