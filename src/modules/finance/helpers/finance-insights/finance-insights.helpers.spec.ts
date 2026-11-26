import { INSIGHT_CODES } from '../../constants/finance-report.constants';
import {
  AbcProduct,
  CustomerSegmentSummary,
  CustomerSummary,
  RevenueChanges,
  RevenueSummary,
} from '../../models/finance-report.models';
import {
  buildCustomerInsights,
  buildProductInsights,
  buildRevenueInsights,
} from './finance-insights.helpers';

const summary = (overrides: Partial<RevenueSummary> = {}): RevenueSummary => ({
  ordersCount: 10,
  grossSales: 1000,
  discounts: 100,
  netSales: 900,
  paidRevenue: 600,
  outstanding: 300,
  codInTransit: 0,
  averageOrderValue: 90,
  cancelledCount: 0,
  cancelledAmount: 0,
  cancellationRate: 0,
  ...overrides,
});

const changes = (overrides: Partial<RevenueChanges> = {}): RevenueChanges => ({
  ordersCount: 0,
  grossSales: 0,
  discounts: 0,
  netSales: 0,
  paidRevenue: 0,
  outstanding: 0,
  codInTransit: 0,
  averageOrderValue: 0,
  cancelledCount: 0,
  cancelledAmount: 0,
  cancellationRate: 0,
  ...overrides,
});

const codes = (insights: { code: string }[]): string[] =>
  insights.map((insight) => insight.code);

describe('finance-insights helpers', () => {
  describe('buildRevenueInsights', () => {
    it('should return no insights for a calm period', () => {
      expect(buildRevenueInsights(summary(), changes())).toEqual([]);
    });

    it('should report growth', () => {
      const result = buildRevenueInsights(summary(), changes({ netSales: 25 }));

      expect(codes(result)).toEqual([INSIGHT_CODES.NET_SALES_GROWTH]);
      expect(result[0].severity).toBe('positive');
      expect(result[0].message).toContain('+25.0%');
    });

    it('should report decline, discounts, cancellations, cod and aov', () => {
      const result = buildRevenueInsights(
        summary({ cancellationRate: 0.2, codInTransit: 450 }),
        changes({
          netSales: -15,
          discounts: 40,
          grossSales: 5,
          averageOrderValue: -12,
        }),
      );

      expect(codes(result)).toEqual([
        INSIGHT_CODES.NET_SALES_DECLINE,
        INSIGHT_CODES.DISCOUNTS_OUTPACE_SALES,
        INSIGHT_CODES.HIGH_CANCELLATION_RATE,
        INSIGHT_CODES.HIGH_COD_IN_TRANSIT,
        INSIGHT_CODES.AOV_DECLINE,
      ]);
    });

    it('should skip comparisons without a previous base', () => {
      const result = buildRevenueInsights(
        summary(),
        changes({ netSales: null, discounts: null, averageOrderValue: null }),
      );

      expect(result).toEqual([]);
    });
  });

  describe('buildProductInsights', () => {
    it('should warn about dependency on one product and dead stock', () => {
      const result = buildProductInsights({
        topProduct: { name: 'Mask', revenueShare: 0.5 } as AbcProduct,
        deadStockTotal: 4,
        deadStockDays: 60,
      });

      expect(codes(result)).toEqual([
        INSIGHT_CODES.TOP_PRODUCT_DEPENDENCY,
        INSIGHT_CODES.DEAD_STOCK,
      ]);
      expect(result[0].message).toContain('Mask');
    });

    it('should return nothing without sales and dead stock', () => {
      expect(
        buildProductInsights({
          topProduct: undefined,
          deadStockTotal: 0,
          deadStockDays: 60,
        }),
      ).toEqual([]);
    });
  });

  describe('buildCustomerInsights', () => {
    const atRiskSegments = (count: number): CustomerSegmentSummary[] => [
      {
        segment: 'atRisk',
        customersCount: count,
        revenue: 0,
        customersShare: 0,
      },
    ];

    it('should warn about low repeat rate and at-risk customers', () => {
      const result = buildCustomerInsights(
        { totalCustomers: 10, repeatRate: 0.1 } as CustomerSummary,
        atRiskSegments(3),
      );

      expect(codes(result)).toEqual([
        INSIGHT_CODES.LOW_REPEAT_RATE,
        INSIGHT_CODES.AT_RISK_CUSTOMERS,
      ]);
    });

    it('should stay quiet for a shop without customers', () => {
      const result = buildCustomerInsights(
        { totalCustomers: 0, repeatRate: 0 } as CustomerSummary,
        [],
      );

      expect(result).toEqual([]);
    });
  });
});
