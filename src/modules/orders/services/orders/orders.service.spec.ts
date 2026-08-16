import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderShippingMethod,
  OrderStatus,
} from '../../entities/enums/order.enum';
import { OrderRepository } from '../../repositories/order/order.repository';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: OrderRepository;

  beforeEach(async () => {
    const orderRepositoryMock = {
      findAllByShopId: jest.fn(),
      findAllByShopIdAndUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      replaceItems: jest.fn(),
      validateProductsForShop: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrderRepository, useValue: orderRepositoryMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<OrderRepository>(OrderRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list orders with pagination by shop id', async () => {
    jest.mocked(orderRepository.findAllByShopId).mockResolvedValue({
      items: [{ id: 'order-1' }] as any,
      total: 1,
    });

    const result = await service.listOrders({
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      page: 1,
      limit: 20,
      orderNumber: 'ORD-1001',
      sortOrder: 'asc',
    });

    expect(orderRepository.findAllByShopId).toHaveBeenCalledWith(
      '98f21967-fce6-4ceb-af61-304913f593a7',
      0,
      20,
      'ORD-1001',
      'asc',
    );
    expect(result.totalPages).toBe(1);
  });

  it('should list orders with pagination by shop id and user id', async () => {
    jest.mocked(orderRepository.findAllByShopIdAndUserId).mockResolvedValue({
      items: [{ id: 'order-1' }] as any,
      total: 1,
    });

    const result = await service.listOrdersByUser({
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      userId: '7208ff32-031d-4869-91e8-8a0bdd080f3e',
      page: 2,
      limit: 10,
    });

    expect(orderRepository.findAllByShopIdAndUserId).toHaveBeenCalledWith(
      '98f21967-fce6-4ceb-af61-304913f593a7',
      '7208ff32-031d-4869-91e8-8a0bdd080f3e',
      10,
      10,
    );
    expect(result.totalPages).toBe(1);
  });

  it('should get one order by id', async () => {
    const order = { id: 'order-1' } as any;
    jest.mocked(orderRepository.findById).mockResolvedValue(order);

    const result = await service.getOrderById('order-1');

    expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
    expect(result).toEqual(order);
  });

  it('should create order with default statuses when omitted', async () => {
    const dto = {
      shopId: 'shop-id',
      userId: 'user-id',
      shippingNumber: 'TTN-1001',
      orderNumber: 'ORD-1001',
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
      .mocked(orderRepository.validateProductsForShop)
      .mockResolvedValue(undefined);
    jest.mocked(orderRepository.create).mockReturnValue(created);
    jest.mocked(orderRepository.save).mockResolvedValue(saved);
    jest.mocked(orderRepository.replaceItems).mockResolvedValue([]);
    jest.mocked(orderRepository.findById).mockResolvedValue(fullOrder);

    const result = await service.createOrder(dto);

    expect(orderRepository.validateProductsForShop).toHaveBeenCalledWith(
      'shop-id',
      ['product-id'],
    );
    expect(orderRepository.create).toHaveBeenCalledWith({
      shopId: 'shop-id',
      userId: 'user-id',
      shippingNumber: 'TTN-1001',
      orderNumber: 'ORD-1001',
      subtotalAmount: '100',
      discountAmount: '5',
      totalAmount: '95',
      paymentMethod: OrderPaymentMethod.CARD,
      paymentStatus: OrderPaymentStatus.UNPAID,
      shippingMethod: OrderShippingMethod.NOVA,
      status: OrderStatus.PENDING,
    });
    expect(orderRepository.save).toHaveBeenCalledWith(created);
    expect(orderRepository.replaceItems).toHaveBeenCalledWith('order-id', [
      { productId: 'product-id', unitPrice: 95, quantity: 1 },
    ]);
    expect(orderRepository.findById).toHaveBeenCalledWith('order-id');
    expect(result).toEqual(fullOrder);
  });

  it('should remove order', async () => {
    const order = { id: 'order-id' } as any;
    jest.mocked(orderRepository.findById).mockResolvedValue(order);
    jest.mocked(orderRepository.remove).mockResolvedValue(order);

    const result = await service.removeOrder('order-id');

    expect(orderRepository.findById).toHaveBeenCalledWith('order-id');
    expect(orderRepository.remove).toHaveBeenCalledWith(order);
    expect(result).toEqual({ message: 'Order removed successfully' });
  });

  it('should update payment status', async () => {
    const order = {
      id: 'order-id',
      paymentStatus: OrderPaymentStatus.UNPAID,
    } as any;
    const saved = { ...order, paymentStatus: OrderPaymentStatus.PAID };
    jest.mocked(orderRepository.findById).mockResolvedValue(order);
    jest.mocked(orderRepository.save).mockResolvedValue(saved);

    const result = await service.updatePaymentStatus('order-id', {
      paymentStatus: OrderPaymentStatus.PAID,
    });

    expect(orderRepository.save).toHaveBeenCalledWith({
      id: 'order-id',
      paymentStatus: OrderPaymentStatus.PAID,
    });
    expect(result).toEqual(saved);
  });

  it('should update order status', async () => {
    const order = { id: 'order-id', status: OrderStatus.PENDING } as any;
    const saved = { ...order, status: OrderStatus.PROCESSING };
    jest.mocked(orderRepository.findById).mockResolvedValue(order);
    jest.mocked(orderRepository.save).mockResolvedValue(saved);

    const result = await service.updateStatus('order-id', {
      status: OrderStatus.PROCESSING,
    });

    expect(orderRepository.save).toHaveBeenCalledWith({
      id: 'order-id',
      status: OrderStatus.PROCESSING,
    });
    expect(result).toEqual(saved);
  });
});
