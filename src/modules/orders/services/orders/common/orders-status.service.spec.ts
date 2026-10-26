import { NotFoundException } from '@nestjs/common';
import {
  OrderPaymentStatus,
  OrderStatus,
} from '../../../entities/enums/order.enum';
import { OrderQueryRepository } from '../../../repositories/order/common/order-query.repository';
import { OrdersStatusService } from './orders-status.service';

class TestOrdersStatusService extends OrdersStatusService {
  constructor(orderQueryRepository: OrderQueryRepository) {
    super(orderQueryRepository);
  }
}

describe('OrdersStatusService', () => {
  let service: TestOrdersStatusService;
  let orderQueryRepository: jest.Mocked<
    Pick<OrderQueryRepository, 'findById' | 'save'>
  >;

  beforeEach(() => {
    orderQueryRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    service = new TestOrdersStatusService(
      orderQueryRepository as unknown as OrderQueryRepository,
    );
  });

  describe('updatePaymentStatus', () => {
    it('should set the payment status and save the order', async () => {
      const order = {
        id: 'order-id',
        paymentStatus: OrderPaymentStatus.UNPAID,
      } as any;
      const saved = { ...order, paymentStatus: OrderPaymentStatus.PAID };
      orderQueryRepository.findById.mockResolvedValue(order);
      orderQueryRepository.save.mockResolvedValue(saved);

      const result = await service.updatePaymentStatus('order-id', {
        paymentStatus: OrderPaymentStatus.PAID,
      });

      expect(orderQueryRepository.findById).toHaveBeenCalledWith('order-id');
      expect(orderQueryRepository.save).toHaveBeenCalledWith({
        id: 'order-id',
        paymentStatus: OrderPaymentStatus.PAID,
      });
      expect(result).toEqual(saved);
    });

    it('should not touch the order status', async () => {
      const order = {
        id: 'order-id',
        status: OrderStatus.PROCESSING,
        paymentStatus: OrderPaymentStatus.UNPAID,
      } as any;
      orderQueryRepository.findById.mockResolvedValue(order);
      orderQueryRepository.save.mockImplementation(async (value) => value);

      const result = await service.updatePaymentStatus('order-id', {
        paymentStatus: OrderPaymentStatus.PAID,
      });

      expect(result.status).toBe(OrderStatus.PROCESSING);
    });

    it('should not save when the order is not found', async () => {
      orderQueryRepository.findById.mockRejectedValue(
        new NotFoundException('Замовлення не знайдено'),
      );

      await expect(
        service.updatePaymentStatus('missing', {
          paymentStatus: OrderPaymentStatus.PAID,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(orderQueryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should set the order status and save the order', async () => {
      const order = { id: 'order-id', status: OrderStatus.PENDING } as any;
      const saved = { ...order, status: OrderStatus.PROCESSING };
      orderQueryRepository.findById.mockResolvedValue(order);
      orderQueryRepository.save.mockResolvedValue(saved);

      const result = await service.updateStatus('order-id', {
        status: OrderStatus.PROCESSING,
      });

      expect(orderQueryRepository.findById).toHaveBeenCalledWith('order-id');
      expect(orderQueryRepository.save).toHaveBeenCalledWith({
        id: 'order-id',
        status: OrderStatus.PROCESSING,
      });
      expect(result).toEqual(saved);
    });

    it('should not touch the payment status', async () => {
      const order = {
        id: 'order-id',
        status: OrderStatus.PENDING,
        paymentStatus: OrderPaymentStatus.PAID,
      } as any;
      orderQueryRepository.findById.mockResolvedValue(order);
      orderQueryRepository.save.mockImplementation(async (value) => value);

      const result = await service.updateStatus('order-id', {
        status: OrderStatus.PROCESSING,
      });

      expect(result.paymentStatus).toBe(OrderPaymentStatus.PAID);
    });

    it('should not save when the order is not found', async () => {
      orderQueryRepository.findById.mockRejectedValue(
        new NotFoundException('Замовлення не знайдено'),
      );

      await expect(
        service.updateStatus('missing', { status: OrderStatus.PROCESSING }),
      ).rejects.toThrow(NotFoundException);
      expect(orderQueryRepository.save).not.toHaveBeenCalled();
    });
  });
});
