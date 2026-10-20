import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { Order } from '../../../orders/entities/order.entity';
import { ACTIVE_ORDER_STATUSES } from '../../constants/dashboard.constants';
import { DashboardRepository } from './dashboard.repository';

describe('DashboardRepository', () => {
  let repository: DashboardRepository;
  let orderRepository: any;

  beforeEach(async () => {
    orderRepository = { count: jest.fn(), findAndCount: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardRepository,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
      ],
    }).compile();

    repository = module.get<DashboardRepository>(DashboardRepository);
  });

  it('should count the orders of a user in a shop', async () => {
    orderRepository.count.mockResolvedValue(7);

    await expect(repository.countOrders('shop-1', 'user-1')).resolves.toBe(7);
    expect(orderRepository.count).toHaveBeenCalledWith({
      where: { shopId: 'shop-1', userId: 'user-1' },
    });
  });

  it('should find the latest active orders with their products', async () => {
    const orders = [{ id: 'order-1' }] as Order[];
    orderRepository.findAndCount.mockResolvedValue([orders, 5]);

    const result = await repository.findLastActiveOrders('shop-1', 'user-1', 3);

    expect(orderRepository.findAndCount).toHaveBeenCalledWith({
      where: {
        shopId: 'shop-1',
        userId: 'user-1',
        status: In(ACTIVE_ORDER_STATUSES),
      },
      relations: { items: { product: true } },
      order: { createdAt: 'DESC' },
      take: 3,
    });
    expect(result).toEqual({ items: orders, total: 5 });
  });
});
