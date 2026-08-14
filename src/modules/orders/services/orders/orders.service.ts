import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../../dto/create-order.dto';
import { ListOrdersByUserQueryDto } from '../../dto/list-orders-by-user-query.dto';
import { ListOrdersQueryDto } from '../../dto/list-orders-query.dto';
import { UpdateOrderPaymentStatusDto } from '../../dto/update-order-payment-status.dto';
import { UpdateOrderStatusDto } from '../../dto/update-order-status.dto';
import {
  OrderPaymentStatus,
  OrderStatus,
} from '../../entities/enums/order.enum';
import { Order } from '../../entities/order.entity';
import { OrderRepository } from '../../repositories/order/order.repository';

@Injectable()
export class OrdersService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async listOrders(query: ListOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const { items, total } = await this.orderRepository.findAllByShopId(
      query.shopId,
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

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    await this.orderRepository.validateProductsForShop(
      dto.shopId,
      dto.items.map((item) => item.productId),
    );

    const order = this.orderRepository.create({
      shopId: dto.shopId,
      userId: dto.userId,
      shippingNumber: dto.shippingNumber,
      orderNumber: dto.orderNumber,
      subtotalAmount: String(dto.subtotalAmount),
      discountAmount: String(dto.discountAmount),
      totalAmount: String(dto.totalAmount),
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentStatus ?? OrderPaymentStatus.UNPAID,
      shippingMethod: dto.shippingMethod,
      status: dto.status ?? OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    await this.orderRepository.replaceItems(savedOrder.id, dto.items);

    return this.orderRepository.findById(savedOrder.id);
  }

  async removeOrder(id: string): Promise<{ message: string }> {
    const order = await this.orderRepository.findById(id);
    await this.orderRepository.remove(order);
    return { message: 'Order removed successfully' };
  }

  async updatePaymentStatus(
    id: string,
    dto: UpdateOrderPaymentStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    order.paymentStatus = dto.paymentStatus;
    return this.orderRepository.save(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    order.status = dto.status;
    return this.orderRepository.save(order);
  }
}
