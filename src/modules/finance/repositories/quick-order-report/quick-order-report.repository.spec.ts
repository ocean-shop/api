import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuickOrder } from '../../../orders/entities/quick-order.entity';
import { ReportPeriod } from '../../models/finance-report.models';
import { QuickOrderReportRepository } from './quick-order-report.repository';

const period: ReportPeriod = {
  from: '2026-11-01',
  to: '2026-11-30',
  toExclusive: '2026-12-01',
  days: 30,
};

const createQueryBuilderMock = () => ({
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  setParameters: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
});

describe('QuickOrderReportRepository', () => {
  let repository: QuickOrderReportRepository;
  let quickOrderRepository: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    quickOrderRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickOrderReportRepository,
        {
          provide: getRepositoryToken(QuickOrder),
          useValue: quickOrderRepository,
        },
      ],
    }).compile();

    repository = module.get<QuickOrderReportRepository>(
      QuickOrderReportRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  const expectPeriodFilter = (
    qb: ReturnType<typeof createQueryBuilderMock>,
  ): void => {
    expect(quickOrderRepository.createQueryBuilder).toHaveBeenCalledWith('qo');
    expect(qb.innerJoin).toHaveBeenCalledWith('qo.product', 'p');
    expect(qb.where).toHaveBeenCalledWith('qo.shop_id = :shopId', {
      shopId: 'shop-id',
    });
    expect(qb.setParameters).toHaveBeenCalledWith({
      from: '2026-11-01',
      toExclusive: '2026-12-01',
      timeZone: 'Europe/Kyiv',
      cancelled: 'cancelled',
    });
  };

  describe('findSummary', () => {
    it('should aggregate counts and estimated values by status', async () => {
      const qb = createQueryBuilderMock();
      const row = { totalCount: '3', estimatedValue: '150.00' };
      qb.getRawOne.mockResolvedValue(row);
      quickOrderRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await repository.findSummary('shop-id', period);

      expect(result).toBe(row);
      expectPeriodFilter(qb);
      expect(qb.select).toHaveBeenCalledWith('COUNT(*)', 'totalCount');
      expect(qb.addSelect).toHaveBeenCalledWith(
        'COALESCE(SUM(p.price) FILTER (WHERE qo.status <> :cancelled), 0)',
        'estimatedValue',
      );
      expect(qb.setParameters).toHaveBeenCalledWith({
        new: 'new',
        processed: 'processed',
      });
    });

    it('should return zeros when the query returns no row', async () => {
      const qb = createQueryBuilderMock();
      qb.getRawOne.mockResolvedValue(undefined);
      quickOrderRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await repository.findSummary('shop-id', period);

      expect(result).toEqual({
        totalCount: '0',
        newCount: '0',
        processedCount: '0',
        cancelledCount: '0',
        estimatedValue: '0',
        estimatedProcessedValue: '0',
        estimatedCancelledValue: '0',
      });
    });
  });

  describe('findTopProducts', () => {
    it('should group not cancelled requests by product', async () => {
      const qb = createQueryBuilderMock();
      const rows = [{ productId: 'p1', requestsCount: '2' }];
      qb.getRawMany.mockResolvedValue(rows);
      quickOrderRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await repository.findTopProducts('shop-id', period, 5);

      expect(result).toBe(rows);
      expectPeriodFilter(qb);
      expect(qb.andWhere).toHaveBeenCalledWith('qo.status <> :cancelled');
      expect(qb.groupBy).toHaveBeenCalledWith('p.id');
      expect(qb.orderBy).toHaveBeenCalledWith('"requestsCount"', 'DESC');
      expect(qb.limit).toHaveBeenCalledWith(5);
    });
  });
});
