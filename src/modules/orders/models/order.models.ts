import { ListResponse } from '../../../core/response/models/response.models';
import { Order } from '../entities/order.entity';

export type OrdersListResponse = ListResponse<Order>;

export type OrderItemPayload = {
  productId: string;
  unitPrice: number;
  quantity: number;
};
