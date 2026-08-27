import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../../catalog/entities/product.entity';
import { Order } from '../../../orders/entities/order.entity';
import { User } from '../../../user/entities/user.entity';
import { MonthlyStatisticRow } from '../../models/statistic.models';
import { StatisticRepository } from './statistic.repository';

const createQueryBuilderMock = (rows: MonthlyStatisticRow[]) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows),
});

describe('StatisticRepository', () => {
  let repository: StatisticRepository;
  let orderRepository: any;
  let productRepository: any;
  let userRepository: any;

  beforeEach(async () => {
    orderRepository = { createQueryBuilder: jest.fn() };
    productRepository = { createQueryBuilder: jest.fn() };
    userRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticRepository,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getRepositoryToken(Product), useValue: productRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    repository = module.get<StatisticRepository>(StatisticRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should get monthly orders for shop', async () => {
    const rows: MonthlyStatisticRow[] = [
      { year: '2026', month: '1', count: '7' },
    ];
    const qb = createQueryBuilderMock(rows);
    orderRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await repository.getMonthlyOrders('shop-id');

    expect(orderRepository.createQueryBuilder).toHaveBeenCalledWith('o');
    expect(qb.where).toHaveBeenCalledWith('o.shop_id = :shopId', {
      shopId: 'shop-id',
    });
    expect(qb.groupBy).toHaveBeenCalledWith('year');
    expect(qb.addGroupBy).toHaveBeenCalledWith('month');
    expect(qb.orderBy).toHaveBeenCalledWith('year', 'ASC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('month', 'ASC');
    expect(qb.getRawMany).toHaveBeenCalled();
    expect(result).toEqual(rows);
  });

  it('should get monthly products for shop', async () => {
    const rows: MonthlyStatisticRow[] = [
      { year: '2026', month: '2', count: '5' },
    ];
    const qb = createQueryBuilderMock(rows);
    productRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await repository.getMonthlyProducts('shop-id');

    expect(productRepository.createQueryBuilder).toHaveBeenCalledWith('p');
    expect(qb.where).toHaveBeenCalledWith('p.shop_id = :shopId', {
      shopId: 'shop-id',
    });
    expect(qb.getRawMany).toHaveBeenCalled();
    expect(result).toEqual(rows);
  });

  it('should get monthly users for shop', async () => {
    const rows: MonthlyStatisticRow[] = [
      { year: '2026', month: '3', count: '4' },
    ];
    const qb = createQueryBuilderMock(rows);
    userRepository.createQueryBuilder.mockReturnValue(qb);

    const result = await repository.getMonthlyUsers('shop-id');

    expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('u');
    expect(qb.innerJoin).toHaveBeenCalledWith(Order, 'o', 'o.user_id = u.id');
    expect(qb.where).toHaveBeenCalledWith('o.shop_id = :shopId', {
      shopId: 'shop-id',
    });
    expect(qb.getRawMany).toHaveBeenCalled();
    expect(result).toEqual(rows);
  });
});
