import {
  ABC_CLASSES,
  ABC_THRESHOLDS,
  AbcClass,
} from '../../constants/finance-report.constants';
import {
  AbcClassSummary,
  AbcProduct,
  ProductSales,
  ProductTrend,
} from '../../models/finance-report.models';
import {
  percentChange,
  roundMoney,
  toRatio,
} from '../finance-math/finance-math.helpers';

/**
 * Class is decided by the revenue share accumulated *before* the product,
 * so the best seller is always A even if it alone makes 90% of revenue.
 */
const pickAbcClass = (shareBefore: number): AbcClass => {
  if (shareBefore < ABC_THRESHOLDS.A) {
    return 'A';
  }

  return shareBefore < ABC_THRESHOLDS.B ? 'B' : 'C';
};

const byRevenueDesc = (left: ProductSales, right: ProductSales): number =>
  right.revenue - left.revenue;

export const classifyAbc = (sales: ProductSales[]): AbcProduct[] => {
  const totalRevenue = sales.reduce((sum, item) => sum + item.revenue, 0);
  let accumulated = 0;

  return [...sales].sort(byRevenueDesc).map((item) => {
    const abcClass = pickAbcClass(toRatio(accumulated, totalRevenue));
    accumulated += item.revenue;

    return {
      ...item,
      abcClass,
      revenueShare: toRatio(item.revenue, totalRevenue),
      cumulativeShare: toRatio(accumulated, totalRevenue),
    };
  });
};

export const summarizeAbc = (products: AbcProduct[]): AbcClassSummary[] => {
  const totalRevenue = products.reduce((sum, item) => sum + item.revenue, 0);

  return ABC_CLASSES.map((abcClass) => {
    const inClass = products.filter((item) => item.abcClass === abcClass);
    const revenue = inClass.reduce((sum, item) => sum + item.revenue, 0);

    return {
      abcClass,
      productsCount: inClass.length,
      revenue: roundMoney(revenue),
      revenueShare: toRatio(revenue, totalRevenue),
    };
  });
};

type ProductTrends = {
  growing: ProductTrend[];
  declining: ProductTrend[];
};

const toTrend = (
  base: Pick<ProductSales, 'productId' | 'name' | 'slug'>,
  revenue: number,
  previousRevenue: number,
): ProductTrend => ({
  productId: base.productId,
  name: base.name,
  slug: base.slug,
  revenue: roundMoney(revenue),
  previousRevenue: roundMoney(previousRevenue),
  revenueChange: roundMoney(revenue - previousRevenue),
  revenueChangePercent: percentChange(revenue, previousRevenue),
});

/** Compares product revenue between two periods; products sold in either one count. */
export const buildProductTrends = (
  current: ProductSales[],
  previous: ProductSales[],
  limit: number,
): ProductTrends => {
  const previousById = new Map(previous.map((item) => [item.productId, item]));
  const currentIds = new Set(current.map((item) => item.productId));

  const trends = [
    ...current.map((item) =>
      toTrend(
        item,
        item.revenue,
        previousById.get(item.productId)?.revenue ?? 0,
      ),
    ),
    ...previous
      .filter((item) => !currentIds.has(item.productId))
      .map((item) => toTrend(item, 0, item.revenue)),
  ];

  return {
    growing: trends
      .filter((trend) => trend.revenueChange > 0)
      .sort((left, right) => right.revenueChange - left.revenueChange)
      .slice(0, limit),
    declining: trends
      .filter((trend) => trend.revenueChange < 0)
      .sort((left, right) => left.revenueChange - right.revenueChange)
      .slice(0, limit),
  };
};
