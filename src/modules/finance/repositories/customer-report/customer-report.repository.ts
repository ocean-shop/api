import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus } from '../../../orders/entities/enums/order.enum';
import { Order } from '../../../orders/entities/order.entity';
import {
  FINANCE_REPORT_TIME_ZONE,
  FREQUENCY_CAP,
  RECENCY_BUCKET_BOUNDS_DAYS,
} from '../../constants/finance-report.constants';
import {
  CustomerSegmentRow,
  CustomerSummaryRow,
  ReportPeriod,
} from '../../models/finance-report.models';

/**
 * One row per customer with lifetime stats up to the end of the period.
 * Guests are identified by email, then phone, so repeat guest buyers are counted once.
 * Params: $1 shopId, $2 cancelled status, $3 period start, $4 period end (exclusive), $5 time zone.
 */
const CUSTOMERS_CTE = `
  WITH bounds AS (
    SELECT CAST($3 AS timestamp) AT TIME ZONE $5 AS period_start,
           CAST($4 AS timestamp) AT TIME ZONE $5 AS period_end
  ),
  customer_orders AS (
    SELECT COALESCE(o.user_id::text, LOWER(o.email), o.phone_number) AS customer_key,
           o.user_id IS NULL AS is_guest,
           o.total_amount,
           o.created_at
    FROM orders o
    CROSS JOIN bounds b
    WHERE o.shop_id = $1
      AND o.status <> $2
      AND o.created_at < b.period_end
  ),
  customers AS (
    SELECT co.customer_key,
           BOOL_AND(co.is_guest) AS is_guest,
           COUNT(*) AS orders_count,
           SUM(co.total_amount) AS revenue,
           MIN(co.created_at) AS first_order_at,
           MAX(co.created_at) AS last_order_at,
           COUNT(*) FILTER (WHERE co.created_at >= b.period_start) AS period_orders,
           COALESCE(SUM(co.total_amount) FILTER (WHERE co.created_at >= b.period_start), 0) AS period_revenue
    FROM customer_orders co
    CROSS JOIN bounds b
    WHERE co.customer_key IS NOT NULL
    GROUP BY co.customer_key
  )
`;

const SUMMARY_QUERY = `${CUSTOMERS_CTE}
  SELECT COUNT(*) AS "totalCustomers",
         COUNT(*) FILTER (WHERE c.orders_count >= 2) AS "repeatCustomers",
         COUNT(*) FILTER (WHERE c.is_guest) AS "guestCustomers",
         COALESCE(SUM(c.revenue), 0) AS "lifetimeRevenue",
         COALESCE(SUM(c.orders_count), 0) AS "lifetimeOrders",
         COUNT(*) FILTER (WHERE c.period_orders > 0) AS "activeCustomers",
         COUNT(*) FILTER (WHERE c.first_order_at >= b.period_start) AS "newCustomers",
         COUNT(*) FILTER (WHERE c.period_orders > 0 AND c.first_order_at < b.period_start) AS "returningCustomers",
         COALESCE(SUM(c.period_revenue), 0) AS "periodRevenue",
         COALESCE(SUM(c.period_revenue) FILTER (WHERE c.first_order_at < b.period_start), 0) AS "returningRevenue"
  FROM customers c
  CROSS JOIN bounds b
`;

/** Extra params: $6 frequency cap, $7 recency bucket bounds (days). */
const SEGMENTS_QUERY = `${CUSTOMERS_CTE}
  SELECT LEAST(c.orders_count, $6) AS "frequency",
         width_bucket(EXTRACT(DAY FROM (b.period_end - c.last_order_at))::int, $7::int[]) AS "recencyBucket",
         COUNT(*) AS "customersCount",
         COALESCE(SUM(c.revenue), 0) AS "revenue"
  FROM customers c
  CROSS JOIN bounds b
  GROUP BY 1, 2
`;

@Injectable()
export class CustomerReportRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findSummary(
    shopId: string,
    period: ReportPeriod,
  ): Promise<CustomerSummaryRow | undefined> {
    const rows = await this.orderRepository.query<CustomerSummaryRow[]>(
      SUMMARY_QUERY,
      this.buildParams(shopId, period),
    );

    return rows[0];
  }

  async findSegments(
    shopId: string,
    period: ReportPeriod,
  ): Promise<CustomerSegmentRow[]> {
    return this.orderRepository.query<CustomerSegmentRow[]>(SEGMENTS_QUERY, [
      ...this.buildParams(shopId, period),
      FREQUENCY_CAP,
      [...RECENCY_BUCKET_BOUNDS_DAYS],
    ]);
  }

  private buildParams(shopId: string, period: ReportPeriod): string[] {
    return [
      shopId,
      OrderStatus.CANCELLED,
      period.from,
      period.toExclusive,
      FINANCE_REPORT_TIME_ZONE,
    ];
  }
}
