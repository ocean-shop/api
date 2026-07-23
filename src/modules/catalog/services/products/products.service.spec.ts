import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { ProductSortBy, ProductSortOrder } from '../../models/product.models';
import { ProductStatus, ProductType } from '../../entities/enums/product.enum';
import { AttributeRepository } from '../../repositories/attribute/attribute.repository';
import { CategoryRepository } from '../../repositories/category/category.repository';
import { ProductRepository } from '../../repositories/product/product.repository';
import { ShopRepository } from '../../repositories/shop/shop.repository';
import { TagRepository } from '../../repositories/tag/tag.repository';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: ProductRepository;
  let shopRepository: ShopRepository;
  let categoryRepository: CategoryRepository;
  let tagRepository: TagRepository;
  let attributeRepository: AttributeRepository;

  beforeEach(async () => {
    const productRepositoryMock = {
      findAllPaginated: jest.fn(),
      findByCategoryIdPaginated: jest.fn(),
      findByTagIdPaginated: jest.fn(),
      findByAttributeTypeIdPaginated: jest.fn(),
      findById: jest.fn(),
      findByShopIdAndSku: jest.fn(),
      create: jest.fn(),
      save: jest.fn((product) => Promise.resolve(product)),
      remove: jest.fn(),
      replaceImages: jest.fn(),
    };

    const shopRepositoryMock = {
      findById: jest.fn(),
    };

    const categoryRepositoryMock = {
      findById: jest.fn(),
    };

    const tagRepositoryMock = {
      findById: jest.fn(),
    };

    const attributeRepositoryMock = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductRepository, useValue: productRepositoryMock },
        { provide: ShopRepository, useValue: shopRepositoryMock },
        { provide: CategoryRepository, useValue: categoryRepositoryMock },
        { provide: TagRepository, useValue: tagRepositoryMock },
        { provide: AttributeRepository, useValue: attributeRepositoryMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<ProductRepository>(ProductRepository);
    shopRepository = module.get<ShopRepository>(ShopRepository);
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
    tagRepository = module.get<TagRepository>(TagRepository);
    attributeRepository = module.get<AttributeRepository>(AttributeRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list products with pagination', async () => {
    jest.mocked(productRepository.findAllPaginated).mockResolvedValue({
      items: [{ id: '1' }] as any,
      total: 1,
    });

    const result = await service.listProducts({
      page: 1,
      limit: 20,
      name: 'ocean',
      sku: 'SKU',
      categoryIds: ['11111111-1111-4111-8111-111111111111'],
      status: ProductStatus.ACTIVE,
      sortBy: ProductSortBy.CREATED_AT,
      sortOrder: ProductSortOrder.DESC,
    });

    expect(productRepository.findAllPaginated).toHaveBeenCalledWith(
      {
        shopId: undefined,
        status: ProductStatus.ACTIVE,
        name: 'ocean',
        sku: 'SKU',
        categoryIds: ['11111111-1111-4111-8111-111111111111'],
        sortBy: ProductSortBy.CREATED_AT,
        sortOrder: ProductSortOrder.DESC,
      },
      0,
      20,
    );
    expect(result.totalPages).toBe(1);
  });

  it('should list products by category id', async () => {
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: 'category-id',
    } as any);
    jest
      .mocked(productRepository.findByCategoryIdPaginated)
      .mockResolvedValue({ items: [], total: 0 });

    const result = await service.listProductsByCategoryId('category-id', {
      page: 1,
      limit: 20,
    });

    expect(categoryRepository.findById).toHaveBeenCalledWith('category-id');
    expect(productRepository.findByCategoryIdPaginated).toHaveBeenCalledWith(
      'category-id',
      0,
      20,
      undefined,
      undefined,
    );
    expect(result.total).toBe(0);
  });

  it('should list products by tag id', async () => {
    jest
      .mocked(tagRepository.findById)
      .mockResolvedValue({ id: 'tag-id' } as any);
    jest
      .mocked(productRepository.findByTagIdPaginated)
      .mockResolvedValue({ items: [{ id: '1' }] as any, total: 1 });

    const result = await service.listProductsByTagId('tag-id', {
      page: 2,
      limit: 10,
    });

    expect(productRepository.findByTagIdPaginated).toHaveBeenCalledWith(
      'tag-id',
      10,
      10,
      undefined,
      undefined,
    );
    expect(result.page).toBe(2);
  });

  it('should list products by attribute type id', async () => {
    jest.mocked(attributeRepository.findById).mockResolvedValue({
      id: 'attr-id',
    } as any);
    jest
      .mocked(productRepository.findByAttributeTypeIdPaginated)
      .mockResolvedValue({ items: [], total: 0 });

    await service.listProductsByAttributeTypeId('attr-id', {
      page: 1,
      limit: 20,
    });

    expect(
      productRepository.findByAttributeTypeIdPaginated,
    ).toHaveBeenCalledWith('attr-id', 0, 20, undefined, undefined);
  });

  it('should return one product', async () => {
    const product = { id: '1', name: 'Ocean Tee' } as any;
    jest.mocked(productRepository.findById).mockResolvedValue(product);

    const result = await service.getProductById('1');

    expect(productRepository.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(product);
  });

  it('should create product', async () => {
    const payload = {
      id: '1',
      shopId: 'shop-id',
      name: 'Ocean Tee',
      price: '19.99',
      oldPrice: null,
    } as any;

    jest.mocked(shopRepository.findById).mockResolvedValue({
      id: 'shop-id',
    } as any);
    jest.mocked(productRepository.create).mockReturnValue(payload);
    jest.mocked(productRepository.save).mockResolvedValue(payload);
    jest.mocked(productRepository.findById).mockResolvedValue(payload);

    const result = await service.createProduct({
      shopId: 'shop-id',
      name: 'Ocean Tee',
      price: 19.99,
    });

    expect(productRepository.create).toHaveBeenCalledWith({
      shopId: 'shop-id',
      type: ProductType.SIMPLE,
      name: 'Ocean Tee',
      description: null,
      landing: null,
      status: ProductStatus.DRAFT,
      available: true,
      sku: null,
      price: '19.99',
      oldPrice: null,
    });
    expect(result).toEqual(payload);
  });

  it('should throw when oldPrice is less than price on create', async () => {
    jest.mocked(shopRepository.findById).mockResolvedValue({
      id: 'shop-id',
    } as any);

    await expect(
      service.createProduct({
        shopId: 'shop-id',
        name: 'Ocean Tee',
        price: 20,
        oldPrice: 10,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when SKU already exists in shop on create', async () => {
    jest.mocked(shopRepository.findById).mockResolvedValue({
      id: 'shop-id',
    } as any);
    jest.mocked(productRepository.findByShopIdAndSku).mockResolvedValue({
      id: 'existing-id',
      sku: 'SKU-1',
    } as any);

    await expect(
      service.createProduct({
        shopId: 'shop-id',
        name: 'Ocean Tee',
        sku: 'SKU-1',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(productRepository.findByShopIdAndSku).toHaveBeenCalledWith(
      'shop-id',
      'SKU-1',
    );
  });

  it('should map unique SKU constraint errors on create', async () => {
    jest.mocked(shopRepository.findById).mockResolvedValue({
      id: 'shop-id',
    } as any);
    jest.mocked(productRepository.findByShopIdAndSku).mockResolvedValue(null);
    jest.mocked(productRepository.create).mockReturnValue({ id: '1' } as any);
    jest.mocked(productRepository.save).mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO products',
        [],
        Object.assign(new Error(), {
          code: '23505',
          constraint: 'uq_products_shop_sku',
        }),
      ),
    );

    await expect(
      service.createProduct({
        shopId: 'shop-id',
        name: 'Ocean Tee',
        sku: 'SKU-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should map check constraint errors on create', async () => {
    jest.mocked(shopRepository.findById).mockResolvedValue({
      id: 'shop-id',
    } as any);
    jest.mocked(productRepository.create).mockReturnValue({ id: '1' } as any);
    jest.mocked(productRepository.save).mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO products',
        [],
        Object.assign(new Error(), {
          code: '23514',
          constraint: 'products_old_price_gte_price_check',
        }),
      ),
    );

    await expect(
      service.createProduct({
        shopId: 'shop-id',
        name: 'Ocean Tee',
        price: 10,
        oldPrice: 20,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update a product', async () => {
    const existing = {
      id: '1',
      shopId: 'shop-id',
      name: 'Ocean Tee',
      price: '10.00',
      oldPrice: null,
      status: ProductStatus.DRAFT,
    } as any;
    const updated = {
      ...existing,
      name: 'Updated Tee',
      price: '12.00',
      status: ProductStatus.ACTIVE,
    };

    jest.mocked(productRepository.findById).mockResolvedValueOnce(existing);
    jest.mocked(productRepository.save).mockResolvedValue(updated);
    jest.mocked(productRepository.findById).mockResolvedValueOnce(updated);

    const result = await service.updateProduct('1', {
      name: 'Updated Tee',
      price: 12,
      status: ProductStatus.ACTIVE,
    });

    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Tee',
        price: '12.00',
        status: ProductStatus.ACTIVE,
      }),
    );
    expect(result).toEqual(updated);
  });

  it('should throw when oldPrice is less than price on update', async () => {
    jest.mocked(productRepository.findById).mockResolvedValue({
      id: '1',
      price: '20.00',
      oldPrice: null,
    } as any);

    await expect(service.updateProduct('1', { oldPrice: 10 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when SKU already exists in shop on update', async () => {
    jest.mocked(productRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
      sku: 'SKU-OLD',
      price: '10.00',
      oldPrice: null,
    } as any);
    jest.mocked(productRepository.findByShopIdAndSku).mockResolvedValue({
      id: '2',
      sku: 'SKU-1',
    } as any);

    await expect(service.updateProduct('1', { sku: 'SKU-1' })).rejects.toThrow(
      BadRequestException,
    );
    expect(productRepository.findByShopIdAndSku).toHaveBeenCalledWith(
      'shop-id',
      'SKU-1',
    );
  });

  it('should allow clearing SKU on update', async () => {
    const existing = {
      id: '1',
      shopId: 'shop-id',
      sku: 'SKU-1',
      price: '10.00',
      oldPrice: null,
    } as any;
    const updated = { ...existing, sku: null };

    jest.mocked(productRepository.findById).mockResolvedValueOnce(existing);
    jest.mocked(productRepository.save).mockResolvedValue(updated);
    jest.mocked(productRepository.findById).mockResolvedValueOnce(updated);

    const result = await service.updateProduct('1', { sku: null });

    expect(productRepository.findByShopIdAndSku).not.toHaveBeenCalled();
    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ sku: null }),
    );
    expect(result).toEqual(updated);
  });

  it('should remove a product', async () => {
    const product = { id: '1', name: 'Ocean Tee' } as any;
    jest.mocked(productRepository.findById).mockResolvedValue(product);
    jest.mocked(productRepository.remove).mockResolvedValue(product);

    const result = await service.removeProduct('1');

    expect(productRepository.remove).toHaveBeenCalledWith(product);
    expect(result).toEqual({ message: 'Product removed successfully' });
  });

  it('should assign category when shops match', async () => {
    const product = {
      id: '1',
      shopId: 'shop-id',
      categories: [],
      tags: [],
      attributes: [],
      images: [],
    } as any;
    const category = { id: 'category-id', shopId: 'shop-id' } as any;
    const withCategory = { ...product, categories: [category] };

    jest.mocked(productRepository.findById).mockResolvedValueOnce(product);
    jest.mocked(categoryRepository.findById).mockResolvedValue(category);
    jest.mocked(productRepository.save).mockResolvedValue(withCategory);
    jest.mocked(productRepository.findById).mockResolvedValueOnce(withCategory);

    const result = await service.assignCategory('1', {
      categoryId: 'category-id',
      assign: true,
    });

    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [category],
      }),
    );
    expect(result).toEqual(withCategory);
  });

  it('should not save when category is already assigned', async () => {
    const category = { id: 'category-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      categories: [category],
    } as any;

    jest.mocked(productRepository.findById).mockResolvedValue(product);
    jest.mocked(categoryRepository.findById).mockResolvedValue(category);

    await service.assignCategory('1', {
      categoryId: 'category-id',
      assign: true,
    });

    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('should remove category when assign is false and category is assigned', async () => {
    const category = { id: 'category-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      categories: [category],
    } as any;
    const withoutCategory = { ...product, categories: [] };

    jest.mocked(productRepository.findById).mockResolvedValueOnce(product);
    jest.mocked(categoryRepository.findById).mockResolvedValue(category);
    jest.mocked(productRepository.save).mockResolvedValue(withoutCategory);
    jest
      .mocked(productRepository.findById)
      .mockResolvedValueOnce(withoutCategory);

    const result = await service.assignCategory('1', {
      categoryId: 'category-id',
      assign: false,
    });

    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [],
      }),
    );
    expect(result).toEqual(withoutCategory);
  });

  it('should not save when assign is false and category is not assigned', async () => {
    const category = { id: 'category-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      categories: [],
    } as any;

    jest.mocked(productRepository.findById).mockResolvedValue(product);
    jest.mocked(categoryRepository.findById).mockResolvedValue(category);

    await service.assignCategory('1', {
      categoryId: 'category-id',
      assign: false,
    });

    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when category belongs to another shop', async () => {
    jest.mocked(productRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
      categories: [],
    } as any);
    jest.mocked(categoryRepository.findById).mockResolvedValue({
      id: 'category-id',
      shopId: 'other-shop',
    } as any);

    await expect(
      service.assignCategory('1', { categoryId: 'category-id', assign: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should assign tag when shops match', async () => {
    const product = {
      id: '1',
      shopId: 'shop-id',
      tags: [],
    } as any;
    const tag = { id: 'tag-id', shopId: 'shop-id' } as any;
    const withTag = { ...product, tags: [tag] };

    jest.mocked(productRepository.findById).mockResolvedValueOnce(product);
    jest.mocked(tagRepository.findById).mockResolvedValue(tag);
    jest.mocked(productRepository.save).mockResolvedValue(withTag);
    jest.mocked(productRepository.findById).mockResolvedValueOnce(withTag);

    const result = await service.assignTag('1', {
      tagId: 'tag-id',
      assign: true,
    });

    expect(result).toEqual(withTag);
  });

  it('should not save when tag is already assigned', async () => {
    const tag = { id: 'tag-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      tags: [tag],
    } as any;

    jest.mocked(productRepository.findById).mockResolvedValue(product);
    jest.mocked(tagRepository.findById).mockResolvedValue(tag);

    await service.assignTag('1', { tagId: 'tag-id', assign: true });

    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('should remove tag when assign is false and tag is assigned', async () => {
    const tag = { id: 'tag-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      tags: [tag],
    } as any;
    const withoutTag = { ...product, tags: [] };

    jest.mocked(productRepository.findById).mockResolvedValueOnce(product);
    jest.mocked(tagRepository.findById).mockResolvedValue(tag);
    jest.mocked(productRepository.save).mockResolvedValue(withoutTag);
    jest.mocked(productRepository.findById).mockResolvedValueOnce(withoutTag);

    const result = await service.assignTag('1', {
      tagId: 'tag-id',
      assign: false,
    });

    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: [],
      }),
    );
    expect(result).toEqual(withoutTag);
  });

  it('should not save when assign is false and tag is not assigned', async () => {
    const tag = { id: 'tag-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      tags: [],
    } as any;

    jest.mocked(productRepository.findById).mockResolvedValue(product);
    jest.mocked(tagRepository.findById).mockResolvedValue(tag);

    await service.assignTag('1', { tagId: 'tag-id', assign: false });

    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when tag belongs to another shop', async () => {
    jest.mocked(productRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
      tags: [],
    } as any);
    jest.mocked(tagRepository.findById).mockResolvedValue({
      id: 'tag-id',
      shopId: 'other-shop',
    } as any);

    await expect(
      service.assignTag('1', { tagId: 'tag-id', assign: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should assign attribute when shops match', async () => {
    const product = {
      id: '1',
      shopId: 'shop-id',
      attributes: [],
    } as any;
    const attribute = { id: 'attr-id', shopId: 'shop-id' } as any;
    const withAttribute = { ...product, attributes: [attribute] };

    jest.mocked(productRepository.findById).mockResolvedValueOnce(product);
    jest.mocked(attributeRepository.findById).mockResolvedValue(attribute);
    jest.mocked(productRepository.save).mockResolvedValue(withAttribute);
    jest
      .mocked(productRepository.findById)
      .mockResolvedValueOnce(withAttribute);

    const result = await service.assignAttribute('1', {
      attributeTypeId: 'attr-id',
      assign: true,
    });

    expect(result).toEqual(withAttribute);
  });

  it('should not save when attribute is already assigned', async () => {
    const attribute = { id: 'attr-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      attributes: [attribute],
    } as any;

    jest.mocked(productRepository.findById).mockResolvedValue(product);
    jest.mocked(attributeRepository.findById).mockResolvedValue(attribute);

    await service.assignAttribute('1', {
      attributeTypeId: 'attr-id',
      assign: true,
    });

    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('should remove attribute when assign is false and attribute is assigned', async () => {
    const attribute = { id: 'attr-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      attributes: [attribute],
    } as any;
    const withoutAttribute = { ...product, attributes: [] };

    jest.mocked(productRepository.findById).mockResolvedValueOnce(product);
    jest.mocked(attributeRepository.findById).mockResolvedValue(attribute);
    jest.mocked(productRepository.save).mockResolvedValue(withoutAttribute);
    jest
      .mocked(productRepository.findById)
      .mockResolvedValueOnce(withoutAttribute);

    const result = await service.assignAttribute('1', {
      attributeTypeId: 'attr-id',
      assign: false,
    });

    expect(productRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: [],
      }),
    );
    expect(result).toEqual(withoutAttribute);
  });

  it('should not save when assign is false and attribute is not assigned', async () => {
    const attribute = { id: 'attr-id', shopId: 'shop-id' } as any;
    const product = {
      id: '1',
      shopId: 'shop-id',
      attributes: [],
    } as any;

    jest.mocked(productRepository.findById).mockResolvedValue(product);
    jest.mocked(attributeRepository.findById).mockResolvedValue(attribute);

    await service.assignAttribute('1', {
      attributeTypeId: 'attr-id',
      assign: false,
    });

    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when attribute belongs to another shop', async () => {
    jest.mocked(productRepository.findById).mockResolvedValue({
      id: '1',
      shopId: 'shop-id',
      attributes: [],
    } as any);
    jest.mocked(attributeRepository.findById).mockResolvedValue({
      id: 'attr-id',
      shopId: 'other-shop',
    } as any);

    await expect(
      service.assignAttribute('1', {
        attributeTypeId: 'attr-id',
        assign: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should replace images for a product', async () => {
    const product = { id: '1', images: [] } as any;
    const withImages = {
      id: '1',
      images: [{ url: 'https://cdn.example.com/a.jpg', sort: 0 }],
    } as any;

    jest.mocked(productRepository.findById).mockResolvedValueOnce(product);
    jest.mocked(productRepository.findById).mockResolvedValueOnce(withImages);

    const result = await service.assignImages('1', {
      images: [{ url: 'https://cdn.example.com/a.jpg' }],
    });

    expect(productRepository.replaceImages).toHaveBeenCalledWith('1', [
      { url: 'https://cdn.example.com/a.jpg', sort: 0 },
    ]);
    expect(result).toEqual(withImages);
  });
});
