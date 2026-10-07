import { Injectable } from '@nestjs/common';
import { ListOrdersByUserQueryDto } from '../../../dto/list-orders-by-user-query.dto';
import { ListOrdersQueryDto } from '../../../dto/list-orders-query.dto';
import { Order } from '../../../entities/order.entity';
import { OrderRepository } from '../../../repositories/order/admin/order.repository';
import { OrdersStatusService } from '../common/orders-status.service';

@Injectable()
export class OrdersService extends OrdersStatusService {
  constructor(private readonly orderRepository: OrderRepository) {
    super(orderRepository);
  }

  async listOrders(query: ListOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const { items, total } = await this.orderRepository.findAllByShopId(
      query.shopId,
      skip,
      limit,
      query.orderNumber,
      query.sortOrder,
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async listOrdersByUser(query: ListOrdersByUserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const { items, total } =
      await this.orderRepository.findAllByShopIdAndUserId(
        query.shopId,
        query.userId,
        skip,
        limit,
      );

    return {
      items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async getOrderById(id: string): Promise<Order> {
    return this.orderRepository.findById(id);
  }

  async removeOrder(id: string): Promise<{ message: string }> {
    const order = await this.orderRepository.findById(id);
    await this.orderRepository.remove(order);
    return { message: 'Замовлення успішно видалено' };
  }
}
