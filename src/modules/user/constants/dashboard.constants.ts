import { OrderStatus } from '../../orders/entities/enums/order.enum';

export const LAST_ACTIVE_ORDERS_LIMIT = 3;
export const LAST_FAVORITE_PRODUCTS_LIMIT = 4;

// Orders that are not shipped or cancelled yet are still in progress.
export const ACTIVE_ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
];
