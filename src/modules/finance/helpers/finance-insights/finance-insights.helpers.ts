import { FINANCE_INSIGHT_MESSAGES } from '../../constants/finance-messages.constants';
import {
  INSIGHT_CODES,
  INSIGHT_THRESHOLDS,
} from '../../constants/finance-report.constants';
import {
  AbcProduct,
  CustomerSegmentSummary,
  CustomerSummary,
  FinanceInsight,
  RevenueChanges,
  RevenueSummary,
} from '../../models/finance-report.models';
import { toRatio } from '../finance-math/finance-math.helpers';

const { SIGNIFICANT_CHANGE_PERCENT } = INSIGHT_THRESHOLDS;

const isSignificantDecline = (change: number | null): change is number =>
  change !== null && change <= -SIGNIFICANT_CHANGE_PERCENT;

const buildNetSalesInsight = (change: number | null): FinanceInsight | null => {
  if (change !== null && change >= SIGNIFICANT_CHANGE_PERCENT) {
    return {
      code: INSIGHT_CODES.NET_SALES_GROWTH,
      severity: 'positive',
      message: FINANCE_INSIGHT_MESSAGES.NET_SALES_GROWTH(change),
    };
  }

  if (isSignificantDecline(change)) {
    return {
      code: INSIGHT_CODES.NET_SALES_DECLINE,
      severity: 'warning',
      message: FINANCE_INSIGHT_MESSAGES.NET_SALES_DECLINE(change),
    };
  }

  return null;
};

/** Discounts growing much faster than gross sales usually means promos stopped paying off. */
const buildDiscountInsight = (
  changes: RevenueChanges,
): FinanceInsight | null => {
  const { discounts, grossSales } = changes;

  if (discounts === null || grossSales === null) {
    return null;
  }

  if (
    discounts - grossSales <
    INSIGHT_THRESHOLDS.DISCOUNT_OUTPACE_PERCENT_POINTS
  ) {
    return null;
  }

  return {
    code: INSIGHT_CODES.DISCOUNTS_OUTPACE_SALES,
    severity: 'warning',
    message: FINANCE_INSIGHT_MESSAGES.DISCOUNTS_OUTPACE_SALES(
      discounts,
      grossSales,
    ),
  };
};

const buildCancellationInsight = (
  summary: RevenueSummary,
): FinanceInsight | null =>
  summary.cancellationRate >= INSIGHT_THRESHOLDS.HIGH_CANCELLATION_RATE
    ? {
        code: INSIGHT_CODES.HIGH_CANCELLATION_RATE,
        severity: 'warning',
        message: FINANCE_INSIGHT_MESSAGES.HIGH_CANCELLATION_RATE(
          summary.cancellationRate,
        ),
      }
    : null;

const buildCodInTransitInsight = (
  summary: RevenueSummary,
): FinanceInsight | null => {
  const share = toRatio(summary.codInTransit, summary.netSales);

  return share >= INSIGHT_THRESHOLDS.HIGH_COD_IN_TRANSIT_SHARE
    ? {
        code: INSIGHT_CODES.HIGH_COD_IN_TRANSIT,
        severity: 'info',
        message: FINANCE_INSIGHT_MESSAGES.HIGH_COD_IN_TRANSIT(share),
      }
    : null;
};

const buildAovInsight = (changes: RevenueChanges): FinanceInsight | null =>
  isSignificantDecline(changes.averageOrderValue)
    ? {
        code: INSIGHT_CODES.AOV_DECLINE,
        severity: 'warning',
        message: FINANCE_INSIGHT_MESSAGES.AOV_DECLINE(
          changes.averageOrderValue,
        ),
      }
    : null;

const compact = (insights: (FinanceInsight | null)[]): FinanceInsight[] =>
  insights.filter((insight): insight is FinanceInsight => insight !== null);

export const buildRevenueInsights = (
  summary: RevenueSummary,
  changes: RevenueChanges,
): FinanceInsight[] =>
  compact([
    buildNetSalesInsight(changes.netSales),
    buildDiscountInsight(changes),
    buildCancellationInsight(summary),
    buildCodInTransitInsight(summary),
    buildAovInsight(changes),
  ]);

type ProductInsightInput = {
  topProduct: AbcProduct | undefined;
  deadStockTotal: number;
  deadStockDays: number;
};

export const buildProductInsights = ({
  topProduct,
  deadStockTotal,
  deadStockDays,
}: ProductInsightInput): FinanceInsight[] =>
  compact([
    topProduct &&
    topProduct.revenueShare >= INSIGHT_THRESHOLDS.TOP_PRODUCT_DEPENDENCY_SHARE
      ? {
          code: INSIGHT_CODES.TOP_PRODUCT_DEPENDENCY,
          severity: 'warning',
          message: FINANCE_INSIGHT_MESSAGES.TOP_PRODUCT_DEPENDENCY(
            topProduct.name,
            topProduct.revenueShare,
          ),
        }
      : null,
    deadStockTotal > 0
      ? {
          code: INSIGHT_CODES.DEAD_STOCK,
          severity: 'info',
          message: FINANCE_INSIGHT_MESSAGES.DEAD_STOCK(
            deadStockTotal,
            deadStockDays,
          ),
        }
      : null,
  ]);

export const buildCustomerInsights = (
  summary: CustomerSummary,
  segments: CustomerSegmentSummary[],
): FinanceInsight[] => {
  const atRisk =
    segments.find((item) => item.segment === 'atRisk')?.customersCount ?? 0;

  return compact([
    summary.totalCustomers > 0 &&
    summary.repeatRate < INSIGHT_THRESHOLDS.LOW_REPEAT_RATE
      ? {
          code: INSIGHT_CODES.LOW_REPEAT_RATE,
          severity: 'warning',
          message: FINANCE_INSIGHT_MESSAGES.LOW_REPEAT_RATE(summary.repeatRate),
        }
      : null,
    atRisk > 0
      ? {
          code: INSIGHT_CODES.AT_RISK_CUSTOMERS,
          severity: 'info',
          message: FINANCE_INSIGHT_MESSAGES.AT_RISK_CUSTOMERS(atRisk),
        }
      : null,
  ]);
};
