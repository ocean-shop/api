import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from '../../../dto/create-order.dto';
import {
  OrderPaymentStatus,
  OrderStatus,
} from '../../../entities/enums/order.enum';
import { Order } from '../../../entities/order.entity';
import { OrderClientRepository } from '../../../repositories/order/client/order-client.repository';
import { OrderEmailService } from '../../email/order-email.service';
import { OrdersStatusService } from '../common/orders-status.service';

@Injectable()
export class OrdersClientService extends OrdersStatusService {
  private readonly logger = new Logger(OrdersClientService.name);

  constructor(
    private readonly orderClientRepository: OrderClientRepository,
    private readonly orderEmailService: OrderEmailService,
  ) {
    super(orderClientRepository);
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    await this.orderClientRepository.validateProductsForShop(
      dto.shopId,
      dto.items.map((item) => item.productId),
    );

    const order = this.orderClientRepository.create({
      shopId: dto.shopId,
      userId: dto.userId ?? null,
      shippingNumber: dto.shippingNumber,
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

    const savedOrder =
      await this.orderClientRepository.saveWithNextOrderNumber(order);

    await this.orderClientRepository.replaceItems(savedOrder.id, dto.items);

    const createdOrder = await this.orderClientRepository.findById(
      savedOrder.id,
    );

    // Email delivery must not block or fail order creation.
    this.orderEmailService
      .sendOrderCreatedEmail(createdOrder)
      .catch((error: Error) =>
        this.logger.error(
          `Failed to send order created email for order ${createdOrder.id}: ${error.message}`,
        ),
      );

    return createdOrder;
  }
}
