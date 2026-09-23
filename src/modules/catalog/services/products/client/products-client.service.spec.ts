import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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

  beforeEach(async () => {
    const productClientRepositoryMock = {
      findCatalogPaginated: jest.fn(),
    };

    const categoryRepositoryMock = {
      findById: jest.fn(),
    };

    const attributeRepositoryMock = {
      findCategoryFilterOptions: jest.fn(),
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
      ],
    }).compile();

    service = module.get<ProductsClientService>(ProductsClientService);
    productClientRepository = module.get<ProductClientRepository>(
      ProductClientRepository,
    );
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
    attributeRepository = module.get<AttributeRepository>(AttributeRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list catalog products with filters, sorting and pagination', async () => {
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: 'category-id',
    } as any);
    jest
      .mocked(productClientRepository.findCatalogPaginated)
      .mockResolvedValue({ items: [{ id: '1' }] as any, total: 1 });

    const result = await service.listCatalogProducts('category-id', {
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

    expect(categoryRepository.findById).toHaveBeenCalledWith('category-id');
    expect(productClientRepository.findCatalogPaginated).toHaveBeenCalledWith(
      {
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
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: 'category-id',
    } as any);
    jest
      .mocked(productClientRepository.findCatalogPaginated)
      .mockResolvedValue({ items: [], total: 0 });

    const result = await service.listCatalogProducts('category-id', {
      page: 1,
      limit: 20,
    });

    expect(productClientRepository.findCatalogPaginated).toHaveBeenCalledWith(
      {
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
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: 'category-id',
    } as any);

    await expect(
      service.listCatalogProducts('category-id', {
        page: 1,
        limit: 20,
        priceFrom: 6000,
        priceTo: 60,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(productClientRepository.findCatalogPaginated).not.toHaveBeenCalled();
  });

  it('should bubble up not found when category is missing', async () => {
    jest
      .mocked(categoryRepository.findById)
      .mockRejectedValue(new Error('Категорію не знайдено'));

    await expect(
      service.listCatalogProducts('missing-id', { page: 1, limit: 20 }),
    ).rejects.toThrow('Категорію не знайдено');

    expect(productClientRepository.findCatalogPaginated).not.toHaveBeenCalled();
  });

  it('should group category filters by attribute name', async () => {
    const categoryId = '11111111-1111-4111-8111-111111111111';
    jest.mocked(categoryRepository.findById).mockResolvedValue({} as any);
    jest
      .mocked(attributeRepository.findCategoryFilterOptions)
      .mockResolvedValue([
        { name: 'Color', value: 'Blue' },
        { name: 'Color', value: 'Red' },
        { name: 'Size', value: 'M' },
      ]);

    const result = await service.getFiltersByCategoryId(categoryId);

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
    jest.mocked(categoryRepository.findById).mockResolvedValue({} as any);
    jest
      .mocked(attributeRepository.findCategoryFilterOptions)
      .mockResolvedValue([]);

    const result = await service.getFiltersByCategoryId('category-id');

    expect(result).toEqual([]);
  });
});
