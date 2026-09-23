import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../../../entities/category.entity';
import { CategoryClientRepository } from './category-client.repository';

describe('CategoryClientRepository', () => {
  let repository: CategoryClientRepository;
  let typeOrmRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
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
});
