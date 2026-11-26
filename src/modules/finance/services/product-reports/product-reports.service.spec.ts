import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INSIGHT_CODES } from '../../constants/finance-report.constants';
import { ProductSalesRow } from '../../models/finance-report.models';
import { ProductReportRepository } from '../../repositories/product-report/product-report.repository';
import { ProductReportsService } from './product-reports.service';

const salesRow = (productId: string, revenue: string): ProductSalesRow => ({
  productId,
  name: `Product ${productId}`,
  slug: `product-${productId}`,
  revenue,
  unitsSold: '2',
  ordersCount: '1',
});

describe('ProductReportsService', () => {
  let service: ProductReportsService;
  let repository: jest.Mocked<ProductReportRepository>;

  beforeEach(async () => {
    const repositoryMock = {
      findProductSales: jest.fn(),
      findDeadStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReportsService,
        { provide: ProductReportRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<ProductReportsService>(ProductReportsService);
    repository = module.get(ProductReportRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should build ABC, trends, dead stock and insights', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-26T10:00:00Z') });
    repository.findProductSales
      .mockResolvedValueOnce([salesRow('a', '900.00'), salesRow('b', '100.00')])
      .mockResolvedValueOnce([salesRow('a', '300.00'), salesRow('c', '50.00')]);
    repository.findDeadStock.mockResolvedValue({
      items: [
        {
          productId: 'd',
          name: 'Old',
          slug: 'old',
          price: '19.90',
          lastSoldAt: null,
        },
      ],
      total: 3,
    });

    const result = await service.getProductReport({
      shopId: 'shop-id',
      limit: 1,
      deadStockDays: 60,
    });

    expect(repository.findProductSales).toHaveBeenCalledWith('shop-id', {
      from: '2026-10-28',
      to: '2026-11-26',
      toExclusive: '2026-11-27',
      days: 30,
    });
    expect(repository.findDeadStock).toHaveBeenCalledWith(
      'shop-id',
      new Date('2026-09-27T10:00:00Z'),
      1,
    );
    expect(result.totalRevenue).toBe(1000);
    expect(result.productsSold).toBe(2);
    expect(result.topProducts).toHaveLength(1);
    expect(result.topProducts[0]).toMatchObject({
      productId: 'a',
      abcClass: 'A',
      revenueShare: 0.9,
      unitsSold: 2,
    });
    expect(result.abcSummary.map((item) => item.productsCount)).toEqual([
      1, 1, 0,
    ]);
    expect(result.growing.map((item) => item.productId)).toEqual(['a']);
    expect(result.declining.map((item) => item.productId)).toEqual(['c']);
    expect(result.deadStock).toEqual({
      days: 60,
      total: 3,
      items: [
        {
          productId: 'd',
          name: 'Old',
          slug: 'old',
          price: 19.9,
          lastSoldAt: null,
        },
      ],
    });
    expect(result.insights.map((insight) => insight.code)).toEqual([
      INSIGHT_CODES.TOP_PRODUCT_DEPENDENCY,
      INSIGHT_CODES.DEAD_STOCK,
    ]);
  });

  it('should reject an invalid period without querying', async () => {
    await expect(
      service.getProductReport({
        shopId: 'shop-id',
        from: '2024-01-01',
        to: '2026-01-01',
        limit: 20,
        deadStockDays: 60,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.findProductSales).not.toHaveBeenCalled();
  });
});
