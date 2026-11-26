import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../../../orders/entities/order.entity';
import { ReportPeriod } from '../../models/finance-report.models';
import { CustomerReportRepository } from './customer-report.repository';

const period: ReportPeriod = {
  from: '2026-11-01',
  to: '2026-11-30',
  toExclusive: '2026-12-01',
  days: 30,
};

const baseParams = [
  'shop-id',
  'cancelled',
  '2026-11-01',
  '2026-12-01',
  'Europe/Kyiv',
];

describe('CustomerReportRepository', () => {
  let repository: CustomerReportRepository;
  let orderRepository: { query: jest.Mock };

  beforeEach(async () => {
    orderRepository = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerReportRepository,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
      ],
    }).compile();

    repository = module.get<CustomerReportRepository>(CustomerReportRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findSummary', () => {
    it('should run the summary query with positional params', async () => {
      const row = { totalCustomers: '5' };
      orderRepository.query.mockResolvedValue([row]);

      const result = await repository.findSummary('shop-id', period);

      expect(result).toBe(row);
      expect(orderRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('"totalCustomers"'),
        baseParams,
      );
    });

    it('should return undefined when the query returns no rows', async () => {
      orderRepository.query.mockResolvedValue([]);

      const result = await repository.findSummary('shop-id', period);

      expect(result).toBeUndefined();
    });
  });

  describe('findSegments', () => {
    it('should pass the frequency cap and recency bounds', async () => {
      const rows = [{ frequency: '1', recencyBucket: '0' }];
      orderRepository.query.mockResolvedValue(rows);

      const result = await repository.findSegments('shop-id', period);

      expect(result).toBe(rows);
      expect(orderRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('width_bucket'),
        [...baseParams, 3, [31, 61, 121, 366]],
      );
    });
  });
});
