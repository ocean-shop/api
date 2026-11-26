import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../../catalog/entities/product.entity';
import { OrderProduct } from '../../../orders/entities/order-product.entity';
import { ReportPeriod } from '../../models/finance-report.models';
import { ProductReportRepository } from './product-report.repository';

const period: ReportPeriod = {
  from: '2026-11-01',
  to: '2026-11-30',
  toExclusive: '2026-12-01',
  days: 30,
};

const createQueryBuilderMock = () => ({
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  setParameters: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
});

describe('ProductReportRepository', () => {
  let repository: ProductReportRepository;
  let orderProductRepository: { createQueryBuilder: jest.Mock };
  let productRepository: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    orderProductRepository = { createQueryBuilder: jest.fn() };
    productRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReportRepository,
        {
          provide: getRepositoryToken(OrderProduct),
          useValue: orderProductRepository,
        },
        { provide: getRepositoryToken(Product), useValue: productRepository },
      ],
    }).compile();

    repository = module.get<ProductReportRepository>(ProductReportRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findProductSales', () => {
    it('should aggregate order lines of not cancelled orders in the period', async () => {
      const qb = createQueryBuilderMock();
      const rows = [{ productId: 'p1', revenue: '100.00' }];
      qb.getRawMany.mockResolvedValue(rows);
      orderProductRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await repository.findProductSales('shop-id', period);

      expect(result).toBe(rows);
      expect(orderProductRepository.createQueryBuilder).toHaveBeenCalledWith(
        'op',
      );
      expect(qb.innerJoin).toHaveBeenCalledWith('op.order', 'o');
      expect(qb.innerJoin).toHaveBeenCalledWith('op.product', 'p');
      expect(qb.where).toHaveBeenCalledWith('o.shop_id = :shopId', {
        shopId: 'shop-id',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('o.status <> :cancelled', {
        cancelled: 'cancelled',
      });
      expect(qb.setParameters).toHaveBeenCalledWith({
        from: '2026-11-01',
        toExclusive: '2026-12-01',
        timeZone: 'Europe/Kyiv',
      });
      expect(qb.groupBy).toHaveBeenCalledWith('p.id');
    });
  });

  describe('findDeadStock', () => {
    const cutoff = new Date('2026-09-26T00:00:00Z');

    it('should return items and the total from the window count', async () => {
      const qb = createQueryBuilderMock();
      qb.getRawMany.mockResolvedValue([
        {
          productId: 'p1',
          name: 'Old',
          slug: 'old',
          price: '10.00',
          lastSoldAt: null,
          total: '7',
        },
      ]);
      productRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await repository.findDeadStock('shop-id', cutoff, 5);

      expect(result).toEqual({
        items: [
          {
            productId: 'p1',
            name: 'Old',
            slug: 'old',
            price: '10.00',
            lastSoldAt: null,
          },
        ],
        total: 7,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('p.status = :active', {
        active: 'active',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('p.created_at < :cutoff', {
        cutoff,
      });
      expect(qb.limit).toHaveBeenCalledWith(5);
    });

    it('should return zero total without dead stock', async () => {
      const qb = createQueryBuilderMock();
      qb.getRawMany.mockResolvedValue([]);
      productRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await repository.findDeadStock('shop-id', cutoff, 5);

      expect(result).toEqual({ items: [], total: 0 });
    });
  });
});
