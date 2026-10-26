import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../../../core/mail/mail.service';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderShippingMethod,
} from '../../entities/enums/order.enum';
import { OrderClientRepository } from '../../repositories/order/client/order-client.repository';
import { OrderEmailService } from './order-email.service';

describe('OrderEmailService', () => {
  let service: OrderEmailService;
  let mailService: any;
  let orderClientRepository: any;

  const buildOrder = (overrides: Record<string, unknown> = {}): any => ({
    id: 'a1b2c3d4-0000-0000-0000-000000000000',
    orderNumber: '48211',
    createdAt: new Date('2026-10-08T10:00:00Z'),
    firstName: 'Олена',
    lastName: 'Коваль',
    middleName: 'Петрівна',
    email: 'olena@example.com',
    phoneNumber: '+380671234567',
    subtotalAmount: '8987.00',
    discountAmount: '500.00',
    totalAmount: '8567.00',
    paymentMethod: OrderPaymentMethod.CARD,
    paymentStatus: OrderPaymentStatus.PAID,
    shippingMethod: OrderShippingMethod.NOVA,
    shippingNumber: 'Відділення №34',
    items: [
      {
        productId: 'p1',
        unitPrice: '1999.00',
        quantity: 1,
        product: { name: 'Sony WH-1000XM5', oldPrice: '2499.00' },
      },
      {
        productId: 'p2',
        unitPrice: '1299.00',
        quantity: 2,
        product: { name: 'Deep Sound', oldPrice: null },
      },
    ],
    ...overrides,
  });

  beforeEach(async () => {
    mailService = { sendMail: jest.fn().mockResolvedValue(undefined) };
    orderClientRepository = {
      findProductImageUrls: jest
        .fn()
        .mockResolvedValue(new Map([['p1', 'https://img/p1.jpg']])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderEmailService,
        { provide: MailService, useValue: mailService },
        { provide: OrderClientRepository, useValue: orderClientRepository },
      ],
    }).compile();

    service = module.get<OrderEmailService>(OrderEmailService);
  });

  it('should skip sending when the order has no email', async () => {
    await service.sendOrderCreatedEmail(buildOrder({ email: null }));

    expect(mailService.sendMail).not.toHaveBeenCalled();
  });

  it('should send the order created email with formatted context', async () => {
    await service.sendOrderCreatedEmail(buildOrder());

    expect(orderClientRepository.findProductImageUrls).toHaveBeenCalledWith([
      'p1',
      'p2',
    ]);
    const [{ to, subject, template, context }] =
      mailService.sendMail.mock.calls[0];
    expect(to).toBe('olena@example.com');
    expect(subject).toBe('Замовлення #48211 прийнято');
    expect(template).toBe('order-created');
    expect(context).toMatchObject({
      orderNumber: '48211',
      orderDate: '8 жовтня 2026',
      firstName: 'Олена',
      itemsCount: 3,
      deliveryCost: '80 ₴',
      paymentLabel: 'Оплачено банківською карткою',
      shippingMethod: 'Нова Пошта',
      shippingNumber: 'Відділення №34',
      recipientName: 'Коваль Олена Петрівна',
      phoneNumber: '+380671234567',
      email: 'olena@example.com',
    });
    expect(normalizeSpaces(context.subtotal)).toBe('8 987 ₴');
    expect(normalizeSpaces(context.discount)).toBe('500 ₴');
    expect(normalizeSpaces(context.total)).toBe('8 567 ₴');
    expect(context.items).toHaveLength(2);
    expect(context.items[0]).toMatchObject({
      name: 'Sony WH-1000XM5',
      imageUrl: 'https://img/p1.jpg',
      quantity: 1,
    });
    expect(normalizeSpaces(context.items[0].total)).toBe('1 999 ₴');
    expect(normalizeSpaces(context.items[0].oldTotal)).toBe('2 499 ₴');
    expect(context.items[1]).toMatchObject({
      name: 'Deep Sound',
      imageUrl: null,
      quantity: 2,
      oldTotal: null,
    });
    expect(normalizeSpaces(context.items[1].total)).toBe('2 598 ₴');
  });

  it('should handle optional fields and other payment labels', async () => {
    await service.sendOrderCreatedEmail(
      buildOrder({
        orderNumber: null,
        firstName: null,
        lastName: null,
        middleName: null,
        phoneNumber: null,
        subtotalAmount: '100',
        discountAmount: '0',
        totalAmount: '100',
        paymentMethod: OrderPaymentMethod.COD,
        shippingMethod: OrderShippingMethod.UKR,
        items: [
          { productId: 'p3', unitPrice: '100', quantity: 1, product: null },
        ],
      }),
    );

    const { context } = mailService.sendMail.mock.calls[0][0];
    expect(context).toMatchObject({
      orderNumber: 'a1b2c3d4',
      firstName: null,
      discount: null,
      deliveryCost: null,
      paymentLabel: 'Оплата при отриманні',
      shippingMethod: 'Укрпошта',
      recipientName: null,
      phoneNumber: null,
    });
    expect(context.items[0]).toMatchObject({ name: '', oldTotal: null });
  });

  it('should label unpaid card orders and tolerate missing items', async () => {
    await service.sendOrderCreatedEmail(
      buildOrder({
        paymentStatus: OrderPaymentStatus.UNPAID,
        items: undefined,
      }),
    );

    const { context } = mailService.sendMail.mock.calls[0][0];
    expect(context.paymentLabel).toBe('Оплата банківською карткою');
    expect(context.items).toEqual([]);
    expect(context.itemsCount).toBe(0);
  });
});

function normalizeSpaces(value: string): string {
  return value.replace(/\s/g, ' ');
}
