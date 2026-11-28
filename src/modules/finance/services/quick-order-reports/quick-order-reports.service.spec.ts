import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QuickOrderSummaryRow } from '../../models/finance-report.models';
import { QuickOrderReportRepository } from '../../repositories/quick-order-report/quick-order-report.repository';
import { QuickOrderReportsService } from './quick-order-reports.service';

const summaryRow = (
  overrides: Partial<QuickOrderSummaryRow> = {},
): QuickOrderSummaryRow => ({
  totalCount: '0',
  newCount: '0',
  processedCount: '0',
  cancelledCount: '0',
  estimatedValue: '0',
  estimatedProcessedValue: '0',
  estimatedCancelledValue: '0',
  ...overrides,
});

describe('QuickOrderReportsService', () => {
  let service: QuickOrderReportsService;
  let repository: jest.Mocked<QuickOrderReportRepository>;

  beforeEach(async () => {
    const repositoryMock = {
      findSummary: jest.fn(),
      findTopProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickOrderReportsService,
        { provide: QuickOrderReportRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<QuickOrderReportsService>(QuickOrderReportsService);
    repository = module.get(QuickOrderReportRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should build the summary, changes and top products', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-26T10:00:00Z') });
    repository.findSummary
      .mockResolvedValueOnce(
        summaryRow({
          totalCount: '4',
          newCount: '1',
          processedCount: '2',
          cancelledCount: '1',
          estimatedValue: '300.00',
          estimatedProcessedValue: '200.00',
          estimatedCancelledValue: '99.90',
        }),
      )
      .mockResolvedValueOnce(
        summaryRow({ totalCount: '2', estimatedValue: '150.00' }),
      );
    repository.findTopProducts.mockResolvedValue([
      {
        productId: 'p1',
        name: 'Lamp',
        slug: 'lamp',
        currentPrice: '100.00',
        requestsCount: '3',
        estimatedValue: '300.00',
      },
    ]);

    const result = await service.getQuickOrderReport({ shopId: 'shop-id' });

    const current = {
      from: '2026-10-28',
      to: '2026-11-26',
      toExclusive: '2026-11-27',
      days: 30,
    };
    expect(repository.findSummary).toHaveBeenCalledWith('shop-id', current);
    expect(repository.findTopProducts).toHaveBeenCalledWith(
      'shop-id',
      current,
      10,
    );
    expect(result.period).toEqual(current);
    expect(result.valueSource).toBe('current_product_price');
    expect(result.summary).toEqual({
      totalCount: 4,
      newCount: 1,
      processedCount: 2,
      cancelledCount: 1,
      estimatedValue: 300,
      estimatedProcessedValue: 200,
      estimatedCancelledValue: 99.9,
      processedRate: 0.5,
      cancellationRate: 0.25,
    });
    expect(result.previousSummary.totalCount).toBe(2);
    expect(result.changes.totalCount).toBe(100);
    expect(result.changes.estimatedValue).toBe(100);
    expect(result.changes.processedCount).toBeNull();
    expect(result.topProducts).toEqual([
      {
        productId: 'p1',
        name: 'Lamp',
        slug: 'lamp',
        currentPrice: 100,
        requestsCount: 3,
        estimatedValue: 300,
      },
    ]);
  });

  it('should return zero rates without quick orders', async () => {
    repository.findSummary.mockResolvedValue(summaryRow());
    repository.findTopProducts.mockResolvedValue([]);

    const result = await service.getQuickOrderReport({ shopId: 'shop-id' });

    expect(result.summary.processedRate).toBe(0);
    expect(result.summary.cancellationRate).toBe(0);
    expect(result.topProducts).toEqual([]);
  });

  it('should reject an invalid period without querying', async () => {
    await expect(
      service.getQuickOrderReport({
        shopId: 'shop-id',
        from: '2024-01-01',
        to: '2026-01-01',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.findSummary).not.toHaveBeenCalled();
  });
});
