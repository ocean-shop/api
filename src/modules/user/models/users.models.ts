import { Order } from '../../orders/entities/order.entity';
import { User } from '../entities/user.entity';

export type UserWithOrders = User & {
  orders: Order[];
};

export type UsersByShopResponse = {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
