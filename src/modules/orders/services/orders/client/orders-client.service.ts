import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../../../dto/create-order.dto';
import {
  OrderPaymentStatus,
  OrderStatus,
} from '../../../entities/enums/order.enum';
import { Order } from '../../../entities/order.entity';
import { OrderClientRepository } from '../../../repositories/order/client/order-client.repository';
import { OrdersStatusService } from '../common/orders-status.service';

@Injectable()
export class OrdersClientService extends OrdersStatusService {
  constructor(private readonly orderClientRepository: OrderClientRepository) {
    super(orderClientRepository);
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    await this.orderClientRepository.validateProductsForShop(
      dto.shopId,
      dto.items.map((item) => item.productId),
    );

    const order = this.orderClientRepository.create({
      shopId: dto.shopId,
      userId: dto.userId,
      shippingNumber: dto.shippingNumber,
      orderNumber: dto.orderNumber,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      middleName: dto.middleName ?? null,
      email: dto.email ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      subtotalAmount: String(dto.subtotalAmount),
      discountAmount: String(dto.discountAmount),
      totalAmount: String(dto.totalAmount),
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentStatus ?? OrderPaymentStatus.UNPAID,
      shippingMethod: dto.shippingMethod,
      status: dto.status ?? OrderStatus.PENDING,
    });

    const savedOrder = await this.orderClientRepository.save(order);

    await this.orderClientRepository.replaceItems(savedOrder.id, dto.items);

    return this.orderClientRepository.findById(savedOrder.id);
  }
}
