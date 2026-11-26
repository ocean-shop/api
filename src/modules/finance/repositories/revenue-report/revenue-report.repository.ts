import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from '../../../orders/entities/order.entity';
import {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
} from '../../../orders/entities/enums/order.enum';
import {
  FINANCE_REPORT_TIME_ZONE,
  ReportGranularity,
} from '../../constants/finance-report.constants';
import {
  ReportPeriod,
  RevenueBreakdownRow,
  RevenueSummaryRow,
  RevenueTimelineRow,
} from '../../models/finance-report.models';

/** Only these columns may be used for a breakdown (never taken from input). */
const BREAKDOWN_COLUMNS = {
  paymentMethod: 'o.payment_method',
  shippingMethod: 'o.shipping_method',
} as const;

type BreakdownColumn = keyof typeof BREAKDOWN_COLUMNS;

const NOT_CANCELLED = 'o.status <> :cancelled';

const EMPTY_SUMMARY: RevenueSummaryRow = {
  ordersCount: '0',
  grossSales: '0',
  discounts: '0',
  netSales: '0',
  paidRevenue: '0',
  outstanding: '0',
  codInTransit: '0',
  cancelledCount: '0',
  cancelledAmount: '0',
};

@Injectable()
export class RevenueReportRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findSummary(
    shopId: string,
    period: ReportPeriod,
  ): Promise<RevenueSummaryRow> {
    const row = await this.createPeriodQuery(shopId, period)
      .select(`COUNT(*) FILTER (WHERE ${NOT_CANCELLED})`, 'ordersCount')
      .addSelect(
        `COALESCE(SUM(o.subtotal_amount) FILTER (WHERE ${NOT_CANCELLED}), 0)`,
        'grossSales',
      )
      .addSelect(
        `COALESCE(SUM(o.discount_amount) FILTER (WHERE ${NOT_CANCELLED}), 0)`,
        'discounts',
      )
      .addSelect(
        `COALESCE(SUM(o.total_amount) FILTER (WHERE ${NOT_CANCELLED}), 0)`,
        'netSales',
      )
      .addSelect(
        `COALESCE(SUM(o.total_amount) FILTER (WHERE ${NOT_CANCELLED} AND o.payment_status = :paid), 0)`,
        'paidRevenue',
      )
      .addSelect(
        `COALESCE(SUM(o.total_amount) FILTER (WHERE ${NOT_CANCELLED} AND o.payment_status = :unpaid), 0)`,
        'outstanding',
      )
      .addSelect(
        `COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = :shipped AND o.payment_method = :cod AND o.payment_status = :unpaid), 0)`,
        'codInTransit',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE o.status = :cancelled)',
        'cancelledCount',
      )
      .addSelect(
        'COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = :cancelled), 0)',
        'cancelledAmount',
      )
      .setParameters({
        paid: OrderPaymentStatus.PAID,
        unpaid: OrderPaymentStatus.UNPAID,
        shipped: OrderStatus.SHIPPED,
        cod: OrderPaymentMethod.COD,
      })
      .getRawOne<RevenueSummaryRow>();

    return row ?? EMPTY_SUMMARY;
  }

  async findBreakdown(
    shopId: string,
    period: ReportPeriod,
    column: BreakdownColumn,
  ): Promise<RevenueBreakdownRow[]> {
    const expression = BREAKDOWN_COLUMNS[column];

    return this.createPeriodQuery(shopId, period)
      .select(`${expression}::text`, 'key')
      .addSelect('COUNT(*)', 'ordersCount')
      .addSelect('COALESCE(SUM(o.total_amount), 0)', 'netSales')
      .andWhere(NOT_CANCELLED)
      .groupBy(expression)
      .orderBy('"netSales"', 'DESC')
      .getRawMany<RevenueBreakdownRow>();
  }

  async findTimeline(
    shopId: string,
    period: ReportPeriod,
    granularity: ReportGranularity,
  ): Promise<RevenueTimelineRow[]> {
    return this.createPeriodQuery(shopId, period)
      .select(
        `to_char(date_trunc(:granularity, o.created_at AT TIME ZONE :timeZone), 'YYYY-MM-DD')`,
        'period',
      )
      .addSelect('COUNT(*)', 'ordersCount')
      .addSelect('COALESCE(SUM(o.total_amount), 0)', 'netSales')
      .addSelect(
        'COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_status = :paid), 0)',
        'paidRevenue',
      )
      .andWhere(NOT_CANCELLED)
      .setParameters({ granularity, paid: OrderPaymentStatus.PAID })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany<RevenueTimelineRow>();
  }

  /** Shop + period filter. Bounds are shop-local midnights, compared against the raw column to keep indexes usable. */
  private createPeriodQuery(
    shopId: string,
    period: ReportPeriod,
  ): SelectQueryBuilder<Order> {
    return this.orderRepository
      .createQueryBuilder('o')
      .where('o.shop_id = :shopId', { shopId })
      .andWhere(
        'o.created_at >= (CAST(:from AS timestamp) AT TIME ZONE :timeZone)',
      )
      .andWhere(
        'o.created_at < (CAST(:toExclusive AS timestamp) AT TIME ZONE :timeZone)',
      )
      .setParameters({
        from: period.from,
        toExclusive: period.toExclusive,
        timeZone: FINANCE_REPORT_TIME_ZONE,
        cancelled: OrderStatus.CANCELLED,
      });
  }
}
