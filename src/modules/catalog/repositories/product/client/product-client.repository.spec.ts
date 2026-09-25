import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { ProductStatus } from '../../../entities/enums/product.enum';
import { Product } from '../../../entities/product.entity';
import { CatalogProductSort } from '../../../models/product.models';
import { ProductClientRepository } from './product-client.repository';

describe('ProductClientRepository', () => {
  let repository: ProductClientRepository;
  let typeOrmRepository: any;
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductClientRepository,
        {
          provide: getRepositoryToken(Product),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ProductClientRepository>(ProductClientRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find catalog products restricted to active status', async () => {
    const products = [{ id: '1' }] as Product[];
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '1' }]);
    typeOrmRepository.find.mockResolvedValue(products);

    const result = await repository.findCatalogPaginated(
      { shopId: 'shop-id', categoryId: 'category-id' },
      0,
      20,
    );

    expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'product',
    );
    expect(queryBuilder.distinct).toHaveBeenCalledWith(true);
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'product.categories',
      'category',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('category.id IN ('),
      { categoryId: 'category-id' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.shopId = :shopId',
      { shopId: 'shop-id' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.status = :status',
      { status: ProductStatus.ACTIVE },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'product.createdAt',
      'DESC',
    );
    expect(queryBuilder.offset).toHaveBeenCalledWith(0);
    expect(queryBuilder.limit).toHaveBeenCalledWith(20);
    expect(typeOrmRepository.find).toHaveBeenCalledWith({
      where: { id: In(['1']) },
      relations: {
        categories: true,
        tags: true,
        attributes: true,
        images: true,
      },
      relationLoadStrategy: 'query',
    });
    expect(result).toEqual({ items: products, total: 1 });
  });

  it('should include products of nested categories', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findCatalogPaginated(
      { shopId: 'shop-id', categoryId: 'parent-id' },
      0,
      20,
    );

    const [condition] = queryBuilder.andWhere.mock.calls.find(
      ([sql]: [string]) => sql.includes('category.id IN ('),
    );

    expect(condition).toContain('WITH RECURSIVE category_subtree');
    expect(condition).toContain('child.parent_id = parent.id');
  });

  it('should filter catalog products by availability and price range', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    const result = await repository.findCatalogPaginated(
      {
        shopId: 'shop-id',
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
    expect(typeOrmRepository.find).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('should filter catalog products by each attribute group', async () => {
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findCatalogPaginated(
      {
        shopId: 'shop-id',
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
      {
        shopId: 'shop-id',
        categoryId: 'category-id',
        sort: CatalogProductSort.POPULAR,
      },
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
      {
        shopId: 'shop-id',
        categoryId: 'category-id',
        sort: CatalogProductSort.CHEAPER,
      },
      0,
      20,
    );

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      expect.stringContaining('MIN(catalog_variation.price)'),
      'ASC',
    );

    await repository.findCatalogPaginated(
      {
        shopId: 'shop-id',
        categoryId: 'category-id',
        sort: CatalogProductSort.EXPENSIVE,
      },
      0,
      20,
    );

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      expect.stringContaining('MIN(catalog_variation.price)'),
      'DESC',
    );
  });

  it('should preserve catalog product order when loading relations', async () => {
    queryBuilder.getCount.mockResolvedValue(2);
    queryBuilder.getRawMany.mockResolvedValue([{ id: '2' }, { id: '1' }]);
    typeOrmRepository.find.mockResolvedValue([
      { id: '1' },
      { id: '2' },
    ] as Product[]);

    const result = await repository.findCatalogPaginated(
      { shopId: 'shop-id', categoryId: 'category-id' },
      0,
      20,
    );

    expect(result.items.map((item) => item.id)).toEqual(['2', '1']);
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
});
