import { Product } from '../../catalog/entities/product.entity';
import { Order } from '../../orders/entities/order.entity';
import { UserShipping } from '../entities/user-shipping.entity';

export type DashboardResponse = {
  lastActiveOrders: Order[];
  ordersCount: number;
  activeOrdersCount: number;
  favoriteProductsCount: number;
  mainShipping: UserShipping | null;
  lastFavoriteProducts: Product[];
};
