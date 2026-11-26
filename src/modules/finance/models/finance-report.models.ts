import {
  AbcClass,
  CustomerSegment,
  ReportGranularity,
} from '../constants/finance-report.constants';

/** Inclusive calendar dates in shop-local time (`YYYY-MM-DD`). */
export type ReportPeriod = {
  from: string;
  to: string;
  /** `to + 1 day`, used as an exclusive upper bound in SQL so indexes stay usable. */
  toExclusive: string;
  days: number;
};

export type ReportPeriods = {
  current: ReportPeriod;
  previous: ReportPeriod;
};

export type ReportPeriodInput = {
  from?: string;
  to?: string;
};

export type InsightSeverity = 'positive' | 'warning' | 'info';

export type FinanceInsight = {
  code: string;
  severity: InsightSeverity;
  message: string;
};

/** Numeric aggregates come from Postgres as strings (`numeric`, `bigint`). */
export type RawAmount = string | null;

// ---------- Revenue ----------

export type RevenueSummaryRow = {
  ordersCount: RawAmount;
  grossSales: RawAmount;
  discounts: RawAmount;
  netSales: RawAmount;
  paidRevenue: RawAmount;
  outstanding: RawAmount;
  codInTransit: RawAmount;
  cancelledCount: RawAmount;
  cancelledAmount: RawAmount;
};

export type RevenueBreakdownRow = {
  key: string;
  ordersCount: RawAmount;
  netSales: RawAmount;
};

export type RevenueTimelineRow = {
  period: string;
  ordersCount: RawAmount;
  netSales: RawAmount;
  paidRevenue: RawAmount;
};

export type RevenueSummary = {
  ordersCount: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  paidRevenue: number;
  /** Not cancelled and not paid yet. */
  outstanding: number;
  /** Cash on delivery parcels already shipped but not paid: money "on the road". */
  codInTransit: number;
  averageOrderValue: number;
  cancelledCount: number;
  cancelledAmount: number;
  /** Cancelled / all orders created in the period, 0..1. */
  cancellationRate: number;
};

/** Percent change vs the previous period; `null` when the previous value is 0. */
export type RevenueChanges = {
  [K in keyof RevenueSummary]: number | null;
};

export type RevenueBreakdownItem = {
  key: string;
  ordersCount: number;
  netSales: number;
  share: number;
};

export type RevenueTimelinePoint = {
  period: string;
  ordersCount: number;
  netSales: number;
  paidRevenue: number;
};

export type RevenueReport = {
  period: ReportPeriod;
  previousPeriod: ReportPeriod;
  granularity: ReportGranularity;
  summary: RevenueSummary;
  previousSummary: RevenueSummary;
  changes: RevenueChanges;
  byPaymentMethod: RevenueBreakdownItem[];
  byShippingMethod: RevenueBreakdownItem[];
  timeline: RevenueTimelinePoint[];
  insights: FinanceInsight[];
};

// ---------- Products ----------

export type ProductSalesRow = {
  productId: string;
  name: string;
  slug: string;
  revenue: RawAmount;
  unitsSold: RawAmount;
  ordersCount: RawAmount;
};

export type ProductSales = {
  productId: string;
  name: string;
  slug: string;
  revenue: number;
  unitsSold: number;
  ordersCount: number;
};

export type AbcProduct = ProductSales & {
  abcClass: AbcClass;
  revenueShare: number;
  cumulativeShare: number;
};

export type AbcClassSummary = {
  abcClass: AbcClass;
  productsCount: number;
  revenue: number;
  revenueShare: number;
};

export type ProductTrend = {
  productId: string;
  name: string;
  slug: string;
  revenue: number;
  previousRevenue: number;
  revenueChange: number;
  /** `null` for products with no sales in the previous period. */
  revenueChangePercent: number | null;
};

export type DeadStockRow = {
  productId: string;
  name: string;
  slug: string;
  price: RawAmount;
  lastSoldAt: Date | null;
};

export type DeadStockProduct = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  lastSoldAt: Date | null;
};

export type DeadStockResult = {
  items: DeadStockRow[];
  total: number;
};

export type ProductReport = {
  period: ReportPeriod;
  previousPeriod: ReportPeriod;
  totalRevenue: number;
  productsSold: number;
  abcSummary: AbcClassSummary[];
  topProducts: AbcProduct[];
  growing: ProductTrend[];
  declining: ProductTrend[];
  deadStock: {
    days: number;
    total: number;
    items: DeadStockProduct[];
  };
  insights: FinanceInsight[];
};

// ---------- Customers ----------

export type CustomerSummaryRow = {
  totalCustomers: RawAmount;
  repeatCustomers: RawAmount;
  guestCustomers: RawAmount;
  lifetimeRevenue: RawAmount;
  lifetimeOrders: RawAmount;
  activeCustomers: RawAmount;
  newCustomers: RawAmount;
  returningCustomers: RawAmount;
  periodRevenue: RawAmount;
  returningRevenue: RawAmount;
};

/** One RFM cell: customers grouped by capped orders count and recency bucket. */
export type CustomerSegmentRow = {
  frequency: RawAmount;
  recencyBucket: RawAmount;
  customersCount: RawAmount;
  revenue: RawAmount;
};

export type CustomerSummary = {
  /** Customers with at least one not cancelled order up to the end of the period. */
  totalCustomers: number;
  repeatCustomers: number;
  /** Customers with ≥ 2 orders / all customers, 0..1. */
  repeatRate: number;
  guestCustomers: number;
  /** Average lifetime revenue per customer. */
  averageLtv: number;
  averageOrdersPerCustomer: number;
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  periodRevenue: number;
  returningRevenue: number;
  /** Share of period revenue from customers who bought before the period, 0..1. */
  returningRevenueShare: number;
};

export type CustomerSegmentSummary = {
  segment: CustomerSegment;
  customersCount: number;
  revenue: number;
  customersShare: number;
};

export type CustomerReport = {
  period: ReportPeriod;
  summary: CustomerSummary;
  segments: CustomerSegmentSummary[];
  insights: FinanceInsight[];
};
