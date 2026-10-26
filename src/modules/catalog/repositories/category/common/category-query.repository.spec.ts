import { Repository } from 'typeorm';
import { Category } from '../../../entities/category.entity';
import { CategoryFilters } from '../../../models/category.models';
import { CategoryQueryRepository } from './category-query.repository';

class TestCategoryQueryRepository extends CategoryQueryRepository {
  constructor(repository: Repository<Category>) {
    super(repository);
  }

  find(
    filters: CategoryFilters,
    skip: number,
    take: number,
  ): Promise<{ items: Category[]; total: number }> {
    return this.findPaginated(filters, skip, take);
  }
}

describe('CategoryQueryRepository', () => {
  let repository: TestCategoryQueryRepository;
  let typeOrmRepository: any;
  let queryBuilder: any;

  beforeEach(() => {
    queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    repository = new TestCategoryQueryRepository(typeOrmRepository);
  });

  it('should page categories by sort then creation date without filters', async () => {
    const categories = [{ id: '1' }] as Category[];
    queryBuilder.getManyAndCount.mockResolvedValue([categories, 1]);

    const result = await repository.find({}, 20, 10);

    expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'category',
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('category.sort', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'category.createdAt',
      'ASC',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(result).toEqual({ items: categories, total: 1 });
  });

  it('should filter by shop id and parent id', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    const result = await repository.find(
      { shopId: 'shop-id', parentId: 'parent-id' },
      0,
      20,
    );

    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      'category.shopId = :shopId',
      { shopId: 'shop-id' },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      'category.parentId = :parentId',
      { parentId: 'parent-id' },
    );
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('should filter by shop id only', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await repository.find({ shopId: 'shop-id' }, 0, 20);

    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.shopId = :shopId',
      { shopId: 'shop-id' },
    );
  });

  it('should filter by parent id only', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await repository.find({ parentId: 'parent-id' }, 0, 20);

    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.parentId = :parentId',
      { parentId: 'parent-id' },
    );
  });
});
