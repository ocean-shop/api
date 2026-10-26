import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SEARCH_MATCHED_CATEGORY_CONDITION } from '../../../constants/product-query.constants';
import { Category } from '../../../entities/category.entity';
import { ProductStatus } from '../../../entities/enums/product.enum';
import { CategoryClientRepository } from './category-client.repository';

describe('CategoryClientRepository', () => {
  let repository: CategoryClientRepository;
  let typeOrmRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getRawMany: jest.fn(),
    };

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryClientRepository,
        {
          provide: getRepositoryToken(Category),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<CategoryClientRepository>(CategoryClientRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find paginated categories without filters', async () => {
    const categories = [{ id: '1' }] as Category[];
    queryBuilder.getManyAndCount.mockResolvedValue([categories, 1]);

    const result = await repository.findAllPaginated({}, 0, 20);

    expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'category',
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('category.sort', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'category.createdAt',
      'ASC',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(result).toEqual({ items: categories, total: 1 });
  });

  it('should find paginated categories with shop and parent filters', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    const result = await repository.findAllPaginated(
      { shopId: 'shop-id', parentId: 'parent-id' },
      20,
      20,
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.shopId = :shopId',
      { shopId: 'shop-id' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.parentId = :parentId',
      { parentId: 'parent-id' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('should collect the categories holding the active products a term matches', async () => {
    const categories = [
      { id: '1', name: 'Tees', slug: 'tees', parentId: null },
    ];
    queryBuilder.getRawMany.mockResolvedValue(categories);

    const result = await repository.findSearchCategories(
      'shop-id',
      'ocean tee',
    );

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'category.shopId = :shopId',
      { shopId: 'shop-id' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      SEARCH_MATCHED_CATEGORY_CONDITION,
      {
        shopId: 'shop-id',
        status: ProductStatus.ACTIVE,
        term: 'ocean tee',
      },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('category.sort', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'category.name',
      'ASC',
    );
    expect(result).toEqual(categories);
  });

  it('should escape the LIKE wildcards of a term so they are searched for literally', async () => {
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findSearchCategories('shop-id', '50%_off');

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      SEARCH_MATCHED_CATEGORY_CONDITION,
      expect.objectContaining({ term: '50\\%\\_off' }),
    );
  });
});
