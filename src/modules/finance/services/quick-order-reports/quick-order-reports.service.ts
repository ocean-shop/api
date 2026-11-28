import { Injectable } from '@nestjs/common';
import {
  FINANCE_REPORT_TIME_ZONE,
  QUICK_ORDER_REPORT_LIMITS,
  QUICK_ORDER_VALUE_SOURCE,
} from '../../constants/finance-report.constants';
import { FinanceReportQueryDto } from '../../dto/finance-reports/finance-report-query.dto';
import {
  percentChange,
  toMoney,
  toNumber,
  toRatio,
} from '../../helpers/finance-math/finance-math.helpers';
import {
  formatDateInTimeZone,
  resolveReportPeriods,
} from '../../helpers/report-period/report-period.helpers';
import {
  QuickOrderChanges,
  QuickOrderProduct,
  QuickOrderProductRow,
  QuickOrderReport,
  QuickOrderSummary,
  QuickOrderSummaryRow,
} from '../../models/finance-report.models';
import { QuickOrderReportRepository } from '../../repositories/quick-order-report/quick-order-report.repository';

/**
 * "Buy in one click" requests reported separately from orders: they carry no
 * price, so money values are estimated from the current product price.
 */
@Injectable()
export class QuickOrderReportsService {
  constructor(
    private readonly quickOrderReportRepository: QuickOrderReportRepository,
  ) {}

  async getQuickOrderReport(
    query: FinanceReportQueryDto,
  ): Promise<QuickOrderReport> {
    const today = formatDateInTimeZone(new Date(), FINANCE_REPORT_TIME_ZONE);
    const { current, previous } = resolveReportPeriods(query, today);
    const { shopId } = query;

    const [summaryRow, previousRow, productRows] = await Promise.all([
      this.quickOrderReportRepository.findSummary(shopId, current),
      this.quickOrderReportRepository.findSummary(shopId, previous),
      this.quickOrderReportRepository.findTopProducts(
        shopId,
        current,
        QUICK_ORDER_REPORT_LIMITS.TOP_PRODUCTS,
      ),
    ]);

    const summary = this.toSummary(summaryRow);
    const previousSummary = this.toSummary(previousRow);

    return {
      period: current,
      previousPeriod: previous,
      valueSource: QUICK_ORDER_VALUE_SOURCE,
      summary,
      previousSummary,
      changes: this.compareSummaries(summary, previousSummary),
      topProducts: productRows.map((row) => this.toProduct(row)),
    };
  }

  private toSummary(row: QuickOrderSummaryRow): QuickOrderSummary {
    const totalCount = toNumber(row.totalCount);
    const processedCount = toNumber(row.processedCount);
    const cancelledCount = toNumber(row.cancelledCount);

    return {
      totalCount,
      newCount: toNumber(row.newCount),
      processedCount,
      cancelledCount,
      estimatedValue: toMoney(row.estimatedValue),
      estimatedProcessedValue: toMoney(row.estimatedProcessedValue),
      estimatedCancelledValue: toMoney(row.estimatedCancelledValue),
      processedRate: toRatio(processedCount, totalCount),
      cancellationRate: toRatio(cancelledCount, totalCount),
    };
  }

  private compareSummaries(
    current: QuickOrderSummary,
    previous: QuickOrderSummary,
  ): QuickOrderChanges {
    const keys = Object.keys(current) as (keyof QuickOrderSummary)[];

    return Object.fromEntries(
      keys.map((key) => [key, percentChange(current[key], previous[key])]),
    ) as QuickOrderChanges;
  }

  private toProduct(row: QuickOrderProductRow): QuickOrderProduct {
    return {
      productId: row.productId,
      name: row.name,
      slug: row.slug,
      currentPrice: toMoney(row.currentPrice),
      requestsCount: toNumber(row.requestsCount),
      estimatedValue: toMoney(row.estimatedValue),
    };
  }
}
