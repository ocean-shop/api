import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStatus } from '../../../catalog/entities/enums/product.enum';
import { Product } from '../../../catalog/entities/product.entity';
import { OrderStatus } from '../../../orders/entities/enums/order.enum';
import { Order } from '../../../orders/entities/order.entity';
import { OrderProduct } from '../../../orders/entities/order-product.entity';
import { FINANCE_REPORT_TIME_ZONE } from '../../constants/finance-report.constants';
import {
  DeadStockResult,
  DeadStockRow,
  ProductSalesRow,
  ReportPeriod,
} from '../../models/finance-report.models';

type DeadStockRawRow = DeadStockRow & { total: string };

@Injectable()
export class ProductReportRepository {
  constructor(
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /** Revenue per product from the price snapshot stored on the order line. */
  async findProductSales(
    shopId: string,
    period: ReportPeriod,
  ): Promise<ProductSalesRow[]> {
    return this.orderProductRepository
      .createQueryBuilder('op')
      .innerJoin('op.order', 'o')
      .innerJoin('op.product', 'p')
      .select('p.id', 'productId')
      .addSelect('p.name', 'name')
      .addSelect('p.slug', 'slug')
      .addSelect('SUM(op.unit_price * op.quantity)', 'revenue')
      .addSelect('SUM(op.quantity)', 'unitsSold')
      .addSelect('COUNT(DISTINCT op.order_id)', 'ordersCount')
      .where('o.shop_id = :shopId', { shopId })
      .andWhere('o.status <> :cancelled', { cancelled: OrderStatus.CANCELLED })
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
      })
      .groupBy('p.id')
      .orderBy('revenue', 'DESC')
      .getRawMany<ProductSalesRow>();
  }

  /**
   * Active products older than `cutoff` with no (not cancelled) sale since `cutoff`.
   * New products are skipped: they had no chance to sell yet.
   */
  async findDeadStock(
    shopId: string,
    cutoff: Date,
    limit: number,
  ): Promise<DeadStockResult> {
    const rows = await this.productRepository
      .createQueryBuilder('p')
      .leftJoin(OrderProduct, 'op', 'op.product_id = p.id')
      .leftJoin(Order, 'o', 'o.id = op.order_id AND o.status <> :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .select('p.id', 'productId')
      .addSelect('p.name', 'name')
      .addSelect('p.slug', 'slug')
      .addSelect('p.price', 'price')
      .addSelect('MAX(o.created_at)', 'lastSoldAt')
      .addSelect('COUNT(*) OVER ()', 'total')
      .where('p.shop_id = :shopId', { shopId })
      .andWhere('p.status = :active', { active: ProductStatus.ACTIVE })
      .andWhere('p.created_at < :cutoff', { cutoff })
      .groupBy('p.id')
      .having('MAX(o.created_at) IS NULL OR MAX(o.created_at) < :cutoff')
      .orderBy('MAX(o.created_at)', 'ASC', 'NULLS FIRST')
      .addOrderBy('p.name', 'ASC')
      .limit(limit)
      .getRawMany<DeadStockRawRow>();

    return {
      items: rows.map((row) => ({
        productId: row.productId,
        name: row.name,
        slug: row.slug,
        price: row.price,
        lastSoldAt: row.lastSoldAt,
      })),
      total: rows.length > 0 ? Number(rows[0].total) : 0,
    };
  }
}
