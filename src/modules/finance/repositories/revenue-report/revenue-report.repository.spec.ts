import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../../../orders/entities/order.entity';
import { ReportPeriod } from '../../models/finance-report.models';
import { RevenueReportRepository } from './revenue-report.repository';

const period: ReportPeriod = {
  from: '2026-11-01',
  to: '2026-11-30',
  toExclusive: '2026-12-01',
  days: 30,
};

const createQueryBuilderMock = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  setParameters: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
});

describe('RevenueReportRepository', () => {
  let repository: RevenueReportRepository;
  let orderRepository: { createQueryBuilder: jest.Mock };
  let qb: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(async () => {
    qb = createQueryBuilderMock();
    orderRepository = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueReportRepository,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
      ],
    }).compile();

    repository = module.get<RevenueReportRepository>(RevenueReportRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should filter every query by shop and shop-local period bounds', async () => {
    qb.getRawOne.mockResolvedValue(undefined);

    await repository.findSummary('shop-id', period);

    expect(orderRepository.createQueryBuilder).toHaveBeenCalledWith('o');
    expect(qb.where).toHaveBeenCalledWith('o.shop_id = :shopId', {
      shopId: 'shop-id',
    });
    expect(qb.setParameters).toHaveBeenCalledWith({
      from: '2026-11-01',
      toExclusive: '2026-12-01',
      timeZone: 'Europe/Kyiv',
      cancelled: 'cancelled',
    });
  });

  describe('findSummary', () => {
    it('should return the aggregated row', async () => {
      const row = { ordersCount: '3', netSales: '300.00' };
      qb.getRawOne.mockResolvedValue(row);

      const result = await repository.findSummary('shop-id', period);

      expect(result).toBe(row);
      expect(qb.setParameters).toHaveBeenCalledWith({
        paid: 'paid',
        unpaid: 'unpaid',
        shipped: 'shipped',
        cod: 'cod',
      });
    });

    it('should return zeros when there is no row', async () => {
      qb.getRawOne.mockResolvedValue(undefined);

      const result = await repository.findSummary('shop-id', period);

      expect(result.netSales).toBe('0');
      expect(result.ordersCount).toBe('0');
    });
  });

  describe('findBreakdown', () => {
    it('should group by a whitelisted column', async () => {
      const rows = [{ key: 'cod', ordersCount: '2', netSales: '100' }];
      qb.getRawMany.mockResolvedValue(rows);

      const result = await repository.findBreakdown(
        'shop-id',
        period,
        'paymentMethod',
      );

      expect(result).toBe(rows);
      expect(qb.select).toHaveBeenCalledWith('o.payment_method::text', 'key');
      expect(qb.groupBy).toHaveBeenCalledWith('o.payment_method');
      expect(qb.andWhere).toHaveBeenCalledWith('o.status <> :cancelled');
    });

    it('should support the shipping method breakdown', async () => {
      qb.getRawMany.mockResolvedValue([]);

      await repository.findBreakdown('shop-id', period, 'shippingMethod');

      expect(qb.groupBy).toHaveBeenCalledWith('o.shipping_method');
    });
  });

  describe('findTimeline', () => {
    it('should group by truncated shop-local date', async () => {
      const rows = [{ period: '2026-11-02', ordersCount: '1' }];
      qb.getRawMany.mockResolvedValue(rows);

      const result = await repository.findTimeline('shop-id', period, 'week');

      expect(result).toBe(rows);
      expect(qb.setParameters).toHaveBeenCalledWith({
        granularity: 'week',
        paid: 'paid',
      });
      expect(qb.groupBy).toHaveBeenCalledWith('period');
      expect(qb.orderBy).toHaveBeenCalledWith('period', 'ASC');
    });
  });
});
