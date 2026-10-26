import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../../../entities/order.entity';
import { OrderRepository } from './order.repository';

describe('OrderRepository', () => {
  let repository: OrderRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      findAndCount: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRepository,
        {
          provide: getRepositoryToken(Order),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<OrderRepository>(OrderRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find all orders by shop id', async () => {
    const items = [{ id: 'order-1' }] as Order[];
    typeOrmRepository.findAndCount.mockResolvedValue([items, 1]);

    const result = await repository.findAllByShopId(
      'shop-id',
      0,
      20,
      'ORD-1001',
      'asc',
    );

    expect(typeOrmRepository.findAndCount).toHaveBeenCalledWith({
      where: { shopId: 'shop-id', orderNumber: expect.anything() },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
      order: { createdAt: 'ASC' },
      skip: 0,
      take: 20,
    });
    expect(result).toEqual({ items, total: 1 });
  });

  it('should find all orders by shop id and user id', async () => {
    const items = [{ id: 'order-1' }] as Order[];
    typeOrmRepository.findAndCount.mockResolvedValue([items, 1]);

    const result = await repository.findAllByShopIdAndUserId(
      'shop-id',
      'user-id',
      10,
      5,
    );

    expect(typeOrmRepository.findAndCount).toHaveBeenCalledWith({
      where: { shopId: 'shop-id', userId: 'user-id' },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
      order: { createdAt: 'DESC' },
      skip: 10,
      take: 5,
    });
    expect(result).toEqual({ items, total: 1 });
  });

  it('should remove order entity', async () => {
    const order = { id: 'order-id' } as Order;
    typeOrmRepository.remove.mockResolvedValue(order);

    const result = await repository.remove(order);

    expect(typeOrmRepository.remove).toHaveBeenCalledWith(order);
    expect(result).toEqual(order);
  });
});
