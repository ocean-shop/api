import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../../../core/mail/mail.service';
import {
  ORDER_CREATED_TEMPLATE,
  ORDER_ID_FALLBACK_LENGTH,
  SHIPPING_METHOD_LABELS,
  orderCreatedSubject,
} from '../../constants/order-email.constants';
import {
  formatMoney,
  formatOrderDate,
  getPaymentLabel,
  toKopecks,
} from '../../helpers/order-email.helpers';
import { Order } from '../../entities/order.entity';
import {
  OrderCreatedEmailContext,
  OrderEmailItem,
} from '../../models/order-email.models';
import { OrderClientRepository } from '../../repositories/order/client/order-client.repository';

@Injectable()
export class OrderEmailService {
  private readonly logger = new Logger(OrderEmailService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly orderClientRepository: OrderClientRepository,
  ) {}

  async sendOrderCreatedEmail(order: Order): Promise<void> {
    if (!order.email) {
      return;
    }

    const context = await this.buildContext(order, order.email);

    await this.mailService.sendMail({
      to: order.email,
      subject: orderCreatedSubject(context.orderNumber),
      template: ORDER_CREATED_TEMPLATE,
      context,
    });
    this.logger.log(`Sent order created email for order ${order.id}`);
  }

  private async buildContext(
    order: Order,
    email: string,
  ): Promise<OrderCreatedEmailContext> {
    const orderItems = order.items ?? [];
    const imageUrls = await this.orderClientRepository.findProductImageUrls(
      orderItems.map((item) => item.productId),
    );

    const items: OrderEmailItem[] = orderItems.map((item) => {
      const total = toKopecks(item.unitPrice) * item.quantity;
      const oldTotal = item.product?.oldPrice
        ? toKopecks(item.product.oldPrice) * item.quantity
        : 0;

      return {
        name: item.product?.name ?? '',
        imageUrl: imageUrls.get(item.productId) ?? null,
        quantity: item.quantity,
        total: formatMoney(total),
        oldTotal: oldTotal > total ? formatMoney(oldTotal) : null,
      };
    });

    const subtotal = toKopecks(order.subtotalAmount);
    const discount = toKopecks(order.discountAmount);
    const total = toKopecks(order.totalAmount);
    const deliveryCost = total - (subtotal - discount);

    const recipientName = [order.lastName, order.firstName, order.middleName]
      .filter(Boolean)
      .join(' ');

    return {
      orderNumber:
        order.orderNumber ?? order.id.slice(0, ORDER_ID_FALLBACK_LENGTH),
      orderDate: formatOrderDate(order.createdAt),
      firstName: order.firstName,
      items,
      itemsCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: formatMoney(subtotal),
      discount: discount > 0 ? formatMoney(discount) : null,
      deliveryCost: deliveryCost > 0 ? formatMoney(deliveryCost) : null,
      total: formatMoney(total),
      paymentLabel: getPaymentLabel(order),
      shippingMethod: SHIPPING_METHOD_LABELS[order.shippingMethod],
      shippingNumber: order.shippingNumber,
      recipientName: recipientName || null,
      phoneNumber: order.phoneNumber,
      email,
    };
  }
}
