import { Injectable } from '@nestjs/common';
import { ListOrdersByUserQueryDto } from '../../../dto/list-orders-by-user-query.dto';
import { ListOrdersQueryDto } from '../../../dto/list-orders-query.dto';
import { Order } from '../../../entities/order.entity';
import { OrdersListResponse } from '../../../models/order.models';
import { OrderRepository } from '../../../repositories/order/admin/order.repository';
import { OrdersStatusService } from '../common/orders-status.service';
import {
  resolvePagination,
  toListResponse,
} from '../../../../../core/response/helpers/list-response.helpers';
import { MessageResponse } from '../../../../../core/response/models/response.models';
import { ORDER_MESSAGES } from '../../../constants/order-messages.constants';

@Injectable()
export class OrdersService extends OrdersStatusService {
  constructor(private readonly orderRepository: OrderRepository) {
    super(orderRepository);
  }

  async listOrders(query: ListOrdersQueryDto): Promise<OrdersListResponse> {
    const { page, limit, skip } = resolvePagination(query);
    const { items, total } = await this.orderRepository.findAllByShopId(
      query.shopId,
      skip,
      limit,
      query.orderNumber,
      query.sortOrder,
    );

    return toListResponse(items, total, page, limit);
  }

  async listOrdersByUser(
    query: ListOrdersByUserQueryDto,
  ): Promise<OrdersListResponse> {
    const { page, limit, skip } = resolvePagination(query);
    const { items, total } =
      await this.orderRepository.findAllByShopIdAndUserId(
        query.shopId,
        query.userId,
        skip,
        limit,
      );

    return toListResponse(items, total, page, limit);
  }

  async getOrderById(id: string): Promise<Order> {
    return this.orderRepository.findById(id);
  }

  async removeOrder(id: string): Promise<MessageResponse> {
    const order = await this.orderRepository.findById(id);
    await this.orderRepository.remove(order);
    return { message: ORDER_MESSAGES.REMOVED };
  }
}
