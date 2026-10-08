import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles.guard';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderShippingMethod,
  OrderStatus,
} from '../../../entities/enums/order.enum';
import { OrdersClientService } from '../../../services/orders/client/orders-client.service';
import { OrdersClientController } from './orders-client.controller';

describe('OrdersClientController', () => {
  let controller: OrdersClientController;
  let ordersClientService: OrdersClientService;

  beforeEach(async () => {
    const ordersClientServiceMock = {
      createOrder: jest.fn(),
      updatePaymentStatus: jest.fn(),
      updateStatus: jest.fn(),
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

  it('should update payment status', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto = { paymentStatus: OrderPaymentStatus.PAID };
    const expected = { id, paymentStatus: 'paid' };
    jest
      .mocked(ordersClientService.updatePaymentStatus)
      .mockResolvedValue(expected as any);

    const result = await controller.updatePaymentStatus(id, dto);

    expect(ordersClientService.updatePaymentStatus).toHaveBeenCalledWith(
      id,
      dto,
    );
    expect(result).toEqual(expected);
  });

  it('should update order status', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto = { status: OrderStatus.PROCESSING };
    const expected = { id, status: 'processing' };
    jest
      .mocked(ordersClientService.updateStatus)
      .mockResolvedValue(expected as any);

    const result = await controller.updateStatus(id, dto);

    expect(ordersClientService.updateStatus).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });
});
