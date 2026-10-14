import { Order } from '../entities/order.entity';

export type OrdersListResponse = {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
