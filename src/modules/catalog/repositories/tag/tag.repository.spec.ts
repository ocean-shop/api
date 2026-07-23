import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tag } from '../../entities/tag.entity';
import { TagRepository } from './tag.repository';

describe('TagRepository', () => {
  let repository: TagRepository;
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
        TagRepository,
        {
          provide: getRepositoryToken(Tag),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<TagRepository>(TagRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find paginated tags without filters', async () => {
    const tags = [{ id: '1' }] as Tag[];
    queryBuilder.getManyAndCount.mockResolvedValue([tags, 1]);

    const result = await repository.findAllPaginated({}, 0, 20);

    expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('tag');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('tag.createdAt', 'DESC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(result).toEqual({ items: tags, total: 1 });
  });

  it('should find paginated tags with shop filter', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await repository.findAllPaginated({ shopId: 'shop-id' }, 20, 20);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('tag.shopId = :shopId', {
      shopId: 'shop-id',
    });
  });

  it('should find paginated tags with name filter', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await repository.findAllPaginated({ name: 'summer' }, 0, 20);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('tag.name ILIKE :name', {
      name: '%summer%',
    });
  });

  it('should find tag by id', async () => {
    const tag = { id: '1' } as Tag;
    typeOrmRepository.findOne.mockResolvedValue(tag);

    const result = await repository.findById('1');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(tag);
  });

  it('should throw when tag is not found by id', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find tag by shop id and name', async () => {
    const tag = { id: '1', shopId: 'shop-id', name: 'Summer Sale' };
    typeOrmRepository.findOne.mockResolvedValue(tag);

    const result = await repository.findByShopIdAndName(
      'shop-id',
      'Summer Sale',
    );

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { shopId: 'shop-id', name: 'Summer Sale' },
    });
    expect(result).toEqual(tag);
  });

  it('should create tag entity', () => {
    const payload = { shopId: 'shop-id', name: 'Summer Sale' };
    const tag = { id: '1', ...payload };
    typeOrmRepository.create.mockReturnValue(tag);

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(tag);
  });

  it('should save tag entity', async () => {
    const tag = { id: '1' } as Tag;
    typeOrmRepository.save.mockResolvedValue(tag);

    const result = await repository.save(tag);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(tag);
    expect(result).toEqual(tag);
  });

  it('should remove tag entity', async () => {
    const tag = { id: '1' } as Tag;
    typeOrmRepository.remove.mockResolvedValue(tag);

    const result = await repository.remove(tag);

    expect(typeOrmRepository.remove).toHaveBeenCalledWith(tag);
    expect(result).toEqual(tag);
  });
});
