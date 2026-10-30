import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import {
  OrderPaymentMethod,
  OrderShippingMethod,
} from '../../../entities/enums/order.enum';
import { OrdersClientService } from '../../../services/orders/client/orders-client.service';
import { OrdersClientController } from './orders-client.controller';

describe('OrdersClientController', () => {
  let controller: OrdersClientController;
  let ordersClientService: OrdersClientService;

  beforeEach(async () => {
    const ordersClientServiceMock = {
      createOrder: jest.fn(),
      listOrdersByUser: jest.fn(),
      getOrderById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersClientController],
      providers: [
        { provide: OrdersClientService, useValue: ordersClientServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrdersClientController>(OrdersClientController);
    ordersClientService = module.get<OrdersClientService>(OrdersClientService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create order', async () => {
    const dto = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      userId: '7208ff32-031d-4869-91e8-8a0bdd080f3e',
      shippingNumber: 'TTN-1001',
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
    jest
      .mocked(ordersClientService.createOrder)
      .mockResolvedValue(expected as any);

    const result = await controller.createOrder(dto);

    expect(ordersClientService.createOrder).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should list orders by user id', async () => {
    const userId = '7208ff32-031d-4869-91e8-8a0bdd080f3e';
    const query = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      page: 1,
      limit: 20,
    };
    const request = { user: { sub: userId, role: 'user' } } as any;
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(ordersClientService.listOrdersByUser)
      .mockResolvedValue(expected);

    const result = await controller.listOrdersByUser(userId, query, request);

    expect(ordersClientService.listOrdersByUser).toHaveBeenCalledWith(
      userId,
      query,
      request.user,
    );
    expect(result).toEqual(expected);
  });

  it('should get order by id', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const request = { user: { sub: 'user-id', role: 'user' } } as any;
    const expected = { id, userId: 'user-id' };
    jest
      .mocked(ordersClientService.getOrderById)
      .mockResolvedValue(expected as any);

    const result = await controller.getOrderById(id, request);

    expect(ordersClientService.getOrderById).toHaveBeenCalledWith(
      id,
      request.user,
    );
    expect(result).toEqual(expected);
  });
});
