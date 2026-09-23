import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { ProductStatus } from '../../entities/enums/product.enum';
import { ProductImage } from '../../entities/product-image.entity';
import { Product } from '../../entities/product.entity';
import {
  CatalogProductSort,
  ProductSortBy,
  ProductSortOrder,
} from '../../models/product.models';
import { ProductRepository } from './product.repository';

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let typeOrmRepository: any;
  let imageRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
    };

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    imageRepository = {
      delete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRepository,
        {
          provide: getRepositoryToken(Product),
          useValue: typeOrmRepository,
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: imageRepository,
        },
      ],
    }).compile();

    repository = module.get<ProductRepository>(ProductRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find paginated products without filters', async () => {
    const products = [{ id: '1' }] as Product[];
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '1' }]);
    typeOrmRepository.find.mockResolvedValue(products);

    const result = await repository.findAllPaginated({}, 0, 20);

    expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'product',
    );
    expect(queryBuilder.distinct).toHaveBeenCalledWith(true);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'product.createdAt',
      'DESC',
    );
    expect(queryBuilder.offset).toHaveBeenCalledWith(0);
    expect(queryBuilder.limit).toHaveBeenCalledWith(20);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(typeOrmRepository.find).toHaveBeenCalledWith({
      where: { id: In(['1']) },
      relations: {
        categories: true,
        tags: true,
        attributes: true,
        images: true,
      },
      order: { images: { sort: 'ASC' } },
    });
    expect(result).toEqual({ items: products, total: 1 });
  });

  it('should sort by name ascending when requested', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findAllPaginated(
      {
        sortBy: ProductSortBy.NAME,
        sortOrder: ProductSortOrder.ASC,
      },
      0,
      20,
    );

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('product.name', 'ASC');
  });

  it('should find paginated products with all supported filters', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    const result = await repository.findAllPaginated(
      {
        shopId: 'shop-id',
        status: ProductStatus.ACTIVE,
        name: 'ocean',
        sku: 'SKU',
        categoryIds: ['category-1', 'category-2'],
        isPopular: true,
      },
      20,
      20,
    );

    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      'product.shopId = :shopId',
      { shopId: 'shop-id' },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      'product.status = :status',
      { status: ProductStatus.ACTIVE },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      3,
      'product.name ILIKE :name',
      { name: '%ocean%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      4,
      'product.sku ILIKE :sku',
      { sku: '%SKU%' },
    );
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'product.categories',
      'filteredCategory',
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      5,
      'filteredCategory.id IN (:...categoryIds)',
      { categoryIds: ['category-1', 'category-2'] },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      6,
      'product.isPopular = :isPopular',
      { isPopular: true },
    );
    expect(typeOrmRepository.find).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('should find popular products limited to the requested amount', async () => {
    const products = [{ id: '1', isPopular: true }] as Product[];
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '1' }]);
    typeOrmRepository.find.mockResolvedValue(products);

    const result = await repository.findPopular(6);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.isPopular = :isPopular',
      { isPopular: true },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.status = :status',
      { status: ProductStatus.ACTIVE },
    );
    expect(queryBuilder.offset).toHaveBeenCalledWith(0);
    expect(queryBuilder.limit).toHaveBeenCalledWith(6);
    expect(result).toEqual(products);
  });

  it('should find popular products filtered by shop id', async () => {
    const shopId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const products = [{ id: '1', isPopular: true }] as Product[];
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '1' }]);
    typeOrmRepository.find.mockResolvedValue(products);

    const result = await repository.findPopular(6, shopId);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.isPopular = :isPopular',
      { isPopular: true },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.status = :status',
      { status: ProductStatus.ACTIVE },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.shopId = :shopId',
      { shopId },
    );
    expect(result).toEqual(products);
  });

  it('should find products by category id', async () => {
    const products = [{ id: '1' }] as Product[];
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '1' }]);
    typeOrmRepository.find.mockResolvedValue(products);

    const result = await repository.findByCategoryIdPaginated(
      'category-id',
      0,
      20,
    );

    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'product.categories',
      'category',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.id = :categoryId',
      { categoryId: 'category-id' },
    );
    expect(result).toEqual({ items: products, total: 1 });
  });

  it('should find products by category id filtered by isPopular', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findByCategoryIdPaginated(
      'category-id',
      0,
      20,
      undefined,
      undefined,
      true,
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.isPopular = :isPopular',
      { isPopular: true },
    );
  });

  it('should find catalog products restricted to active status', async () => {
    const products = [{ id: '1' }] as Product[];
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '1' }]);
    typeOrmRepository.find.mockResolvedValue(products);

    const result = await repository.findCatalogPaginated(
      { categoryId: 'category-id' },
      0,
      20,
    );

    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'product.categories',
      'category',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.id = :categoryId',
      { categoryId: 'category-id' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.status = :status',
      { status: ProductStatus.ACTIVE },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'product.createdAt',
      'DESC',
    );
    expect(result).toEqual({ items: products, total: 1 });
  });

  it('should filter catalog products by availability and price range', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findCatalogPaginated(
      {
        categoryId: 'category-id',
        available: true,
        priceFrom: 60,
        priceTo: 6000,
      },
      0,
      20,
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.available = :available',
      { available: true },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('>= :priceFrom'),
      { priceFrom: 60 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('<= :priceTo'),
      { priceTo: 6000 },
    );
  });

  it('should filter catalog products by each attribute group', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findCatalogPaginated(
      {
        categoryId: 'category-id',
        attributes: [
          { name: 'color', values: ['Red', 'Blue'] },
          { name: 'screen', values: ['6'] },
        ],
      },
      0,
      20,
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining(':attributeName0'),
      { attributeName0: 'color', attributeValues0: ['Red', 'Blue'] },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining(':attributeName1'),
      { attributeName1: 'screen', attributeValues1: ['6'] },
    );
  });

  it('should sort catalog products by popularity', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findCatalogPaginated(
      { categoryId: 'category-id', sort: CatalogProductSort.POPULAR },
      0,
      20,
    );

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'product.isPopular',
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'product.createdAt',
      'DESC',
    );
  });

  it('should sort catalog products by price', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findCatalogPaginated(
      { categoryId: 'category-id', sort: CatalogProductSort.CHEAPER },
      0,
      20,
    );

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      expect.stringContaining('MIN(catalog_variation.price)'),
      'ASC',
    );

    await repository.findCatalogPaginated(
      { categoryId: 'category-id', sort: CatalogProductSort.EXPENSIVE },
      0,
      20,
    );

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      expect.stringContaining('MIN(catalog_variation.price)'),
      'DESC',
    );
  });

  it('should find products by tag id', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findByTagIdPaginated('tag-id', 0, 20);

    expect(queryBuilder.innerJoin).toHaveBeenCalledWith('product.tags', 'tag');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('tag.id = :tagId', {
      tagId: 'tag-id',
    });
  });

  it('should find products by attribute type id', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findByAttributeTypeIdPaginated('attr-id', 0, 20);

    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'product.attributes',
      'attribute',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'attribute.id = :attributeTypeId',
      { attributeTypeId: 'attr-id' },
    );
  });

  it('should preserve product order when loading relations', async () => {
    queryBuilder.getCount.mockResolvedValue(2);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '2' }, { id: '1' }]);
    typeOrmRepository.find.mockResolvedValue([
      { id: '1' },
      { id: '2' },
    ] as Product[]);

    const result = await repository.findAllPaginated({}, 0, 20);

    expect(result.items.map((item) => item.id)).toEqual(['2', '1']);
  });

  it('should skip missing products after hydration while preserving order', async () => {
    queryBuilder.getCount.mockResolvedValue(2);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '2' }, { id: '1' }]);
    typeOrmRepository.find.mockResolvedValue([{ id: '1' }] as Product[]);

    const result = await repository.findAllPaginated({}, 0, 20);

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual(['1']);
  });

  it('should find product by id with relations', async () => {
    const product = { id: '1' } as Product;
    typeOrmRepository.findOne.mockResolvedValue(product);

    const result = await repository.findById('1');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: {
        categories: true,
        tags: true,
        attributes: true,
        images: true,
        variations: {
          attributes: {
            attributeType: true,
          },
          images: true,
        },
      },
      order: {
        images: { sort: 'ASC' },
        variations: {
          createdAt: 'ASC',
          images: { sort: 'ASC' },
        },
      },
    });
    expect(result).toEqual(product);
  });

  it('should throw when product is not found by id', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return nullable product by id', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    const result = await repository.findOneById('missing');

    expect(result).toBeNull();
  });

  it('should find product by shop id and sku', async () => {
    const product = { id: '1', shopId: 'shop-id', sku: 'SKU-1' } as Product;
    typeOrmRepository.findOne.mockResolvedValue(product);

    const result = await repository.findByShopIdAndSku('shop-id', 'SKU-1');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { shopId: 'shop-id', sku: 'SKU-1' },
    });
    expect(result).toEqual(product);
  });

  it('should create product entity', () => {
    const payload = { shopId: 'shop-id', name: 'Ocean Tee' };
    const product = { id: '1', ...payload };
    typeOrmRepository.create.mockReturnValue(product);

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(product);
  });

  it('should save product entity', async () => {
    const product = { id: '1' } as Product;
    typeOrmRepository.save.mockResolvedValue(product);

    const result = await repository.save(product);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(product);
    expect(result).toEqual(product);
  });

  it('should remove product entity', async () => {
    const product = { id: '1' } as Product;
    typeOrmRepository.remove.mockResolvedValue(product);

    const result = await repository.remove(product);

    expect(typeOrmRepository.remove).toHaveBeenCalledWith(product);
    expect(result).toEqual(product);
  });

  it('should replace images for a product', async () => {
    const images = [
      { url: 'https://cdn.example.com/a.jpg', sort: 0 },
      { url: 'https://cdn.example.com/b.jpg', sort: 1 },
    ];
    const created = images.map((image) => ({
      productId: 'product-id',
      ...image,
    }));

    imageRepository.delete.mockResolvedValue(undefined);
    imageRepository.create.mockImplementation((payload) => payload);
    imageRepository.save.mockResolvedValue(created);

    const result = await repository.replaceImages('product-id', images);

    expect(imageRepository.delete).toHaveBeenCalledWith({
      productId: 'product-id',
    });
    expect(imageRepository.create).toHaveBeenCalledTimes(2);
    expect(imageRepository.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  it('should clear images when replace list is empty', async () => {
    imageRepository.delete.mockResolvedValue(undefined);

    const result = await repository.replaceImages('product-id', []);

    expect(imageRepository.delete).toHaveBeenCalledWith({
      productId: 'product-id',
    });
    expect(imageRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
