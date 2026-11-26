import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INSIGHT_CODES } from '../../constants/finance-report.constants';
import { RevenueSummaryRow } from '../../models/finance-report.models';
import { RevenueReportRepository } from '../../repositories/revenue-report/revenue-report.repository';
import { RevenueReportsService } from './revenue-reports.service';

const summaryRow = (
  overrides: Partial<RevenueSummaryRow> = {},
): RevenueSummaryRow => ({
  ordersCount: '4',
  grossSales: '1100.00',
  discounts: '100.00',
  netSales: '1000.00',
  paidRevenue: '700.00',
  outstanding: '300.00',
  codInTransit: '100.00',
  cancelledCount: '1',
  cancelledAmount: '50.00',
  ...overrides,
});

describe('RevenueReportsService', () => {
  let service: RevenueReportsService;
  let repository: jest.Mocked<RevenueReportRepository>;

  beforeEach(async () => {
    const repositoryMock = {
      findSummary: jest.fn(),
      findBreakdown: jest.fn(),
      findTimeline: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueReportsService,
        { provide: RevenueReportRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<RevenueReportsService>(RevenueReportsService);
    repository = module.get(RevenueReportRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should build the report with comparison, breakdowns and insights', async () => {
    repository.findSummary
      .mockResolvedValueOnce(summaryRow())
      .mockResolvedValueOnce(
        summaryRow({ ordersCount: '2', netSales: '500.00', grossSales: '0' }),
      );
    repository.findBreakdown
      .mockResolvedValueOnce([
        { key: 'cod', ordersCount: '3', netSales: '750.00' },
        { key: 'card', ordersCount: '1', netSales: '250.00' },
      ])
      .mockResolvedValueOnce([
        { key: 'nova', ordersCount: '4', netSales: '1000.00' },
      ]);
    repository.findTimeline.mockResolvedValue([
      {
        period: '2026-11-01',
        ordersCount: '4',
        netSales: '1000.00',
        paidRevenue: null,
      },
    ]);

    const result = await service.getRevenueReport({
      shopId: 'shop-id',
      from: '2026-11-01',
      to: '2026-11-30',
    });

    const current = {
      from: '2026-11-01',
      to: '2026-11-30',
      toExclusive: '2026-12-01',
      days: 30,
    };
    expect(repository.findSummary).toHaveBeenCalledWith('shop-id', current);
    expect(repository.findSummary).toHaveBeenCalledWith(
      'shop-id',
      result.previousPeriod,
    );
    expect(repository.findBreakdown).toHaveBeenCalledWith(
      'shop-id',
      current,
      'paymentMethod',
    );
    expect(repository.findBreakdown).toHaveBeenCalledWith(
      'shop-id',
      current,
      'shippingMethod',
    );
    expect(repository.findTimeline).toHaveBeenCalledWith(
      'shop-id',
      current,
      'day',
    );
    expect(result.granularity).toBe('day');
    expect(result.summary).toEqual({
      ordersCount: 4,
      grossSales: 1100,
      discounts: 100,
      netSales: 1000,
      paidRevenue: 700,
      outstanding: 300,
      codInTransit: 100,
      averageOrderValue: 250,
      cancelledCount: 1,
      cancelledAmount: 50,
      cancellationRate: 0.2,
    });
    expect(result.changes.netSales).toBe(100);
    expect(result.changes.grossSales).toBeNull();
    expect(result.byPaymentMethod).toEqual([
      { key: 'cod', ordersCount: 3, netSales: 750, share: 0.75 },
      { key: 'card', ordersCount: 1, netSales: 250, share: 0.25 },
    ]);
    expect(result.byShippingMethod[0].share).toBe(1);
    expect(result.timeline).toEqual([
      { period: '2026-11-01', ordersCount: 4, netSales: 1000, paidRevenue: 0 },
    ]);
    expect(result.insights.map((insight) => insight.code)).toEqual([
      INSIGHT_CODES.NET_SALES_GROWTH,
      INSIGHT_CODES.HIGH_CANCELLATION_RATE,
    ]);
  });

  it('should use the requested granularity and handle an empty shop', async () => {
    repository.findSummary.mockResolvedValue(
      summaryRow({
        ordersCount: '0',
        netSales: '0',
        cancelledCount: '0',
        codInTransit: '0',
      }),
    );
    repository.findBreakdown.mockResolvedValue([]);
    repository.findTimeline.mockResolvedValue([]);

    const result = await service.getRevenueReport({
      shopId: 'shop-id',
      from: '2026-11-01',
      to: '2026-11-30',
      groupBy: 'month',
    });

    expect(repository.findTimeline).toHaveBeenCalledWith(
      'shop-id',
      expect.any(Object),
      'month',
    );
    expect(result.summary.averageOrderValue).toBe(0);
    expect(result.summary.cancellationRate).toBe(0);
  });

  it('should reject an invalid period without querying', async () => {
    await expect(
      service.getRevenueReport({
        shopId: 'shop-id',
        from: '2026-12-01',
        to: '2026-11-01',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.findSummary).not.toHaveBeenCalled();
  });
});
