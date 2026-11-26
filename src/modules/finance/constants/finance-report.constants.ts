/** Reports group days in the shop's local time, not UTC (a sale at 01:00 Kyiv belongs to that Kyiv day). */
export const FINANCE_REPORT_TIME_ZONE = 'Europe/Kyiv';

/** Plain calendar date accepted by report filters, e.g. `2026-11-01`. */
export const REPORT_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const REPORT_PERIOD_LIMITS = {
  /** Period used when neither `from` nor `to` is given. */
  DEFAULT_DAYS: 30,
  /** Upper bound keeps the aggregate queries cheap. */
  MAX_DAYS: 366,
} as const;

export const REPORT_GRANULARITIES = ['day', 'week', 'month'] as const;
export type ReportGranularity = (typeof REPORT_GRANULARITIES)[number];

/** Auto-pick the timeline granularity so a chart has a readable number of points. */
export const AUTO_GRANULARITY_MAX_DAYS = {
  DAY: 31,
  WEEK: 120,
} as const;

export const PRODUCT_REPORT_LIMITS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_DEAD_STOCK_DAYS: 60,
  MIN_DEAD_STOCK_DAYS: 7,
  MAX_DEAD_STOCK_DAYS: 365,
} as const;

/** Classic Pareto split: A = first 80% of revenue, B = next 15%, C = the rest. */
export const ABC_THRESHOLDS = {
  A: 0.8,
  B: 0.95,
} as const;

export const ABC_CLASSES = ['A', 'B', 'C'] as const;
export type AbcClass = (typeof ABC_CLASSES)[number];

/**
 * Recency bucket upper bounds in days since the last order (shop-local).
 * Bucket index i means `bounds[i-1] <= days < bounds[i]`; the last bucket is open.
 */
export const RECENCY_BUCKET_BOUNDS_DAYS = [31, 61, 121, 366] as const;

/** Indexes returned by Postgres `width_bucket` for the bounds above. */
export const RECENCY_BUCKET = {
  UNDER_1_MONTH: 0,
  UNDER_2_MONTHS: 1,
  UNDER_4_MONTHS: 2,
  UNDER_1_YEAR: 3,
  OVER_1_YEAR: 4,
} as const;

/** Orders count is capped here: "3 or more" is one frequency group. */
export const FREQUENCY_CAP = 3;

export const CUSTOMER_SEGMENTS = [
  'champions',
  'loyal',
  'new',
  'promising',
  'atRisk',
  'hibernating',
  'lost',
] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

/** Thresholds for rule-based insights. Ratios are 0..1, changes are percents. */
export const INSIGHT_THRESHOLDS = {
  SIGNIFICANT_CHANGE_PERCENT: 10,
  DISCOUNT_OUTPACE_PERCENT_POINTS: 20,
  HIGH_CANCELLATION_RATE: 0.1,
  HIGH_COD_IN_TRANSIT_SHARE: 0.3,
  TOP_PRODUCT_DEPENDENCY_SHARE: 0.3,
  LOW_REPEAT_RATE: 0.2,
} as const;

/** Stable machine-readable insight ids, so the admin UI can pick icons/links. */
export const INSIGHT_CODES = {
  NET_SALES_GROWTH: 'net_sales_growth',
  NET_SALES_DECLINE: 'net_sales_decline',
  DISCOUNTS_OUTPACE_SALES: 'discounts_outpace_sales',
  HIGH_CANCELLATION_RATE: 'high_cancellation_rate',
  HIGH_COD_IN_TRANSIT: 'high_cod_in_transit',
  AOV_DECLINE: 'aov_decline',
  TOP_PRODUCT_DEPENDENCY: 'top_product_dependency',
  DEAD_STOCK: 'dead_stock',
  LOW_REPEAT_RATE: 'low_repeat_rate',
  AT_RISK_CUSTOMERS: 'at_risk_customers',
} as const;

export const MS_IN_DAY = 24 * 60 * 60 * 1000;
export const PERCENT = 100;
export const MONEY_PRECISION = 2;
export const RATIO_PRECISION = 4;
