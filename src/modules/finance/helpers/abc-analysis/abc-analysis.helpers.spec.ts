import { ProductSales } from '../../models/finance-report.models';
import {
  buildProductTrends,
  classifyAbc,
  summarizeAbc,
} from './abc-analysis.helpers';

const sale = (productId: string, revenue: number): ProductSales => ({
  productId,
  name: `Product ${productId}`,
  slug: `product-${productId}`,
  revenue,
  unitsSold: 1,
  ordersCount: 1,
});

describe('abc-analysis helpers', () => {
  describe('classifyAbc', () => {
    it('should sort by revenue and assign A/B/C by accumulated share', () => {
      const result = classifyAbc([
        sale('c', 4),
        sale('a', 70),
        sale('b', 15),
        sale('d', 1),
        sale('a2', 10),
      ]);

      expect(result.map((item) => [item.productId, item.abcClass])).toEqual([
        ['a', 'A'],
        ['b', 'A'],
        ['a2', 'B'],
        ['c', 'C'],
        ['d', 'C'],
      ]);
      expect(result[0].revenueShare).toBe(0.7);
      expect(result[4].cumulativeShare).toBe(1);
    });

    it('should always put the best seller into A', () => {
      const result = classifyAbc([sale('x', 95), sale('y', 5)]);

      expect(result[0].abcClass).toBe('A');
      expect(result[1].abcClass).toBe('C');
    });

    it('should return an empty list without sales', () => {
      expect(classifyAbc([])).toEqual([]);
    });
  });

  describe('summarizeAbc', () => {
    it('should summarize every class including empty ones', () => {
      const result = summarizeAbc(classifyAbc([sale('x', 95), sale('y', 5)]));

      expect(result).toEqual([
        { abcClass: 'A', productsCount: 1, revenue: 95, revenueShare: 0.95 },
        { abcClass: 'B', productsCount: 0, revenue: 0, revenueShare: 0 },
        { abcClass: 'C', productsCount: 1, revenue: 5, revenueShare: 0.05 },
      ]);
    });
  });

  describe('buildProductTrends', () => {
    it('should split products into growing and declining', () => {
      const result = buildProductTrends(
        [sale('up', 200), sale('down', 50), sale('new', 30), sale('flat', 10)],
        [sale('up', 100), sale('down', 80), sale('gone', 40), sale('flat', 10)],
        10,
      );

      expect(result.growing.map((item) => item.productId)).toEqual([
        'up',
        'new',
      ]);
      expect(result.growing[1].revenueChangePercent).toBeNull();
      expect(result.declining.map((item) => item.productId)).toEqual([
        'gone',
        'down',
      ]);
      expect(result.declining[0]).toEqual({
        productId: 'gone',
        name: 'Product gone',
        slug: 'product-gone',
        revenue: 0,
        previousRevenue: 40,
        revenueChange: -40,
        revenueChangePercent: -100,
      });
    });

    it('should respect the limit', () => {
      const result = buildProductTrends([sale('a', 3), sale('b', 2)], [], 1);

      expect(result.growing).toHaveLength(1);
      expect(result.declining).toEqual([]);
    });
  });
});
