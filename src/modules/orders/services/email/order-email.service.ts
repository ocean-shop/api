import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../../../core/mail/mail.service';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderShippingMethod,
} from '../../entities/enums/order.enum';
import { Order } from '../../entities/order.entity';
import {
  OrderCreatedEmailContext,
  OrderEmailItem,
} from '../../models/order-email.models';
import { OrderClientRepository } from '../../repositories/order/client/order-client.repository';

const SHIPPING_METHOD_LABELS: Record<OrderShippingMethod, string> = {
  [OrderShippingMethod.NOVA]: 'Нова Пошта',
  [OrderShippingMethod.UKR]: 'Укрпошта',
};

const moneyFormatter = new Intl.NumberFormat('uk-UA', {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Kyiv',
});

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
      subject: `Замовлення #${context.orderNumber} прийнято`,
      template: 'order-created',
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
      orderNumber: order.orderNumber ?? order.id.slice(0, 8),
      orderDate: dateFormatter.format(order.createdAt).replace(/\s*р\.$/, ''),
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

function toKopecks(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

function formatMoney(kopecks: number): string {
  return `${moneyFormatter.format(kopecks / 100)} ₴`;
}

function getPaymentLabel(order: Order): string {
  if (order.paymentMethod === OrderPaymentMethod.COD) {
    return 'Оплата при отриманні';
  }

  return order.paymentStatus === OrderPaymentStatus.PAID
    ? 'Оплачено банківською карткою'
    : 'Оплата банківською карткою';
}
