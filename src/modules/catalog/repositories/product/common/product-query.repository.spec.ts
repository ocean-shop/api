import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../../../entities/product.entity';
import {
  ProductOrdering,
  ProductSortBy,
  ProductSortOrder,
} from '../../../models/product.models';
import { ProductQueryRepository } from './product-query.repository';

class TestProductQueryRepository extends ProductQueryRepository {
  constructor(repository: Repository<Product>) {
    super(repository);
  }

  findPaginated(
    applyFilters: (query: SelectQueryBuilder<Product>) => void,
    skip: number,
    take: number,
    orderings?: ProductOrdering[],
  ): Promise<{ items: Product[]; total: number }> {
    return this.findPaginatedWithRelations(applyFilters, skip, take, orderings);
  }

  buildBaseQuery(): SelectQueryBuilder<Product> {
    return this.buildBasePaginatedQuery();
  }

  countResults(query: SelectQueryBuilder<Product>): Promise<number> {
    return this.countPaginatedResults(query);
  }

  findIds(
    query: SelectQueryBuilder<Product>,
    skip: number,
    take: number,
    orderings?: ProductOrdering[],
  ): Promise<string[]> {
    return this.findPageIds(query, skip, take, orderings);
  }

  resolveSort(
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): ProductOrdering[] {
    return this.resolveSortOptions(sortBy, sortOrder);
  }

  findInOrder(ids: string[]): Promise<Product[]> {
    return this.findProductsWithRelationsInOrder(ids);
  }
}

function createQueryBuilderMock(): any {
  return {
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
    clone: jest.fn(),
  };
}

describe('ProductQueryRepository', () => {
  let repository: TestProductQueryRepository;
  let typeOrmRepository: any;
  let baseQueryBuilder: any;
  let clonedQueryBuilder: any;

  beforeEach(() => {
    baseQueryBuilder = createQueryBuilderMock();
    clonedQueryBuilder = createQueryBuilderMock();
    baseQueryBuilder.clone.mockReturnValue(clonedQueryBuilder);
    clonedQueryBuilder.clone.mockReturnValue(clonedQueryBuilder);

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(baseQueryBuilder),
      find: jest.fn(),
    };

    repository = new TestProductQueryRepository(typeOrmRepository);
  });

  describe('buildBasePaginatedQuery', () => {
    it('should create a distinct query aliased as product', () => {
      const query = repository.buildBaseQuery();

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'product',
      );
      expect(baseQueryBuilder.distinct).toHaveBeenCalledWith(true);
      expect(query).toBe(baseQueryBuilder);
    });
  });

  describe('countPaginatedResults', () => {
    it('should count on a clone and leave the source query untouched', async () => {
      clonedQueryBuilder.getCount.mockResolvedValue(7);

      const total = await repository.countResults(baseQueryBuilder);

      expect(baseQueryBuilder.clone).toHaveBeenCalled();
      expect(clonedQueryBuilder.getCount).toHaveBeenCalled();
      expect(baseQueryBuilder.getCount).not.toHaveBeenCalled();
      expect(total).toBe(7);
    });
  });

  describe('findPageIds', () => {
    it('should select ids with the default ordering when none is provided', async () => {
      clonedQueryBuilder.getRawMany.mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ]);

      const ids = await repository.findIds(baseQueryBuilder, 20, 10);

      expect(clonedQueryBuilder.select).toHaveBeenCalledWith(
        'product.id',
        'id',
      );
      expect(clonedQueryBuilder.addSelect).toHaveBeenCalledWith(
        'product.createdAt',
        'sortValue0',
      );
      expect(clonedQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.createdAt',
        'DESC',
      );
      expect(clonedQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'product.id',
        'ASC',
      );
      expect(clonedQueryBuilder.offset).toHaveBeenCalledWith(20);
      expect(clonedQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(baseQueryBuilder.select).not.toHaveBeenCalled();
      expect(ids).toEqual(['1', '2']);
    });

    it('should apply the first ordering with orderBy and the rest with addOrderBy', async () => {
      clonedQueryBuilder.getRawMany.mockResolvedValue([]);

      await repository.findIds(baseQueryBuilder, 0, 20, [
        { expression: 'product.isPopular', direction: 'DESC' },
        { expression: 'product.createdAt', direction: 'ASC' },
      ]);

      expect(clonedQueryBuilder.addSelect).toHaveBeenNthCalledWith(
        1,
        'product.isPopular',
        'sortValue0',
      );
      expect(clonedQueryBuilder.addSelect).toHaveBeenNthCalledWith(
        2,
        'product.createdAt',
        'sortValue1',
      );
      expect(clonedQueryBuilder.orderBy).toHaveBeenCalledTimes(1);
      expect(clonedQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.isPopular',
        'DESC',
      );
      expect(clonedQueryBuilder.addOrderBy).toHaveBeenNthCalledWith(
        1,
        'product.createdAt',
        'ASC',
      );
      expect(clonedQueryBuilder.addOrderBy).toHaveBeenNthCalledWith(
        2,
        'product.id',
        'ASC',
      );
    });

    it('should return an empty list when the page has no rows', async () => {
      clonedQueryBuilder.getRawMany.mockResolvedValue([]);

      const ids = await repository.findIds(baseQueryBuilder, 0, 20);

      expect(ids).toEqual([]);
    });
  });

  describe('resolveSortOptions', () => {
    it('should default to newest first', () => {
      expect(repository.resolveSort()).toEqual([
        { expression: 'product.createdAt', direction: 'DESC' },
      ]);
    });

    it('should sort by name ascending when requested', () => {
      expect(
        repository.resolveSort(ProductSortBy.NAME, ProductSortOrder.ASC),
      ).toEqual([{ expression: 'product.name', direction: 'ASC' }]);
    });

    it('should sort by name descending when requested', () => {
      expect(
        repository.resolveSort(ProductSortBy.NAME, ProductSortOrder.DESC),
      ).toEqual([{ expression: 'product.name', direction: 'DESC' }]);
    });

    it('should keep createdAt when only the sort order is provided', () => {
      expect(repository.resolveSort(undefined, ProductSortOrder.ASC)).toEqual([
        { expression: 'product.createdAt', direction: 'ASC' },
      ]);
    });
  });

  describe('findProductsWithRelationsInOrder', () => {
    it('should load relations and preserve the requested id order', async () => {
      typeOrmRepository.find.mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ] as Product[]);

      const items = await repository.findInOrder(['2', '1']);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { id: In(['2', '1']) },
        relations: {
          categories: true,
          tags: true,
          attributes: true,
          images: true,
        },
        relationLoadStrategy: 'query',
      });
      expect(items.map((item) => item.id)).toEqual(['2', '1']);
    });

    it('should sort product images by their sort value', async () => {
      typeOrmRepository.find.mockResolvedValue([
        {
          id: '1',
          images: [
            { id: 'b', sort: 2 },
            { id: 'a', sort: 1 },
          ],
        },
      ] as Product[]);

      const items = await repository.findInOrder(['1']);

      expect(items[0].images.map((image) => image.id)).toEqual(['a', 'b']);
    });

    it('should tolerate products loaded without images', async () => {
      typeOrmRepository.find.mockResolvedValue([{ id: '1' }] as Product[]);

      await expect(repository.findInOrder(['1'])).resolves.toEqual([
        { id: '1' },
      ]);
    });

    it('should skip ids that no longer resolve to a product', async () => {
      typeOrmRepository.find.mockResolvedValue([{ id: '1' }] as Product[]);

      const items = await repository.findInOrder(['2', '1']);

      expect(items.map((item) => item.id)).toEqual(['1']);
    });
  });

  describe('findPaginatedWithRelations', () => {
    it('should apply the filters callback to the base query and hydrate the page', async () => {
      const products = [{ id: '1' }] as Product[];
      clonedQueryBuilder.getCount.mockResolvedValue(1);
      clonedQueryBuilder.getRawMany.mockResolvedValue([{ id: '1' }]);
      typeOrmRepository.find.mockResolvedValue(products);

      const applyFilters = jest.fn((query: SelectQueryBuilder<Product>) => {
        query.andWhere('product.shopId = :shopId', { shopId: 'shop-id' });
      });

      const result = await repository.findPaginated(applyFilters, 0, 20);

      expect(applyFilters).toHaveBeenCalledWith(baseQueryBuilder);
      expect(baseQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.shopId = :shopId',
        { shopId: 'shop-id' },
      );
      expect(result).toEqual({ items: products, total: 1 });
    });

    it('should return the total without hydrating when the page is empty', async () => {
      clonedQueryBuilder.getCount.mockResolvedValue(5);
      clonedQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await repository.findPaginated(() => {}, 100, 20);

      expect(typeOrmRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual({ items: [], total: 5 });
    });

    it('should forward explicit orderings to the page query', async () => {
      clonedQueryBuilder.getCount.mockResolvedValue(0);
      clonedQueryBuilder.getRawMany.mockResolvedValue([]);

      await repository.findPaginated(() => {}, 0, 20, [
        { expression: 'product.name', direction: 'ASC' },
      ]);

      expect(clonedQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.name',
        'ASC',
      );
    });
  });
});
