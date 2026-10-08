import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderShippingMethod,
  OrderStatus,
} from '../../../entities/enums/order.enum';
import { OrderClientRepository } from '../../../repositories/order/client/order-client.repository';
import { OrderEmailService } from '../../email/order-email.service';
import { OrdersClientService } from './orders-client.service';

describe('OrdersClientService', () => {
  let service: OrdersClientService;
  let orderClientRepository: OrderClientRepository;
  let orderEmailService: { sendOrderCreatedEmail: jest.Mock };

  beforeEach(async () => {
    orderEmailService = {
      sendOrderCreatedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const orderClientRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      saveWithNextOrderNumber: jest.fn(),
      replaceItems: jest.fn(),
      validateProductsForShop: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersClientService,
        { provide: OrderClientRepository, useValue: orderClientRepositoryMock },
        { provide: OrderEmailService, useValue: orderEmailService },
      ],
    }).compile();

    service = module.get<OrdersClientService>(OrdersClientService);
    orderClientRepository = module.get<OrderClientRepository>(
      OrderClientRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create order with default statuses when omitted', async () => {
    const dto = {
      shopId: 'shop-id',
      userId: 'user-id',
      shippingNumber: 'TTN-1001',
      subtotalAmount: 100,
      discountAmount: 5,
      totalAmount: 95,
      paymentMethod: OrderPaymentMethod.CARD,
      shippingMethod: OrderShippingMethod.NOVA,
      items: [{ productId: 'product-id', unitPrice: 95, quantity: 1 }],
    };

    const created = { id: 'order-id', ...dto } as any;
    const saved = { id: 'order-id' } as any;
    const fullOrder = { id: 'order-id', items: [] } as any;

    jest
      .mocked(orderClientRepository.validateProductsForShop)
      .mockResolvedValue(undefined);
    jest.mocked(orderClientRepository.create).mockReturnValue(created);
    jest
      .mocked(orderClientRepository.saveWithNextOrderNumber)
      .mockResolvedValue(saved);
    jest.mocked(orderClientRepository.replaceItems).mockResolvedValue([]);
    jest.mocked(orderClientRepository.findById).mockResolvedValue(fullOrder);

    const result = await service.createOrder(dto);

    expect(orderClientRepository.validateProductsForShop).toHaveBeenCalledWith(
      'shop-id',
      ['product-id'],
    );
    expect(orderClientRepository.create).toHaveBeenCalledWith({
      shopId: 'shop-id',
      userId: 'user-id',
      shippingNumber: 'TTN-1001',
      firstName: null,
      lastName: null,
      middleName: null,
      email: null,
      phoneNumber: null,
      subtotalAmount: '100',
      discountAmount: '5',
      totalAmount: '95',
      paymentMethod: OrderPaymentMethod.CARD,
      paymentStatus: OrderPaymentStatus.UNPAID,
      shippingMethod: OrderShippingMethod.NOVA,
      status: OrderStatus.PENDING,
    });
    expect(orderClientRepository.saveWithNextOrderNumber).toHaveBeenCalledWith(
      created,
    );
    expect(orderClientRepository.replaceItems).toHaveBeenCalledWith(
      'order-id',
      [{ productId: 'product-id', unitPrice: 95, quantity: 1 }],
    );
    expect(orderClientRepository.findById).toHaveBeenCalledWith('order-id');
    expect(orderEmailService.sendOrderCreatedEmail).toHaveBeenCalledWith(
      fullOrder,
    );
    expect(result).toEqual(fullOrder);
  });

  it('should still return the order when the email fails to send', async () => {
    const fullOrder = { id: 'order-id', items: [] } as any;
    jest
      .mocked(orderClientRepository.validateProductsForShop)
      .mockResolvedValue(undefined);
    jest.mocked(orderClientRepository.create).mockReturnValue({} as any);
    jest
      .mocked(orderClientRepository.saveWithNextOrderNumber)
      .mockResolvedValue({ id: 'order-id' } as any);
    jest.mocked(orderClientRepository.replaceItems).mockResolvedValue([]);
    jest.mocked(orderClientRepository.findById).mockResolvedValue(fullOrder);
    orderEmailService.sendOrderCreatedEmail.mockRejectedValue(
      new Error('Resend down'),
    );

    const result = await service.createOrder({
      shopId: 'shop-id',
      shippingNumber: 'TTN-1001',
      subtotalAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      paymentMethod: OrderPaymentMethod.CARD,
      shippingMethod: OrderShippingMethod.NOVA,
      items: [],
    });
    await new Promise(process.nextTick);

    expect(result).toEqual(fullOrder);
  });

  it('should update payment status', async () => {
    const order = {
      id: 'order-id',
      paymentStatus: OrderPaymentStatus.UNPAID,
    } as any;
    const saved = { ...order, paymentStatus: OrderPaymentStatus.PAID };
    jest.mocked(orderClientRepository.findById).mockResolvedValue(order);
    jest.mocked(orderClientRepository.save).mockResolvedValue(saved);

    const result = await service.updatePaymentStatus('order-id', {
      paymentStatus: OrderPaymentStatus.PAID,
    });

    expect(orderClientRepository.save).toHaveBeenCalledWith({
      id: 'order-id',
      paymentStatus: OrderPaymentStatus.PAID,
    });
    expect(result).toEqual(saved);
  });

  it('should update order status', async () => {
    const order = { id: 'order-id', status: OrderStatus.PENDING } as any;
    const saved = { ...order, status: OrderStatus.PROCESSING };
    jest.mocked(orderClientRepository.findById).mockResolvedValue(order);
    jest.mocked(orderClientRepository.save).mockResolvedValue(saved);

    const result = await service.updateStatus('order-id', {
      status: OrderStatus.PROCESSING,
    });

    expect(orderClientRepository.save).toHaveBeenCalledWith({
      id: 'order-id',
      status: OrderStatus.PROCESSING,
    });
    expect(result).toEqual(saved);
  });
});
