import {
  CUSTOMER_SEGMENTS,
  CustomerSegment,
  FREQUENCY_CAP,
  RECENCY_BUCKET,
} from '../../constants/finance-report.constants';
import {
  CustomerSegmentRow,
  CustomerSegmentSummary,
} from '../../models/finance-report.models';
import {
  roundMoney,
  toNumber,
  toRatio,
} from '../finance-math/finance-math.helpers';

const REPEAT_FREQUENCY = 2;

/**
 * Simplified RFM: recency bucket × frequency (1, 2, 3+) → marketing segment.
 * Monetary value is reported per segment instead of being a scoring axis,
 * which keeps segments explainable for small shops.
 */
export const pickCustomerSegment = (
  frequency: number,
  recencyBucket: number,
): CustomerSegment => {
  if (recencyBucket >= RECENCY_BUCKET.OVER_1_YEAR) {
    return 'lost';
  }

  if (
    frequency >= FREQUENCY_CAP &&
    recencyBucket <= RECENCY_BUCKET.UNDER_2_MONTHS
  ) {
    return 'champions';
  }

  const isRepeat = frequency >= REPEAT_FREQUENCY;

  if (recencyBucket === RECENCY_BUCKET.UNDER_1_YEAR) {
    return isRepeat ? 'atRisk' : 'hibernating';
  }

  if (isRepeat) {
    return 'loyal';
  }

  return recencyBucket === RECENCY_BUCKET.UNDER_1_MONTH ? 'new' : 'promising';
};

export const summarizeCustomerSegments = (
  rows: CustomerSegmentRow[],
): CustomerSegmentSummary[] => {
  const totals = new Map<
    CustomerSegment,
    { customers: number; revenue: number }
  >(
    CUSTOMER_SEGMENTS.map((segment) => [segment, { customers: 0, revenue: 0 }]),
  );

  for (const row of rows) {
    const segment = pickCustomerSegment(
      toNumber(row.frequency),
      toNumber(row.recencyBucket),
    );
    const total = totals.get(segment)!;
    total.customers += toNumber(row.customersCount);
    total.revenue += toNumber(row.revenue);
  }

  const allCustomers = [...totals.values()].reduce(
    (sum, total) => sum + total.customers,
    0,
  );

  return CUSTOMER_SEGMENTS.map((segment) => {
    const total = totals.get(segment)!;

    return {
      segment,
      customersCount: total.customers,
      revenue: roundMoney(total.revenue),
      customersShare: toRatio(total.customers, allCustomers),
    };
  });
};
