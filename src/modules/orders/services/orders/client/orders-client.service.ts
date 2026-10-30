import { Injectable, Logger } from '@nestjs/common';
import { JwtPayload } from '../../../../user/models/auth-request.models';
import { CreateOrderDto } from '../../../dto/create-order.dto';
import { ListOrdersQueryDto } from '../../../dto/list-orders-query.dto';
import {
  OrderPaymentStatus,
  OrderStatus,
} from '../../../entities/enums/order.enum';
import { Order } from '../../../entities/order.entity';
import { OrdersListResponse } from '../../../models/order.models';
import { OrderClientRepository } from '../../../repositories/order/client/order-client.repository';
import { OrderEmailService } from '../../email/order-email.service';
import {
  resolvePagination,
  toListResponse,
} from '../../../../../core/response/helpers/list-response/list-response.helpers';
import { assertCanAccessUser } from '../../../../user/helpers/access/access.helpers';

@Injectable()
export class OrdersClientService {
  private readonly logger = new Logger(OrdersClientService.name);

  constructor(
    private readonly orderClientRepository: OrderClientRepository,
    private readonly orderEmailService: OrderEmailService,
  ) {}

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

  async listOrdersByUser(
    userId: string,
    query: ListOrdersQueryDto,
    requester?: JwtPayload,
  ): Promise<OrdersListResponse> {
    assertCanAccessUser(userId, requester);

    const { page, limit, skip } = resolvePagination(query);
    const { items, total } =
      await this.orderClientRepository.findAllByShopIdAndUserId(
        query.shopId,
        userId,
        skip,
        limit,
      );

    return toListResponse(items, total, page, limit);
  }

  async getOrderById(id: string, requester?: JwtPayload): Promise<Order> {
    const order = await this.orderClientRepository.findById(id);
    assertCanAccessUser(order.userId, requester);

    return order;
  }
}
