import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CacheDescriptor,
  CacheService,
} from '../../../../../core/cache/cache.service';
import { CACHE_SCOPE_ALL } from '../../../../../core/cache/constants/cache.constants';
import { POPULAR_PRODUCTS_LIMIT } from '../../../constants/pagination.constants';
import { CatalogProductSort } from '../../../models/product.models';
import { AttributeRepository } from '../../../repositories/attribute/attribute.repository';
import { CategoryRepository } from '../../../repositories/category/admin/category.repository';
import { ProductClientRepository } from '../../../repositories/product/client/product-client.repository';
import { ProductsClientService } from './products-client.service';

describe('ProductsClientService', () => {
  let service: ProductsClientService;
  let productClientRepository: ProductClientRepository;
  let categoryRepository: CategoryRepository;
  let attributeRepository: AttributeRepository;
  let cacheService: CacheService;

  beforeEach(async () => {
    const productClientRepositoryMock = {
      findCatalogPaginated: jest.fn(),
      findPopular: jest.fn(),
    };

    const categoryRepositoryMock = {
      findById: jest.fn(),
    };

    const attributeRepositoryMock = {
      findCategoryFilterOptions: jest.fn(),
    };

    // Stands in for a permanent cache miss, so the existing expectations keep
    // describing what the repositories are asked for.
    const cacheServiceMock = {
      wrap: jest.fn(
        <TValue>(_descriptor: CacheDescriptor, load: () => Promise<TValue>) =>
          load(),
      ),
      invalidate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsClientService,
        {
          provide: ProductClientRepository,
          useValue: productClientRepositoryMock,
        },
        { provide: CategoryRepository, useValue: categoryRepositoryMock },
        { provide: AttributeRepository, useValue: attributeRepositoryMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<ProductsClientService>(ProductsClientService);
    productClientRepository = module.get<ProductClientRepository>(
      ProductClientRepository,
    );
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
    attributeRepository = module.get<AttributeRepository>(AttributeRepository);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list popular products', async () => {
    const popularProducts = [{ id: '1', isPopular: true }] as any;
    jest
      .mocked(productClientRepository.findPopular)
      .mockResolvedValue(popularProducts);

    const result = await service.listPopularProducts();

    expect(productClientRepository.findPopular).toHaveBeenCalledWith(
      POPULAR_PRODUCTS_LIMIT,
      undefined,
    );
    expect(result).toEqual(popularProducts);
  });

  it('should list popular products filtered by shop id', async () => {
    const shopId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const popularProducts = [{ id: '1', isPopular: true }] as any;
    jest
      .mocked(productClientRepository.findPopular)
      .mockResolvedValue(popularProducts);

    const result = await service.listPopularProducts(shopId);

    expect(productClientRepository.findPopular).toHaveBeenCalledWith(
      POPULAR_PRODUCTS_LIMIT,
      shopId,
    );
    expect(result).toEqual(popularProducts);
  });

  it('should list catalog products with filters, sorting and pagination', async () => {
    jest
      .mocked(productClientRepository.findCatalogPaginated)
      .mockResolvedValue({ items: [{ id: '1' }] as any, total: 1 });

    const result = await service.listCatalogProducts('category-id', {
      shopId: 'shop-id',
      page: 2,
      limit: 20,
      attributes: [
        { name: 'color', values: ['Red'] },
        { name: 'screen', values: ['6'] },
      ],
      priceFrom: 60,
      priceTo: 6000,
      available: true,
      sort: CatalogProductSort.CHEAPER,
    });

    expect(productClientRepository.findCatalogPaginated).toHaveBeenCalledWith(
      {
        shopId: 'shop-id',
        categoryId: 'category-id',
        attributes: [
          { name: 'color', values: ['Red'] },
          { name: 'screen', values: ['6'] },
        ],
        priceFrom: 60,
        priceTo: 6000,
        available: true,
        sort: CatalogProductSort.CHEAPER,
      },
      20,
      20,
    );
    expect(result).toEqual({
      items: [{ id: '1' }],
      total: 1,
      page: 2,
      limit: 20,
      totalPages: 1,
    });
  });

  it('should list catalog products without filters', async () => {
    jest
      .mocked(productClientRepository.findCatalogPaginated)
      .mockResolvedValue({ items: [], total: 0 });

    const result = await service.listCatalogProducts('category-id', {
      shopId: 'shop-id',
      page: 1,
      limit: 20,
    });

    expect(productClientRepository.findCatalogPaginated).toHaveBeenCalledWith(
      {
        shopId: 'shop-id',
        categoryId: 'category-id',
        attributes: undefined,
        priceFrom: undefined,
        priceTo: undefined,
        available: undefined,
        sort: undefined,
      },
      0,
      20,
    );
    expect(result.totalPages).toBe(0);
  });

  it('should reject catalog price range when priceFrom is greater than priceTo', async () => {
    await expect(
      service.listCatalogProducts('category-id', {
        shopId: 'shop-id',
        page: 1,
        limit: 20,
        priceFrom: 6000,
        priceTo: 60,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(productClientRepository.findCatalogPaginated).not.toHaveBeenCalled();
  });

  it('should return an empty page for an unknown category without looking it up', async () => {
    jest
      .mocked(productClientRepository.findCatalogPaginated)
      .mockResolvedValue({ items: [], total: 0 });

    const result = await service.listCatalogProducts('missing-id', {
      shopId: 'shop-id',
      page: 1,
      limit: 20,
    });

    expect(categoryRepository.findById).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should group category filters by attribute name', async () => {
    const categoryId = '11111111-1111-4111-8111-111111111111';
    jest
      .mocked(categoryRepository.findById)
      .mockResolvedValue({ shopId: 'shop-id' } as any);
    jest
      .mocked(attributeRepository.findCategoryFilterOptions)
      .mockResolvedValue([
        { name: 'Color', value: 'Blue' },
        { name: 'Color', value: 'Red' },
        { name: 'Size', value: 'M' },
      ]);

    const result = await service.getFiltersByCategoryId(categoryId, 'shop-id');

    expect(categoryRepository.findById).toHaveBeenCalledWith(categoryId);
    expect(attributeRepository.findCategoryFilterOptions).toHaveBeenCalledWith(
      categoryId,
    );
    expect(result).toEqual([
      { name: 'Color', values: ['Blue', 'Red'] },
      { name: 'Size', values: ['M'] },
    ]);
  });

  it('should return no filters when category has no attribute options', async () => {
    jest
      .mocked(categoryRepository.findById)
      .mockResolvedValue({ shopId: 'shop-id' } as any);
    jest
      .mocked(attributeRepository.findCategoryFilterOptions)
      .mockResolvedValue([]);

    const result = await service.getFiltersByCategoryId(
      'category-id',
      'shop-id',
    );

    expect(result).toEqual([]);
  });

  it('should reject category filters when the category belongs to another shop', async () => {
    jest
      .mocked(categoryRepository.findById)
      .mockResolvedValue({ shopId: 'other-shop-id' } as any);

    await expect(
      service.getFiltersByCategoryId('category-id', 'shop-id'),
    ).rejects.toThrow(NotFoundException);

    expect(
      attributeRepository.findCategoryFilterOptions,
    ).not.toHaveBeenCalled();
  });

  it('should cache popular products under the shop scope', async () => {
    jest.mocked(productClientRepository.findPopular).mockResolvedValue([]);

    await service.listPopularProducts('shop-id');

    expect(cacheService.wrap).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'shop-id',
        segments: ['popular', 'shop-id'],
      }),
      expect.any(Function),
    );
  });

  it('should cache popular products of all shops under the cross-shop scope', async () => {
    jest.mocked(productClientRepository.findPopular).mockResolvedValue([]);

    await service.listPopularProducts();

    expect(cacheService.wrap).toHaveBeenCalledWith(
      expect.objectContaining({ scope: CACHE_SCOPE_ALL }),
      expect.any(Function),
    );
  });

  it('should cache category filters under the shop scope', async () => {
    jest
      .mocked(categoryRepository.findById)
      .mockResolvedValue({ shopId: 'shop-id' } as any);
    jest
      .mocked(attributeRepository.findCategoryFilterOptions)
      .mockResolvedValue([]);

    await service.getFiltersByCategoryId('category-id', 'shop-id');

    expect(cacheService.wrap).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'shop-id',
        segments: ['filters', 'category-id'],
      }),
      expect.any(Function),
    );
  });

  it('should reuse one catalog cache key for equivalent attribute filters', async () => {
    jest
      .mocked(productClientRepository.findCatalogPaginated)
      .mockResolvedValue({ items: [], total: 0 });

    await service.listCatalogProducts('category-id', {
      shopId: 'shop-id',
      page: 1,
      limit: 20,
      attributes: [
        { name: 'screen', values: ['6'] },
        { name: 'color', values: ['Red', 'Blue'] },
      ],
    });

    await service.listCatalogProducts('category-id', {
      shopId: 'shop-id',
      page: 1,
      limit: 20,
      attributes: [
        { name: 'color', values: ['Blue', 'Red'] },
        { name: 'screen', values: ['6'] },
      ],
    });

    const [first, second] = jest
      .mocked(cacheService.wrap)
      .mock.calls.map(([descriptor]) => descriptor.segments);

    expect(first).toEqual(second);
  });

  it('should cache different catalog pages under different keys', async () => {
    jest
      .mocked(productClientRepository.findCatalogPaginated)
      .mockResolvedValue({ items: [], total: 0 });

    await service.listCatalogProducts('category-id', {
      shopId: 'shop-id',
      page: 1,
      limit: 20,
    });

    await service.listCatalogProducts('category-id', {
      shopId: 'shop-id',
      page: 2,
      limit: 20,
    });

    const [first, second] = jest
      .mocked(cacheService.wrap)
      .mock.calls.map(([descriptor]) => descriptor.segments);

    expect(first).not.toEqual(second);
  });
});
