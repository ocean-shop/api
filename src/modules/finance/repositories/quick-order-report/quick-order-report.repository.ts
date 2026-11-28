import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QuickOrderStatus } from '../../../orders/entities/enums/quick-order.enum';
import { QuickOrder } from '../../../orders/entities/quick-order.entity';
import { FINANCE_REPORT_TIME_ZONE } from '../../constants/finance-report.constants';
import {
  QuickOrderProductRow,
  QuickOrderSummaryRow,
  ReportPeriod,
} from '../../models/finance-report.models';

const NOT_CANCELLED = 'qo.status <> :cancelled';

const EMPTY_SUMMARY: QuickOrderSummaryRow = {
  totalCount: '0',
  newCount: '0',
  processedCount: '0',
  cancelledCount: '0',
  estimatedValue: '0',
  estimatedProcessedValue: '0',
  estimatedCancelledValue: '0',
};

/**
 * Quick orders have no price snapshot, so every value here is an estimate:
 * one unit of the product at its current `products.price`.
 */
@Injectable()
export class QuickOrderReportRepository {
  constructor(
    @InjectRepository(QuickOrder)
    private readonly quickOrderRepository: Repository<QuickOrder>,
  ) {}

  async findSummary(
    shopId: string,
    period: ReportPeriod,
  ): Promise<QuickOrderSummaryRow> {
    const row = await this.createPeriodQuery(shopId, period)
      .select('COUNT(*)', 'totalCount')
      .addSelect('COUNT(*) FILTER (WHERE qo.status = :new)', 'newCount')
      .addSelect(
        'COUNT(*) FILTER (WHERE qo.status = :processed)',
        'processedCount',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE qo.status = :cancelled)',
        'cancelledCount',
      )
      .addSelect(
        `COALESCE(SUM(p.price) FILTER (WHERE ${NOT_CANCELLED}), 0)`,
        'estimatedValue',
      )
      .addSelect(
        'COALESCE(SUM(p.price) FILTER (WHERE qo.status = :processed), 0)',
        'estimatedProcessedValue',
      )
      .addSelect(
        'COALESCE(SUM(p.price) FILTER (WHERE qo.status = :cancelled), 0)',
        'estimatedCancelledValue',
      )
      .setParameters({
        new: QuickOrderStatus.NEW,
        processed: QuickOrderStatus.PROCESSED,
      })
      .getRawOne<QuickOrderSummaryRow>();

    return row ?? EMPTY_SUMMARY;
  }

  /** Not cancelled requests per product, most requested first. */
  async findTopProducts(
    shopId: string,
    period: ReportPeriod,
    limit: number,
  ): Promise<QuickOrderProductRow[]> {
    return this.createPeriodQuery(shopId, period)
      .select('p.id', 'productId')
      .addSelect('p.name', 'name')
      .addSelect('p.slug', 'slug')
      .addSelect('p.price', 'currentPrice')
      .addSelect('COUNT(*)', 'requestsCount')
      .addSelect('COALESCE(SUM(p.price), 0)', 'estimatedValue')
      .andWhere(NOT_CANCELLED)
      .groupBy('p.id')
      .orderBy('"requestsCount"', 'DESC')
      .addOrderBy('p.name', 'ASC')
      .limit(limit)
      .getRawMany<QuickOrderProductRow>();
  }

  /** Shop + period filter with shop-local midnights as bounds (same as the order reports). */
  private createPeriodQuery(
    shopId: string,
    period: ReportPeriod,
  ): SelectQueryBuilder<QuickOrder> {
    return this.quickOrderRepository
      .createQueryBuilder('qo')
      .innerJoin('qo.product', 'p')
      .where('qo.shop_id = :shopId', { shopId })
      .andWhere(
        'qo.created_at >= (CAST(:from AS timestamp) AT TIME ZONE :timeZone)',
      )
      .andWhere(
        'qo.created_at < (CAST(:toExclusive AS timestamp) AT TIME ZONE :timeZone)',
      )
      .setParameters({
        from: period.from,
        toExclusive: period.toExclusive,
        timeZone: FINANCE_REPORT_TIME_ZONE,
        cancelled: QuickOrderStatus.CANCELLED,
      });
  }
}
