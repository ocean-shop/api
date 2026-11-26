import { Injectable } from '@nestjs/common';
import { FINANCE_REPORT_TIME_ZONE } from '../../constants/finance-report.constants';
import { GetRevenueReportQueryDto } from '../../dto/finance-reports/get-revenue-report-query.dto';
import { buildRevenueInsights } from '../../helpers/finance-insights/finance-insights.helpers';
import {
  percentChange,
  roundMoney,
  toMoney,
  toNumber,
  toRatio,
} from '../../helpers/finance-math/finance-math.helpers';
import {
  formatDateInTimeZone,
  resolveGranularity,
  resolveReportPeriods,
} from '../../helpers/report-period/report-period.helpers';
import {
  RevenueBreakdownItem,
  RevenueBreakdownRow,
  RevenueChanges,
  RevenueReport,
  RevenueSummary,
  RevenueSummaryRow,
  RevenueTimelinePoint,
  RevenueTimelineRow,
} from '../../models/finance-report.models';
import { RevenueReportRepository } from '../../repositories/revenue-report/revenue-report.repository';

@Injectable()
export class RevenueReportsService {
  constructor(
    private readonly revenueReportRepository: RevenueReportRepository,
  ) {}

  async getRevenueReport(
    query: GetRevenueReportQueryDto,
  ): Promise<RevenueReport> {
    const today = formatDateInTimeZone(new Date(), FINANCE_REPORT_TIME_ZONE);
    const { current, previous } = resolveReportPeriods(query, today);
    const granularity = resolveGranularity(current.days, query.groupBy);
    const { shopId } = query;

    const [summaryRow, previousRow, byPayment, byShipping, timeline] =
      await Promise.all([
        this.revenueReportRepository.findSummary(shopId, current),
        this.revenueReportRepository.findSummary(shopId, previous),
        this.revenueReportRepository.findBreakdown(
          shopId,
          current,
          'paymentMethod',
        ),
        this.revenueReportRepository.findBreakdown(
          shopId,
          current,
          'shippingMethod',
        ),
        this.revenueReportRepository.findTimeline(shopId, current, granularity),
      ]);

    const summary = this.toSummary(summaryRow);
    const previousSummary = this.toSummary(previousRow);
    const changes = this.compareSummaries(summary, previousSummary);

    return {
      period: current,
      previousPeriod: previous,
      granularity,
      summary,
      previousSummary,
      changes,
      byPaymentMethod: this.toBreakdown(byPayment, summary.netSales),
      byShippingMethod: this.toBreakdown(byShipping, summary.netSales),
      timeline: this.toTimeline(timeline),
      insights: buildRevenueInsights(summary, changes),
    };
  }

  private toSummary(row: RevenueSummaryRow): RevenueSummary {
    const ordersCount = toNumber(row.ordersCount);
    const cancelledCount = toNumber(row.cancelledCount);
    const netSales = toMoney(row.netSales);

    return {
      ordersCount,
      grossSales: toMoney(row.grossSales),
      discounts: toMoney(row.discounts),
      netSales,
      paidRevenue: toMoney(row.paidRevenue),
      outstanding: toMoney(row.outstanding),
      codInTransit: toMoney(row.codInTransit),
      averageOrderValue:
        ordersCount === 0 ? 0 : roundMoney(netSales / ordersCount),
      cancelledCount,
      cancelledAmount: toMoney(row.cancelledAmount),
      cancellationRate: toRatio(cancelledCount, ordersCount + cancelledCount),
    };
  }

  private compareSummaries(
    current: RevenueSummary,
    previous: RevenueSummary,
  ): RevenueChanges {
    const keys = Object.keys(current) as (keyof RevenueSummary)[];

    return Object.fromEntries(
      keys.map((key) => [key, percentChange(current[key], previous[key])]),
    ) as RevenueChanges;
  }

  private toBreakdown(
    rows: RevenueBreakdownRow[],
    totalNetSales: number,
  ): RevenueBreakdownItem[] {
    return rows.map((row) => {
      const netSales = toMoney(row.netSales);

      return {
        key: row.key,
        ordersCount: toNumber(row.ordersCount),
        netSales,
        share: toRatio(netSales, totalNetSales),
      };
    });
  }

  private toTimeline(rows: RevenueTimelineRow[]): RevenueTimelinePoint[] {
    return rows.map((row) => ({
      period: row.period,
      ordersCount: toNumber(row.ordersCount),
      netSales: toMoney(row.netSales),
      paidRevenue: toMoney(row.paidRevenue),
    }));
  }
}
