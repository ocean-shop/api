import { Injectable } from '@nestjs/common';
import {
  FINANCE_REPORT_TIME_ZONE,
  MS_IN_DAY,
} from '../../constants/finance-report.constants';
import { GetProductReportQueryDto } from '../../dto/finance-reports/get-product-report-query.dto';
import {
  buildProductTrends,
  classifyAbc,
  summarizeAbc,
} from '../../helpers/abc-analysis/abc-analysis.helpers';
import { buildProductInsights } from '../../helpers/finance-insights/finance-insights.helpers';
import {
  roundMoney,
  toMoney,
  toNumber,
} from '../../helpers/finance-math/finance-math.helpers';
import {
  formatDateInTimeZone,
  resolveReportPeriods,
} from '../../helpers/report-period/report-period.helpers';
import {
  DeadStockProduct,
  DeadStockRow,
  ProductReport,
  ProductSales,
  ProductSalesRow,
} from '../../models/finance-report.models';
import { ProductReportRepository } from '../../repositories/product-report/product-report.repository';

@Injectable()
export class ProductReportsService {
  constructor(
    private readonly productReportRepository: ProductReportRepository,
  ) {}

  async getProductReport(
    query: GetProductReportQueryDto,
  ): Promise<ProductReport> {
    const now = new Date();
    const today = formatDateInTimeZone(now, FINANCE_REPORT_TIME_ZONE);
    const { current, previous } = resolveReportPeriods(query, today);
    const { shopId, limit, deadStockDays } = query;
    const deadStockCutoff = new Date(now.getTime() - deadStockDays * MS_IN_DAY);

    const [currentRows, previousRows, deadStock] = await Promise.all([
      this.productReportRepository.findProductSales(shopId, current),
      this.productReportRepository.findProductSales(shopId, previous),
      this.productReportRepository.findDeadStock(
        shopId,
        deadStockCutoff,
        limit,
      ),
    ]);

    const currentSales = currentRows.map((row) => this.toProductSales(row));
    const previousSales = previousRows.map((row) => this.toProductSales(row));
    const abcProducts = classifyAbc(currentSales);
    const { growing, declining } = buildProductTrends(
      currentSales,
      previousSales,
      limit,
    );
    const totalRevenue = currentSales.reduce(
      (sum, item) => sum + item.revenue,
      0,
    );

    return {
      period: current,
      previousPeriod: previous,
      totalRevenue: roundMoney(totalRevenue),
      productsSold: currentSales.length,
      abcSummary: summarizeAbc(abcProducts),
      topProducts: abcProducts.slice(0, limit),
      growing,
      declining,
      deadStock: {
        days: deadStockDays,
        total: deadStock.total,
        items: deadStock.items.map((row) => this.toDeadStockProduct(row)),
      },
      insights: buildProductInsights({
        topProduct: abcProducts[0],
        deadStockTotal: deadStock.total,
        deadStockDays,
      }),
    };
  }

  private toProductSales(row: ProductSalesRow): ProductSales {
    return {
      productId: row.productId,
      name: row.name,
      slug: row.slug,
      revenue: toMoney(row.revenue),
      unitsSold: toNumber(row.unitsSold),
      ordersCount: toNumber(row.ordersCount),
    };
  }

  private toDeadStockProduct(row: DeadStockRow): DeadStockProduct {
    return { ...row, price: toMoney(row.price) };
  }
}
