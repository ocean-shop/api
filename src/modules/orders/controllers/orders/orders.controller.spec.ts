import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import {
  OrderPaymentMethod,
  OrderShippingMethod,
} from '../../entities/enums/order.enum';
import { OrdersService } from '../../services/orders/orders.service';
import { OrdersController } from './orders.controller';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: OrdersService;

  beforeEach(async () => {
    const ordersServiceMock = {
      listOrders: jest.fn(),
      listOrdersByUser: jest.fn(),
      getOrderById: jest.fn(),
      createOrder: jest.fn(),
      removeOrder: jest.fn(),
      updatePaymentStatus: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list orders by shop id', async () => {
    const query = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      page: 1,
      limit: 20,
    };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(ordersService.listOrders).mockResolvedValue(expected);

    const result = await controller.listOrders(query);

    expect(ordersService.listOrders).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should list orders by shop id and user id', async () => {
    const query = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      userId: '7208ff32-031d-4869-91e8-8a0bdd080f3e',
      page: 1,
      limit: 20,
    };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(ordersService.listOrdersByUser).mockResolvedValue(expected);

    const result = await controller.listOrdersByUser(query);

    expect(ordersService.listOrdersByUser).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should get order by id', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { id, orderNumber: 'ORD-1001' };
    jest.mocked(ordersService.getOrderById).mockResolvedValue(expected as any);

    const result = await controller.getOrderById(id);

    expect(ordersService.getOrderById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should create order', async () => {
    const dto = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      userId: '7208ff32-031d-4869-91e8-8a0bdd080f3e',
      shippingNumber: 'TTN-1001',
      orderNumber: 'ORD-1001',
      subtotalAmount: 100,
      discountAmount: 10,
      totalAmount: 90,
      paymentMethod: OrderPaymentMethod.CARD,
      shippingMethod: OrderShippingMethod.NOVA,
      items: [
        {
          productId: 'a45805b4-d5d7-47d4-9f44-d73e786ef618',
          unitPrice: 45,
          quantity: 2,
        },
      ],
    };
    const expected = { id: '1', ...dto };
    jest.mocked(ordersService.createOrder).mockResolvedValue(expected as any);

    const result = await controller.createOrder(dto);

    expect(ordersService.createOrder).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should remove order', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { message: 'Замовлення успішно видалено' };
    jest.mocked(ordersService.removeOrder).mockResolvedValue(expected);

    const result = await controller.removeOrder(id);

    expect(ordersService.removeOrder).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should update payment status', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto = { paymentStatus: 'paid' as const };
    const expected = { id, paymentStatus: 'paid' };
    jest
      .mocked(ordersService.updatePaymentStatus)
      .mockResolvedValue(expected as any);

    const result = await controller.updatePaymentStatus(id, dto);

    expect(ordersService.updatePaymentStatus).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should update order status', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto = { status: 'processing' as const };
    const expected = { id, status: 'processing' };
    jest.mocked(ordersService.updateStatus).mockResolvedValue(expected as any);

    const result = await controller.updateStatus(id, dto);

    expect(ordersService.updateStatus).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });
});
