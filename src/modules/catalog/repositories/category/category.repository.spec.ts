import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../../entities/category.entity';
import { CategoryRepository } from './category.repository';

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  let typeOrmRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        {
          provide: getRepositoryToken(Category),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);
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
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'category.createdAt',
      'DESC',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(result).toEqual({ items: categories, total: 1 });
  });

  it('should find paginated categories with shop and parent filters', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await repository.findAllPaginated(
      { shopId: 'shop-id', parentId: 'parent-id' },
      20,
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
  });

  it('should find category by id', async () => {
    const category = { id: '1' } as Category;
    typeOrmRepository.findOne.mockResolvedValue(category);

    const result = await repository.findById('1');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(category);
  });

  it('should throw when category is not found by id', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return nullable category by id', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    const result = await repository.findOneById('missing');

    expect(result).toBeNull();
  });

  it('should find category by shop id and slug', async () => {
    const category = { id: '1', shopId: 'shop-id', slug: 'accessories' };
    typeOrmRepository.findOne.mockResolvedValue(category);

    const result = await repository.findByShopIdAndSlug(
      'shop-id',
      'accessories',
    );

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { shopId: 'shop-id', slug: 'accessories' },
    });
    expect(result).toEqual(category);
  });

  it('should create category entity', () => {
    const payload = { shopId: 'shop-id', name: 'Accessories' };
    const category = { id: '1', ...payload };
    typeOrmRepository.create.mockReturnValue(category);

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(category);
  });

  it('should save category entity', async () => {
    const category = { id: '1' } as Category;
    typeOrmRepository.save.mockResolvedValue(category);

    const result = await repository.save(category);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(category);
    expect(result).toEqual(category);
  });

  it('should remove category entity', async () => {
    const category = { id: '1' } as Category;
    typeOrmRepository.remove.mockResolvedValue(category);

    const result = await repository.remove(category);

    expect(typeOrmRepository.remove).toHaveBeenCalledWith(category);
    expect(result).toEqual(category);
  });
});
